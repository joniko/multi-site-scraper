"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const browser_1 = require("./utils/browser");
const logger_1 = require("./utils/logger");
const ba_1 = require("./scrapers/ba");
const csv_1 = require("./utils/csv");
const program = new commander_1.Command();
program
    .name('ba-organizaciones-scraper')
    .description('Scraper de Organizaciones Civiles de Buenos Aires - rápido y exacto')
    .option('-H, --headless', 'Ejecutar en headless', false)
    .option('-c, --concurrency <num>', 'Solicitudes concurrentes', (v) => parseInt(v, 10), 6)
    .option('-t, --timeout <ms>', 'Timeout por página (ms)', (v) => parseInt(v, 10), 20000)
    .option('-s, --start <page>', 'Página inicial', (v) => parseInt(v, 10), 1)
    .option('-e, --end <page>', 'Página final (opcional)', (v) => parseInt(v, 10))
    .option('-o, --output <file>', 'Archivo CSV de salida', 'organizaciones_ba.csv')
    .parse(process.argv);
const opts = program.opts();
async function main() {
    const spinner = (0, ora_1.default)('Inicializando navegador...').start();
    const browser = await (0, browser_1.launchBrowser)({ headless: opts.headless, timeoutMs: opts.timeout });
    const page = await (0, browser_1.newPage)(browser, opts.timeout);
    spinner.succeed('Navegador listo');
    try {
        logger_1.logger.info(`Inicio scraping: headless=${opts.headless}, concurrency=${opts.concurrency}`);
        const started = Date.now();
        const results = await (0, ba_1.runBAScraper)(page, {
            browser,
            timeoutMs: opts.timeout,
            concurrency: opts.concurrency,
            startPage: opts.start,
            endPage: opts.end
        });
        const duration = ((Date.now() - started) / 1000).toFixed(1);
        const ok = results.filter((r) => r.success);
        const fail = results.length - ok.length;
        console.log(chalk_1.default.green(`\n✅ Scraping completado en ${duration}s`));
        console.log(chalk_1.default.green(`   Registros OK: ${ok.length}`));
        console.log(chalk_1.default.yellow(`   Registros con error: ${fail}`));
        await (0, csv_1.writeCsv)(opts.output, results);
        console.log(chalk_1.default.cyan(`\n📄 CSV guardado en ${opts.output}`));
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error crítico: ${err.message}`));
    }
    finally {
        await page.close();
        await browser.close();
    }
}
main().catch((e) => {
    console.error(e);
    process.exit(1);
});
//# sourceMappingURL=index.js.map