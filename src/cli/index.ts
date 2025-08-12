import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import { launchBrowser, newPage } from '../utils/browser';
import { getSite } from '../core/registry';
import { runPipeline } from '../core/pipeline';
import { createCsvAdapter } from '../core/storage/csv.adapter';

const program = new Command();

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

const opts = program.opts<{
  site: string;
  from: number;
  to?: number;
  headless: boolean;
  concurrency: number;
  timeout: number;
  output: string;
}>();

async function main() {
  const spinner = ora('Inicializando navegador...').start();
  const browser = await launchBrowser({ headless: opts.headless, timeoutMs: opts.timeout });
  const page = await newPage(browser, opts.timeout);
  spinner.succeed('Navegador listo');

  try {
    const scraper = getSite(opts.site);
    const schemaShape = (scraper.recordSchema as any).shape as Record<string, unknown>;
    const headers = Object.keys(schemaShape).map((k) => ({ id: k, title: k }));
    const storage = createCsvAdapter<any>(headers);

    await runPipeline({
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

    console.log(chalk.green(`\n✅ Scraping completado`));
    console.log(chalk.cyan(`\n📄 CSV guardado en ${opts.output}`));
  } catch (err) {
    console.error(chalk.red(`Error: ${(err as Error).message}`));
  } finally {
    await page.close();
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


