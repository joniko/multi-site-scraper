#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const eventick_1 = require("../scrapers/eventick");
const logger_1 = require("../utils/logger");
async function testEventickScraper() {
    logger_1.logger.info('🧪 Iniciando scraping completo de Eventick');
    const scraper = new eventick_1.EventickScraper({
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
        logger_1.logger.info('✅ Scraping completado exitosamente');
        logger_1.logger.info('📁 Revisa el archivo eventick_complete.csv para ver los resultados');
    }
    catch (error) {
        logger_1.logger.error('❌ Error durante el scraping:', error);
        process.exit(1);
    }
}
// Ejecutar la prueba
testEventickScraper();
//# sourceMappingURL=test-eventick.js.map