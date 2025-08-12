import pLimit from 'p-limit';
import { Browser, Page } from 'puppeteer';
import { Organization, OrganizationSchema } from '../types/organization';
import { navigateWithRetry, newPage, safeText } from '../utils/browser';
import { logger } from '../utils/logger';
import { appendCsv } from '../utils/csv';

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
  // Empezar por la página 0 (la UI muestra 1, pero el query es 0-based)
  await navigateWithRetry(page, buildSearchUrl(0), 3, 'networkidle2');
  await page.waitForFunction(
    () => new URL(window.location.href).searchParams.get('page') === '0',
    { timeout: 15000 }
  );
  await page.waitForFunction(
    (sels: string[]) => sels.some((sel) => !!document.querySelector(sel)),
    { timeout: 15000 },
    ['.card-deck', '.view-content', '.cards', '.search-results']
  );

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

  // Confirmar que la URL activa contiene el page correcto (la web no cambia la URL al navegar manualmente)
  await page.waitForFunction(
    (expected) => new URL(window.location.href).searchParams.get('page') === String(expected),
    { timeout: 15000 },
    pageNum
  );

  // Esperar a que el contenedor de resultados esté presente
  await page.waitForFunction(
    (sels: string[]) => sels.some((sel) => !!document.querySelector(sel)),
    { timeout: 15000 },
    ['.card-deck', '.view-content', '.cards', '.search-results']
  );

  // Extraer enlaces de tarjetas, siendo tolerantes con variaciones de markup
  const links = await page.$$eval(
    ['.card-deck a.card', '.view-content a', '.cards a', '.search-results a'].join(','),
    (nodes) => {
      const urls = Array.from(nodes)
        .map((n) => (n as HTMLAnchorElement).href)
        .filter((href) => href && href.includes('/organizacion/'));
      return Array.from(new Set(urls));
    }
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
  outputPath: string;
}

export const runBAScraper = async (
  page: Page,
  options: RunOptions
): Promise<Organization[]> => {
  // Si se provee endPage, respetamos el rango explícito sin depender de la detección automática
  let lastPage: number;
  if (typeof options.endPage === 'number') {
    lastPage = options.endPage;
    logger.info(`Rango a procesar (forzado): ${options.startPage}-${lastPage}`);
  } else {
    const totalPages = await getTotalPages(page);
    lastPage = totalPages;
    logger.info(`Páginas totales detectadas: ${totalPages}. Rango a procesar: ${options.startPage}-${lastPage}`);
  }

  // Reusar la misma page para listar links por página y procesar por lotes con escritura incremental
  const allResults: Organization[] = [];
  for (let p = options.startPage; p <= lastPage; p++) {
    const links = await extractLinksFromPage(page, p);
    logger.info(`Página ${p}: ${links.length} enlaces`);

    const limit = pLimit(options.concurrency);
    const tasks = links.map((url) =>
      limit(() => extractOrganization(options.browser, url, options.timeoutMs))
    );
    const batch = await Promise.all(tasks);

    // Escritura incremental por página
    try {
      await appendCsv(options.outputPath, batch);
      logger.info(`Escritos ${batch.length} registros al CSV (página ${p}).`);
    } catch (err) {
      logger.warn(`Error escribiendo CSV en página ${p}: ${(err as Error).message}`);
    }

    allResults.push(...batch);
    await page.waitForTimeout(500);
  }

  return allResults;
};


