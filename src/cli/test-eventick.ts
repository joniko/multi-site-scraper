#!/usr/bin/env node

import { EventickScraper } from '../scrapers/eventick';
import { logger } from '../utils/logger';

async function testEventickScraper(): Promise<void> {
  logger.info('🧪 Iniciando scraping completo de Eventick');
  
  const scraper = new EventickScraper({
    eventIds: [221, 222, 238, 243, 248, 258, 263, 268, 273, 278, 293, 307, 312, 313, 318, 320, 325], // Todos los IDs conocidos
    headless: true, // Ejecutar en modo headless para mayor velocidad
    maxConcurrent: 3, // Procesar 3 eventos simultáneamente
    delayBetweenRequests: 1000, // Delay entre lotes
    outputFile: 'eventick_complete.csv',
    verbose: true // Mostrar información detallada
  });

  try {
    await scraper.initialize();
    await scraper.scrape();
    await scraper.close();
    
    logger.info('✅ Scraping completado exitosamente');
    logger.info('📁 Revisa el archivo eventick_complete.csv para ver los resultados');
  } catch (error) {
    logger.error('❌ Error durante el scraping:', error);
    process.exit(1);
  }
}

// Ejecutar la prueba
testEventickScraper();
