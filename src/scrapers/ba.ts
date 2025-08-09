import pLimit from 'p-limit';
import { Browser, Page } from 'puppeteer';
import { Organization, OrganizationSchema } from '../types/organization';
import { navigateWithRetry, newPage, safeText } from '../utils/browser';
import { logger } from '../utils/logger';

const BASE = 'https://buenosaires.gob.ar';
const SEARCH = `${BASE}/organizaciones-civiles-buscador`;

const buildSearchUrl = (page: number): string => {
  const params = new URLSearchParams({
    field_target_population_value: 'All',
    field_topic_value: 'All',
    field_service_value: 'All',
    title: '',
    field_address_line2: '',
    page: String(page)
  });
  return `${SEARCH}?${params.toString()}`;
};

export const getTotalPages = async (page: Page): Promise<number> => {
  await navigateWithRetry(page, buildSearchUrl(1), 3, 'networkidle2');
  await page.waitForSelector('.card-deck');

  const pages = await page.$$eval('.pager li a', (as) =>
    as
      .map((a) => (a.textContent || '').trim())
      .filter((t) => /^\d+$/.test(t))
      .map((t) => Number(t))
  );
  if (pages.length === 0) return 1;
  return Math.max(...pages);
};

export const extractLinksFromPage = async (page: Page, pageNum: number): Promise<string[]> => {
  await navigateWithRetry(page, buildSearchUrl(pageNum), 3, 'networkidle2');
  await page.waitForSelector('.card-deck');
  const links = await page.$$eval('.card-deck a.card', (cards) =>
    cards
      .map((c) => (c as HTMLAnchorElement).href)
      .filter((href) => href && href.includes('/organizacion/'))
  );
  return links;
};

export const extractOrganization = async (browser: Browser, url: string, timeoutMs: number): Promise<Organization> => {
  const page = await newPage(browser, timeoutMs);
  try {
    await navigateWithRetry(page, url, 3, 'networkidle2');
    await page.waitForSelector('.layout-builder__layout');

    const data = await page.evaluate(() => {
      const byXPath = (xp: string): string | undefined => {
        const res = document.evaluate(xp, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
        const node = res.singleNodeValue as HTMLElement | null;
        return node?.textContent?.trim();
      };
      const bySel = (sel: string): string | undefined => document.querySelector(sel)?.textContent?.trim();

      const nombre = document.querySelector('h1')?.textContent?.trim() || document.title.split(' | ')[0];
      const email = byXPath("//strong[contains(text(), 'Email de contacto')]/following-sibling::div//p") ||
        bySel('.field--name-field-email p');
      const telefono = byXPath("//strong[contains(text(), 'Teléfono')]/following-sibling::div//p") ||
        bySel('.field--name-field-phone p');
      const direccionRaw = (document.querySelector('.field--name-field-address .address') as HTMLElement | null)?.innerText;
      const direccion = direccionRaw ? direccionRaw.replace(/\s+/g, ' ').replace(/\n/g, ', ').trim() : undefined;
      const objetivos = byXPath("//strong[contains(text(), 'Objetivos')]/following-sibling::div//p");
      const area_tematica = byXPath("//strong[contains(text(), 'Area tematica')]/following-sibling::div//p") ||
        bySel('.field--name-field-topic p');

      return { nombre, email, telefono, direccion, objetivos, area_tematica };
    });

    const org: Organization = {
      url,
      nombre: safeText(data.nombre, 'No encontrado'),
      email: data.email ? data.email : 'No encontrado',
      telefono: data.telefono ? data.telefono : 'No encontrado',
      direccion: data.direccion ? data.direccion : 'No encontrado',
      objetivos: data.objetivos ? data.objetivos : 'No encontrado',
      area_tematica: data.area_tematica ? data.area_tematica : 'No encontrado',
      scraped_at: new Date().toISOString(),
      success: true
    };

    // Validación
    OrganizationSchema.parse(org);
    return org;
  } catch (err) {
    logger.warn(`Fallo extrayendo ${url}: ${(err as Error).message}`);
    return {
      url,
      nombre: 'Error',
      email: 'Error',
      telefono: 'Error',
      direccion: 'Error',
      objetivos: 'Error',
      area_tematica: 'Error',
      scraped_at: new Date().toISOString(),
      success: false
    };
  } finally {
    await page.close();
  }
};

export interface RunOptions {
  browser: Browser;
  timeoutMs: number;
  concurrency: number;
  startPage: number;
  endPage?: number;
}

export const runBAScraper = async (
  page: Page,
  options: RunOptions
): Promise<Organization[]> => {
  const totalPages = await getTotalPages(page);
  const lastPage = options.endPage ? Math.min(options.endPage, totalPages) : totalPages;
  logger.info(`Páginas totales: ${totalPages}. Rango a procesar: ${options.startPage}-${lastPage}`);

  // Reusar la misma page para listar links por página
  const allLinks: string[] = [];
  for (let p = options.startPage; p <= lastPage; p++) {
    const links = await extractLinksFromPage(page, p);
    logger.info(`Página ${p}: ${links.length} enlaces`);
    allLinks.push(...links);
    await page.waitForTimeout(500);
  }

  const limit = pLimit(options.concurrency);
  const tasks = allLinks.map((url) =>
    limit(() => extractOrganization(options.browser, url, options.timeoutMs))
  );
  const results = await Promise.all(tasks);
  return results;
};


