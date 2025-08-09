import puppeteer, { Browser, HTTPResponse, Page } from 'puppeteer';
import puppeteerExtra from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteerExtra.use(StealthPlugin());

export interface BrowserConfig {
  headless: boolean;
  timeoutMs: number;
}

export const launchBrowser = async (config: BrowserConfig): Promise<Browser> => {
  const browser = await puppeteerExtra.launch({
    headless: config.headless,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--window-size=1920,1080'
    ]
  });
  return browser as unknown as Browser; // types alignment
};

export const newPage = async (browser: Browser, timeoutMs: number): Promise<Page> => {
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1000 });
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
  );
  page.setDefaultTimeout(timeoutMs);
  return page;
};

export const navigateWithRetry = async (
  page: Page,
  url: string,
  attempts: number,
  waitUntil: 'load' | 'domcontentloaded' | 'networkidle0' | 'networkidle2' = 'networkidle2'
): Promise<HTTPResponse | null> => {
  let lastError: unknown = null;
  for (let i = 1; i <= attempts; i++) {
    try {
      const resp = await page.goto(url, { waitUntil });
      return resp;
    } catch (err) {
      lastError = err;
      await page.waitForTimeout(1000 * i);
    }
  }
  throw lastError ?? new Error('Navigation failed');
};

export const safeText = (value: string | null | undefined, fallback = 'No encontrado'): string => {
  const v = (value ?? '').trim();
  return v.length > 0 ? v : fallback;
};


