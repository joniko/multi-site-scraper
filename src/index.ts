import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { launchBrowser, newPage } from './utils/browser';
import { logger } from './utils/logger';
import { runBAScraper } from './scrapers/ba';
import { writeCsv, appendCsv } from './utils/csv';

const program = new Command();

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

const opts = program.opts<{
  headless: boolean;
  concurrency: number;
  timeout: number;
  start: number;
  end?: number;
  output: string;
}>();

async function main() {
  const spinner = ora('Inicializando navegador...').start();
  const browser = await launchBrowser({ headless: opts.headless, timeoutMs: opts.timeout });
  const page = await newPage(browser, opts.timeout);
  spinner.succeed('Navegador listo');

  try {
    logger.info(`Inicio scraping: headless=${opts.headless}, concurrency=${opts.concurrency}`);
    const started = Date.now();
    const results = await runBAScraper(page, {
      browser,
      timeoutMs: opts.timeout,
      concurrency: opts.concurrency,
      startPage: opts.start,
      endPage: opts.end,
      outputPath: opts.output
    });
    const duration = ((Date.now() - started) / 1000).toFixed(1);

    const ok = results.filter((r) => r.success);
    const fail = results.length - ok.length;
    console.log(chalk.green(`\n✅ Scraping completado en ${duration}s`));
    console.log(chalk.green(`   Registros OK: ${ok.length}`));
    console.log(chalk.yellow(`   Registros con error: ${fail}`));

    // Ya escribimos incrementalmente; no sobrescribir el CSV al final para no duplicar
    // Si se desea exportar un snapshot completo aparte, se puede usar otra ruta de salida.
    console.log(chalk.cyan(`\n📄 CSV guardado en ${opts.output}`));
  } catch (err) {
    console.error(chalk.red(`Error crítico: ${(err as Error).message}`));
  } finally {
    await page.close();
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


