import pLimit from 'p-limit';
import type { Page } from 'puppeteer';
import { logger } from '../utils/logger';
import type { RecordBase, SiteScraper, StorageAdapter, PipelineOptions } from './contracts';

export const runPipeline = async <R extends RecordBase>({
  scraper,
  storage,
  options
}: {
  scraper: SiteScraper<R>;
  storage: StorageAdapter<R>;
  options: PipelineOptions;
}): Promise<R[]> => {
  const { context, outputPath, pagination, delayBetweenBatchesMs = 500 } = options;

  await storage.init(outputPath);

  const page: Page = context.page;
  const endPage =
    typeof pagination.endPage === 'number'
      ? pagination.endPage
      : await scraper.getTotalPages(page);

  const all: R[] = [];
  for (let p = pagination.startPage; p <= endPage; p++) {
    const listUrl = scraper.buildListUrl(p);
    logger.info(`[${scraper.siteName}] Navegando lista p=${p} → ${listUrl}`);
    await page.goto(listUrl, { waitUntil: 'networkidle2' });

    const links = await scraper.extractLinksFromList(page, p);
    logger.info(`[${scraper.siteName}] p=${p}, enlaces únicos: ${links.length}`);

    const limit = pLimit(context.concurrency);
    const batch = await Promise.all(
      links.map((url) => limit(() => scraper.extractRecord(context.browser, url, context.timeoutMs)))
    );

    await storage.appendBatch(batch);
    all.push(...batch);

    if (delayBetweenBatchesMs > 0) {
      await page.waitForTimeout(delayBetweenBatchesMs);
    }
  }

  await storage.close();
  return all;
};


