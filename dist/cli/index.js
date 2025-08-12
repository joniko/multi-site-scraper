"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const ora_1 = __importDefault(require("ora"));
const chalk_1 = __importDefault(require("chalk"));
const browser_1 = require("../utils/browser");
const registry_1 = require("../core/registry");
const pipeline_1 = require("../core/pipeline");
const csv_adapter_1 = require("../core/storage/csv.adapter");
const program = new commander_1.Command();
program
    .name('scraper')
    .description('CLI para ejecutar scrapers de distintos sitios')
    .option('-S, --site <name>', 'Nombre del sitio (ba, ...)', 'ba')
    .option('--from <n>', 'Página inicial', (v) => parseInt(v, 10), 1)
    .option('--to <n>', 'Página final', (v) => parseInt(v, 10))
    .option('-H, --headless', 'Headless', true)
    .option('-c, --concurrency <n>', 'Concurrencia', (v) => parseInt(v, 10), 6)
    .option('-t, --timeout <ms>', 'Timeout ms', (v) => parseInt(v, 10), 20000)
    .option('-o, --output <file>', 'Archivo de salida', 'organizaciones_ba.csv')
    .parse(process.argv);
const opts = program.opts();
async function main() {
    const spinner = (0, ora_1.default)('Inicializando navegador...').start();
    const browser = await (0, browser_1.launchBrowser)({ headless: opts.headless, timeoutMs: opts.timeout });
    const page = await (0, browser_1.newPage)(browser, opts.timeout);
    spinner.succeed('Navegador listo');
    try {
        const scraper = (0, registry_1.getSite)(opts.site);
        const schemaShape = scraper.recordSchema.shape;
        const headers = Object.keys(schemaShape).map((k) => ({ id: k, title: k }));
        const storage = (0, csv_adapter_1.createCsvAdapter)(headers);
        await (0, pipeline_1.runPipeline)({
            scraper,
            storage,
            options: {
                context: { browser, page, timeoutMs: opts.timeout, concurrency: opts.concurrency },
                outputPath: opts.output,
                pagination: { startPage: opts.from, endPage: opts.to },
                retry: { maxAttempts: 3, baseDelayMs: 1000, backoffMultiplier: 2 },
                delayBetweenBatchesMs: 500
            }
        });
        console.log(chalk_1.default.green(`\n✅ Scraping completado`));
        console.log(chalk_1.default.cyan(`\n📄 CSV guardado en ${opts.output}`));
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
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