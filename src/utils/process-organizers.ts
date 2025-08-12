import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import { logger } from './logger';

interface EventickRecord {
  URL: string;
  'Event ID': number;
  'Event Name': string;
  'Organizer Phone': string;
  'Organizer Email': string;
  'Organizer Website': string;
  'Scraped At': string;
  Success: boolean;
}

interface OrganizerRecord {
  organizer_id: string;
  organizer_name: string;
  organizer_email: string;
  organizer_phone: string;
  organizer_website: string;
  events_count: number;
  events_list: string;
  first_event: string;
  last_event: string;
  contact_priority: string;
}

function generateOrganizerId(email: string, website: string): string {
  // Crear un ID único basado en email o website
  const base = email !== 'No encontrado' ? email.split('@')[0] : 
               website !== 'No encontrado' ? new URL(website).hostname.split('.')[0] : 
               'unknown';
  return base.toLowerCase().replace(/[^a-z0-9]/g, '_');
}

function determineContactPriority(email: string, phone: string, website: string): string {
  if (email !== 'No encontrado' && email !== 'Error') {
    return 'Alta';
  } else if (phone !== 'No encontrado' && phone !== 'Error') {
    return 'Media';
  } else if (website !== 'No encontrado' && website !== 'Error') {
    return 'Baja';
  }
  return 'Sin contacto';
}

function extractOrganizerName(email: string, website: string): string {
  if (email !== 'No encontrado' && email !== 'Error') {
    const domain = email.split('@')[1];
    if (domain) {
      return domain.split('.')[0].replace(/[^a-zA-Z]/g, ' ').trim();
    }
  }
  
  if (website !== 'No encontrado' && website !== 'Error') {
    try {
      const url = new URL(website);
      return url.hostname.split('.')[0].replace(/[^a-zA-Z]/g, ' ').trim();
    } catch {
      return 'Organizador';
    }
  }
  
  return 'Organizador';
}

export async function processOrganizers(inputFile: string, outputFile: string): Promise<void> {
  logger.info(`Procesando organizadores desde ${inputFile}...`);
  
  try {
    // Leer el archivo CSV original
    const csvContent = fs.readFileSync(inputFile, 'utf-8');
    const records: EventickRecord[] = parse(csvContent, {
      columns: true,
      skip_empty_lines: true
    });

    logger.info(`Leídos ${records.length} eventos del archivo original`);

    // Agrupar por organizador (email + website)
    const organizersMap = new Map<string, {
      email: string;
      phone: string;
      website: string;
      events: string[];
      firstEvent: string;
      lastEvent: string;
    }>();

    records.forEach(record => {
      if (!record.Success) return;
      
      const key = `${record['Organizer Email']}|${record['Organizer Website']}`;
      
      if (!organizersMap.has(key)) {
        organizersMap.set(key, {
          email: record['Organizer Email'],
          phone: record['Organizer Phone'],
          website: record['Organizer Website'],
          events: [],
          firstEvent: record['Event Name'],
          lastEvent: record['Event Name']
        });
      }
      
      const organizer = organizersMap.get(key)!;
      if (!organizer.events.includes(record['Event Name'])) {
        organizer.events.push(record['Event Name']);
      }
      organizer.lastEvent = record['Event Name'];
    });

    logger.info(`Encontrados ${organizersMap.size} organizadores únicos`);

    // Convertir a formato de salida
    const organizerRecords: OrganizerRecord[] = Array.from(organizersMap.entries()).map(([key, data]) => {
      const organizerId = generateOrganizerId(data.email, data.website);
      const organizerName = extractOrganizerName(data.email, data.website);
      const contactPriority = determineContactPriority(data.email, data.phone, data.website);
      
      return {
        organizer_id: organizerId,
        organizer_name: organizerName,
        organizer_email: data.email,
        organizer_phone: data.phone,
        organizer_website: data.website,
        events_count: data.events.length,
        events_list: data.events.slice(0, 5).join('; '), // Primeros 5 eventos
        first_event: data.firstEvent,
        last_event: data.lastEvent,
        contact_priority: contactPriority
      };
    });

    // Ordenar por prioridad de contacto y cantidad de eventos
    organizerRecords.sort((a, b) => {
      const priorityOrder = { 'Alta': 3, 'Media': 2, 'Baja': 1, 'Sin contacto': 0 };
      const aPriority = priorityOrder[a.contact_priority as keyof typeof priorityOrder];
      const bPriority = priorityOrder[b.contact_priority as keyof typeof priorityOrder];
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      return b.events_count - a.events_count;
    });

    // Generar CSV de organizadores
    const csvOutput = stringify(organizerRecords, {
      header: true,
      columns: [
        'organizer_id',
        'organizer_name', 
        'organizer_email',
        'organizer_phone',
        'organizer_website',
        'events_count',
        'events_list',
        'first_event',
        'last_event',
        'contact_priority'
      ]
    });

    fs.writeFileSync(outputFile, csvOutput);
    
    // Generar estadísticas
    const stats = {
      total_organizers: organizerRecords.length,
      high_priority: organizerRecords.filter(o => o.contact_priority === 'Alta').length,
      medium_priority: organizerRecords.filter(o => o.contact_priority === 'Media').length,
      low_priority: organizerRecords.filter(o => o.contact_priority === 'Baja').length,
      no_contact: organizerRecords.filter(o => o.contact_priority === 'Sin contacto').length,
      avg_events_per_organizer: (organizerRecords.reduce((sum, o) => sum + o.events_count, 0) / organizerRecords.length).toFixed(1)
    };

    logger.info('📊 Estadísticas de organizadores:');
    logger.info(`   Total organizadores: ${stats.total_organizers}`);
    logger.info(`   Prioridad Alta (email): ${stats.high_priority}`);
    logger.info(`   Prioridad Media (teléfono): ${stats.medium_priority}`);
    logger.info(`   Prioridad Baja (website): ${stats.low_priority}`);
    logger.info(`   Sin contacto: ${stats.no_contact}`);
    logger.info(`   Promedio eventos por organizador: ${stats.avg_events_per_organizer}`);
    
    logger.info(`✅ Organizadores procesados y guardados en ${outputFile}`);
    
  } catch (error) {
    logger.error('❌ Error procesando organizadores:', error);
    throw error;
  }
}
