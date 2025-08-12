"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processOrganizers = processOrganizers;
const fs_1 = __importDefault(require("fs"));
const sync_1 = require("csv-parse/sync");
const sync_2 = require("csv-stringify/sync");
const logger_1 = require("./logger");
function generateOrganizerId(email, website) {
    // Crear un ID único basado en email o website
    const base = email !== 'No encontrado' ? email.split('@')[0] :
        website !== 'No encontrado' ? new URL(website).hostname.split('.')[0] :
            'unknown';
    return base.toLowerCase().replace(/[^a-z0-9]/g, '_');
}
function determineContactPriority(email, phone, website) {
    if (email !== 'No encontrado' && email !== 'Error') {
        return 'Alta';
    }
    else if (phone !== 'No encontrado' && phone !== 'Error') {
        return 'Media';
    }
    else if (website !== 'No encontrado' && website !== 'Error') {
        return 'Baja';
    }
    return 'Sin contacto';
}
function extractOrganizerName(email, website) {
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
        }
        catch {
            return 'Organizador';
        }
    }
    return 'Organizador';
}
async function processOrganizers(inputFile, outputFile) {
    logger_1.logger.info(`Procesando organizadores desde ${inputFile}...`);
    try {
        // Leer el archivo CSV original
        const csvContent = fs_1.default.readFileSync(inputFile, 'utf-8');
        const records = (0, sync_1.parse)(csvContent, {
            columns: true,
            skip_empty_lines: true
        });
        logger_1.logger.info(`Leídos ${records.length} eventos del archivo original`);
        // Agrupar por organizador (email + website)
        const organizersMap = new Map();
        records.forEach(record => {
            if (!record.success)
                return;
            const key = `${record.organizer_email}|${record.organizer_website}`;
            if (!organizersMap.has(key)) {
                organizersMap.set(key, {
                    email: record.organizer_email,
                    phone: record.organizer_phone,
                    website: record.organizer_website,
                    events: [],
                    firstEvent: record.event_name,
                    lastEvent: record.event_name
                });
            }
            const organizer = organizersMap.get(key);
            if (!organizer.events.includes(record.event_name)) {
                organizer.events.push(record.event_name);
            }
            organizer.lastEvent = record.event_name;
        });
        logger_1.logger.info(`Encontrados ${organizersMap.size} organizadores únicos`);
        // Convertir a formato de salida
        const organizerRecords = Array.from(organizersMap.entries()).map(([key, data]) => {
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
            const aPriority = priorityOrder[a.contact_priority];
            const bPriority = priorityOrder[b.contact_priority];
            if (aPriority !== bPriority) {
                return bPriority - aPriority;
            }
            return b.events_count - a.events_count;
        });
        // Generar CSV de organizadores
        const csvOutput = (0, sync_2.stringify)(organizerRecords, {
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
        fs_1.default.writeFileSync(outputFile, csvOutput);
        // Generar estadísticas
        const stats = {
            total_organizers: organizerRecords.length,
            high_priority: organizerRecords.filter(o => o.contact_priority === 'Alta').length,
            medium_priority: organizerRecords.filter(o => o.contact_priority === 'Media').length,
            low_priority: organizerRecords.filter(o => o.contact_priority === 'Baja').length,
            no_contact: organizerRecords.filter(o => o.contact_priority === 'Sin contacto').length,
            avg_events_per_organizer: (organizerRecords.reduce((sum, o) => sum + o.events_count, 0) / organizerRecords.length).toFixed(1)
        };
        logger_1.logger.info('📊 Estadísticas de organizadores:');
        logger_1.logger.info(`   Total organizadores: ${stats.total_organizers}`);
        logger_1.logger.info(`   Prioridad Alta (email): ${stats.high_priority}`);
        logger_1.logger.info(`   Prioridad Media (teléfono): ${stats.medium_priority}`);
        logger_1.logger.info(`   Prioridad Baja (website): ${stats.low_priority}`);
        logger_1.logger.info(`   Sin contacto: ${stats.no_contact}`);
        logger_1.logger.info(`   Promedio eventos por organizador: ${stats.avg_events_per_organizer}`);
        logger_1.logger.info(`✅ Organizadores procesados y guardados en ${outputFile}`);
    }
    catch (error) {
        logger_1.logger.error('❌ Error procesando organizadores:', error);
        throw error;
    }
}
//# sourceMappingURL=process-organizers.js.map