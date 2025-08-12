#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const process_organizers_1 = require("../utils/process-organizers");
const logger_1 = require("../utils/logger");
function parseArgs() {
    const args = process.argv.slice(2);
    const options = {};
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        switch (arg) {
            case '--input':
            case '-i':
                options.input = args[++i];
                break;
            case '--output':
            case '-o':
                options.output = args[++i];
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
Procesador de Organizadores - Genera lista única de organizadores para email marketing

Uso: npm run organizers [opciones]

Opciones:
  -i, --input <file>     Archivo CSV de entrada (default: eventick_all_events.csv)
  -o, --output <file>    Archivo CSV de salida (default: organizers_for_email.csv)
  -h, --help             Mostrar esta ayuda

Ejemplos:
  npm run organizers
  npm run organizers --input eventick_all_events.csv --output organizadores_unicos.csv
  npm run organizers --input test_eventick_events.csv --output test_organizers.csv
`);
}
async function main() {
    try {
        const args = parseArgs();
        const inputFile = args.input || 'eventick_all_events.csv';
        const outputFile = args.output || 'organizers_for_email.csv';
        logger_1.logger.info('🚀 Iniciando procesamiento de organizadores');
        logger_1.logger.info(`📁 Entrada: ${inputFile}`);
        logger_1.logger.info(`📁 Salida: ${outputFile}`);
        await (0, process_organizers_1.processOrganizers)(inputFile, outputFile);
        logger_1.logger.info('✅ Procesamiento completado exitosamente');
        logger_1.logger.info(`📧 Lista de organizadores lista para email marketing en: ${outputFile}`);
    }
    catch (error) {
        logger_1.logger.error('❌ Error durante el procesamiento:', error);
        process.exit(1);
    }
}
// Ejecutar si es el archivo principal
if (require.main === module) {
    main();
}
//# sourceMappingURL=process-organizers.js.map