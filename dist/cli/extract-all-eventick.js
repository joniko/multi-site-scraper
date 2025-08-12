#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const eventick_1 = require("../scrapers/eventick");
const logger_1 = require("../utils/logger");
async function extractAllEventickEvents() {
    logger_1.logger.info('🚀 Iniciando extracción completa de eventos de Eventick');
    const eventIds = [
        112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127, 128, 129, 130,
        131, 132, 133, 134, 135, 136, 137, 138, 139, 140, 141, 142, 143, 144, 145, 146, 147, 148, 149, 150,
        151, 152, 153, 154, 155, 156, 157, 158, 159, 160, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170,
        171, 172, 173, 174, 176, 181, 186, 191, 196, 197, 202, 207, 212, 217, 221, 222, 228, 233, 238, 243,
        248, 253, 258, 263, 268, 273, 278, 280, 284, 293, 298, 303, 307, 312, 313, 318, 320, 325, 330, 335
    ];
    const scraper = new eventick_1.EventickScraper({
        eventIds,
        headless: true, // Ejecutar en modo headless para mayor velocidad
        maxConcurrent: 5, // Procesar 5 eventos simultáneamente
        delayBetweenRequests: 800, // Delay entre lotes
        outputFile: 'eventick_all_events.csv',
        verbose: true // Mostrar información detallada
    });
    try {
        await scraper.initialize();
        await scraper.scrape();
        await scraper.close();
        logger_1.logger.info('✅ Extracción completada exitosamente');
        logger_1.logger.info(`📁 Revisa el archivo eventick_all_events.csv para ver los ${eventIds.length} eventos`);
    }
    catch (error) {
        logger_1.logger.error('❌ Error durante la extracción:', error);
        process.exit(1);
    }
}
// Ejecutar la extracción
extractAllEventickEvents();
//# sourceMappingURL=extract-all-eventick.js.map