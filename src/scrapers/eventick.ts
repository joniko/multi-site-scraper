import type { Browser } from 'puppeteer';
import puppeteer from 'puppeteer';
import { eventickScraper } from '../sites/eventick/eventick.scraper';
import { createCsvAdapter } from '../core/storage/csv.adapter';
import { logger } from '../utils/logger';
import type { EventickRecord } from '../types/eventick';

interface EventickScrapingOptions {
  eventIds?: number[]; // Lista específica de IDs de eventos
  startEventId?: number;
  endEventId?: number;
  headless?: boolean;
  maxConcurrent?: number;
  timeout?: number;
  delayBetweenRequests?: number;
  outputFile?: string;
  verbose?: boolean;
}

// IDs de eventos conocidos que existen en Eventick
const KNOWN_EVENT_IDS = [
  112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127, 128, 129, 130,
  131, 132, 133, 134, 135, 136, 137, 138, 139, 140, 141, 142, 143, 144, 145, 146, 147, 148, 149, 150,
  151, 152, 153, 154, 155, 156, 157, 158, 159, 160, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170,
  171, 172, 173, 174, 176, 181, 186, 191, 196, 197, 202, 207, 212, 217, 221, 222, 228, 233, 238, 243,
  248, 253, 258, 263, 268, 273, 278, 280, 284, 293, 298, 303, 307, 312, 313, 318, 320, 325, 330, 335
];

export class EventickScraper {
  private browser: Browser | null = null;
  private storage: ReturnType<typeof createCsvAdapter<EventickRecord>> | null = null;
  private options: Required<EventickScrapingOptions>;

  constructor(options: EventickScrapingOptions = {}) {
    this.options = {
      eventIds: KNOWN_EVENT_IDS, // Usar IDs conocidos por defecto
      startEventId: 1,
      endEventId: 400,
      headless: true,
      maxConcurrent: 3,
      timeout: 30000,
      delayBetweenRequests: 1000,
      outputFile: 'eventick_events.csv',
      verbose: false,
      ...options
    };
  }

  async initialize(): Promise<void> {
    logger.info('Inicializando scraper de Eventick...');
    
    this.browser = await puppeteer.launch({
      headless: this.options.headless,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });

    this.storage = createCsvAdapter<EventickRecord>([
      { id: 'url', title: 'URL' },
      { id: 'event_id', title: 'Event ID' },
      { id: 'event_name', title: 'Event Name' },
      { id: 'organizer_phone', title: 'Organizer Phone' },
      { id: 'organizer_email', title: 'Organizer Email' },
      { id: 'organizer_website', title: 'Organizer Website' },
      { id: 'scraped_at', title: 'Scraped At' },
      { id: 'success', title: 'Success' }
    ]);
    await this.storage.init(this.options.outputFile);
    
    logger.info('Scraper de Eventick inicializado correctamente');
  }

  async scrape(): Promise<void> {
    if (!this.browser || !this.storage) {
      throw new Error('Scraper no inicializado. Llama a initialize() primero.');
    }

    // Determinar qué eventos procesar
    let eventIdsToProcess: number[];
    
    if (this.options.eventIds && this.options.eventIds.length > 0) {
      // Usar lista específica de IDs
      eventIdsToProcess = this.options.eventIds;
      logger.info(`Usando lista específica de ${eventIdsToProcess.length} eventos conocidos`);
    } else {
      // Usar rango secuencial
      eventIdsToProcess = [];
      for (let i = this.options.startEventId; i <= this.options.endEventId; i++) {
        eventIdsToProcess.push(i);
      }
      logger.info(`Usando rango secuencial del ${this.options.startEventId} al ${this.options.endEventId}`);
    }

    const totalEvents = eventIdsToProcess.length;
    let successfulExtractions = 0;
    let failedExtractions = 0;
    const startTime = Date.now();

    logger.info(`Iniciando scraping de ${totalEvents} eventos`);
    logger.info(`IDs a procesar: ${eventIdsToProcess.slice(0, 10).join(', ')}${eventIdsToProcess.length > 10 ? '...' : ''}`);

    // Procesar eventos en lotes para controlar la concurrencia
    const batchSize = this.options.maxConcurrent;
    
    for (let i = 0; i < eventIdsToProcess.length; i += batchSize) {
      const batch = [];
      const endIndex = Math.min(i + batchSize, eventIdsToProcess.length);
      
      for (let j = i; j < endIndex; j++) {
        const eventId = eventIdsToProcess[j];
        batch.push(this.processEvent(eventId));
      }

      const results = await Promise.allSettled(batch);
      
      for (const result of results) {
        if (result.status === 'fulfilled' && result.value.success) {
          successfulExtractions++;
        } else {
          failedExtractions++;
        }
      }

      // Guardar resultados del lote
      const successfulResults = results
        .filter((r): r is PromiseFulfilledResult<EventickRecord> => 
          r.status === 'fulfilled' && r.value.success
        )
        .map(r => r.value);

      if (successfulResults.length > 0) {
        await this.storage.appendBatch(successfulResults);
      }

      // Mostrar progreso
      const processed = Math.min(endIndex, eventIdsToProcess.length);
      const progress = ((processed / totalEvents) * 100).toFixed(1);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      
      logger.info(`Progreso: ${progress}% (${processed}/${totalEvents}) - Exitosos: ${successfulExtractions}, Fallidos: ${failedExtractions} - Tiempo: ${elapsed}s`);

      // Delay entre lotes
      if (endIndex < eventIdsToProcess.length) {
        await this.delay(this.options.delayBetweenRequests);
      }
    }

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
    logger.info(`Scraping completado en ${totalTime}s`);
    logger.info(`Resultados: ${successfulExtractions} exitosos, ${failedExtractions} fallidos`);
  }

  private async processEvent(eventId: number): Promise<EventickRecord> {
    const url = `https://eventick.com.ar/evento/${eventId}`;
    
    try {
      if (this.options.verbose) {
        logger.info(`Procesando evento ${eventId}: ${url}`);
      }

      const record = await eventickScraper.extractRecord(
        this.browser!,
        url,
        this.options.timeout
      );

      if (record.success && this.options.verbose) {
        logger.info(`✅ Evento ${eventId}: "${record.event_name}" - Tel: ${record.organizer_phone}, Email: ${record.organizer_email}`);
      } else if (!record.success && this.options.verbose) {
        logger.info(`❌ Evento ${eventId}: No encontrado o error`);
      }

      return record;
    } catch (error) {
      logger.error(`Error procesando evento ${eventId}:`, error);
      return {
        url,
        event_id: eventId,
        event_name: 'Error',
        organizer_phone: 'Error',
        organizer_email: 'Error',
        organizer_website: 'Error',
        scraped_at: new Date().toISOString(),
        success: false
      };
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async close(): Promise<void> {
    if (this.storage) {
      await this.storage.close();
    }
    
    if (this.browser) {
      await this.browser.close();
    }
    
    logger.info('Scraper de Eventick cerrado');
  }
}
