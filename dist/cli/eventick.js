#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const eventick_1 = require("../scrapers/eventick");
const logger_1 = require("../utils/logger");
function parseArgs() {
    const args = process.argv.slice(2);
    const options = {};
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        switch (arg) {
            case '--events':
            case '-i':
                options.eventIds = args[++i];
                break;
            case '--start':
            case '-s':
                options.startId = parseInt(args[++i]);
                break;
            case '--end':
            case '-e':
                options.endId = parseInt(args[++i]);
                break;
            case '--headless':
                options.headless = true;
                break;
            case '--no-headless':
                options.headless = false;
                break;
            case '--verbose':
            case '-v':
                options.verbose = true;
                break;
            case '--output':
            case '-o':
                options.output = args[++i];
                break;
            case '--concurrent':
            case '-c':
                options.concurrent = parseInt(args[++i]);
                break;
            case '--delay':
            case '-d':
                options.delay = parseInt(args[++i]);
                break;
            case '--help':
            case '-h':
                showHelp();
                process.exit(0);
                break;
        }
    }
    return options;
}
function showHelp() {
    console.log(`
Eventick Scraper - Extrae información de eventos y organizadores

Uso: npm run eventick [opciones]

Opciones:
  -i, --events <ids>      Lista de IDs de eventos separados por comas (ej: 221,222,238)
  -s, --start <id>        ID del primer evento a verificar (default: 1)
  -e, --end <id>          ID del último evento a verificar (default: 400)
  --headless              Ejecutar en modo headless (default: true)
  --no-headless           Mostrar el navegador durante la ejecución
  -v, --verbose           Mostrar información detallada de cada evento
  -o, --output <file>     Archivo de salida CSV (default: eventick_events.csv)
  -c, --concurrent <num>  Número de eventos concurrentes (default: 3)
  -d, --delay <ms>        Delay entre lotes en ms (default: 1000)
  -h, --help              Mostrar esta ayuda

Ejemplos:
  npm run eventick --events 221,222,238,243,248 --verbose
  npm run eventick --start 1 --end 100 --verbose
  npm run eventick --no-headless --concurrent 5
  npm run eventick --output eventos_argentina.csv
`);
}
async function main() {
    try {
        const args = parseArgs();
        logger_1.logger.info('🚀 Iniciando Eventick Scraper');
        // Parsear IDs de eventos si se proporcionan
        const eventIds = args.eventIds ?
            args.eventIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id)) :
            undefined;
        const scraper = new eventick_1.EventickScraper({
            eventIds,
            startEventId: args.startId,
            endEventId: args.endId,
            headless: args.headless,
            maxConcurrent: args.concurrent,
            delayBetweenRequests: args.delay,
            outputFile: args.output,
            verbose: args.verbose
        });
        await scraper.initialize();
        await scraper.scrape();
        await scraper.close();
        logger_1.logger.info('✅ Scraping completado exitosamente');
    }
    catch (error) {
        logger_1.logger.error('❌ Error durante el scraping:', error);
        process.exit(1);
    }
}
// Ejecutar si es el archivo principal
if (require.main === module) {
    main();
}
//# sourceMappingURL=eventick.js.map