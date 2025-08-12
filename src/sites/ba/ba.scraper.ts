import { z } from 'zod';
import type { Browser, Page } from 'puppeteer';
import { navigateWithRetry, newPage } from '../../utils/browser';
import type { SiteScraper } from '../../core/contracts';

export const BaRecordSchema = z.object({
  url: z.string().url(),
  nombre: z.string().min(1),
  email: z.string().optional().or(z.literal('No encontrado')),
  telefono: z.string().optional().or(z.literal('No encontrado')),
  direccion: z.string().optional().or(z.literal('No encontrado')),
  objetivos: z.string().optional().or(z.literal('No encontrado')),
  area_tematica: z.string().optional().or(z.literal('No encontrado')),
  scraped_at: z.string().datetime(),
  success: z.boolean()
});

export type BaRecord = z.infer<typeof BaRecordSchema>;

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

export const baScraper: SiteScraper<BaRecord> = {
  siteName: 'ba',
  recordSchema: BaRecordSchema,

  async getTotalPages(page: Page): Promise<number> {
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
    return pages.length === 0 ? 1 : Math.max(...pages);
  },

  buildListUrl(pageNum: number): string {
    return buildSearchUrl(pageNum);
  },

  async extractLinksFromList(page: Page, pageNum: number): Promise<string[]> {
    await navigateWithRetry(page, buildSearchUrl(pageNum), 3, 'networkidle2');
    await page.waitForFunction(
      (expected) => new URL(window.location.href).searchParams.get('page') === String(expected),
      { timeout: 15000 },
      pageNum
    );
    await page.waitForFunction(
      (sels: string[]) => sels.some((sel) => !!document.querySelector(sel)),
      { timeout: 15000 },
      ['.card-deck', '.view-content', '.cards', '.search-results']
    );
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
  },

  async extractRecord(browser: Browser, url: string, timeoutMs: number): Promise<BaRecord> {
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
        const email =
          byXPath("//strong[contains(text(), 'Email de contacto')]/following-sibling::div//p") ||
          bySel('.field--name-field-email p');
        const telefono =
          byXPath("//strong[contains(text(), 'Teléfono')]/following-sibling::div//p") ||
          bySel('.field--name-field-phone p');
        const direccionRaw = (document.querySelector('.field--name-field-address .address') as HTMLElement | null)?.innerText;
        const direccion = direccionRaw ? direccionRaw.replace(/\s+/g, ' ').replace(/\n/g, ', ').trim() : undefined;
        const objetivos = byXPath("//strong[contains(text(), 'Objetivos')]/following-sibling::div//p");
        const area_tematica =
          byXPath("//strong[contains(text(), 'Area tematica')]/following-sibling::div//p") ||
          bySel('.field--name-field-topic p');

        return { nombre, email, telefono, direccion, objetivos, area_tematica };
      });

      return {
        url,
        nombre: data.nombre || 'No encontrado',
        email: data.email || 'No encontrado',
        telefono: data.telefono || 'No encontrado',
        direccion: data.direccion || 'No encontrado',
        objetivos: data.objetivos || 'No encontrado',
        area_tematica: data.area_tematica || 'No encontrado',
        scraped_at: new Date().toISOString(),
        success: true
      };
    } catch (err) {
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
  }
};


