"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.baScraper = exports.BaRecordSchema = void 0;
const zod_1 = require("zod");
const browser_1 = require("../../utils/browser");
exports.BaRecordSchema = zod_1.z.object({
    url: zod_1.z.string().url(),
    nombre: zod_1.z.string().min(1),
    email: zod_1.z.string().optional().or(zod_1.z.literal('No encontrado')),
    telefono: zod_1.z.string().optional().or(zod_1.z.literal('No encontrado')),
    direccion: zod_1.z.string().optional().or(zod_1.z.literal('No encontrado')),
    objetivos: zod_1.z.string().optional().or(zod_1.z.literal('No encontrado')),
    area_tematica: zod_1.z.string().optional().or(zod_1.z.literal('No encontrado')),
    scraped_at: zod_1.z.string().datetime(),
    success: zod_1.z.boolean()
});
const BASE = 'https://buenosaires.gob.ar';
const SEARCH = `${BASE}/organizaciones-civiles-buscador`;
const buildSearchUrl = (page) => {
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
exports.baScraper = {
    siteName: 'ba',
    recordSchema: exports.BaRecordSchema,
    async getTotalPages(page) {
        await (0, browser_1.navigateWithRetry)(page, buildSearchUrl(0), 3, 'networkidle2');
        await page.waitForFunction(() => new URL(window.location.href).searchParams.get('page') === '0', { timeout: 15000 });
        await page.waitForFunction((sels) => sels.some((sel) => !!document.querySelector(sel)), { timeout: 15000 }, ['.card-deck', '.view-content', '.cards', '.search-results']);
        const pages = await page.$$eval('.pager li a', (as) => as
            .map((a) => (a.textContent || '').trim())
            .filter((t) => /^\d+$/.test(t))
            .map((t) => Number(t)));
        return pages.length === 0 ? 1 : Math.max(...pages);
    },
    buildListUrl(pageNum) {
        return buildSearchUrl(pageNum);
    },
    async extractLinksFromList(page, pageNum) {
        await (0, browser_1.navigateWithRetry)(page, buildSearchUrl(pageNum), 3, 'networkidle2');
        await page.waitForFunction((expected) => new URL(window.location.href).searchParams.get('page') === String(expected), { timeout: 15000 }, pageNum);
        await page.waitForFunction((sels) => sels.some((sel) => !!document.querySelector(sel)), { timeout: 15000 }, ['.card-deck', '.view-content', '.cards', '.search-results']);
        const links = await page.$$eval(['.card-deck a.card', '.view-content a', '.cards a', '.search-results a'].join(','), (nodes) => {
            const urls = Array.from(nodes)
                .map((n) => n.href)
                .filter((href) => href && href.includes('/organizacion/'));
            return Array.from(new Set(urls));
        });
        return links;
    },
    async extractRecord(browser, url, timeoutMs) {
        const page = await (0, browser_1.newPage)(browser, timeoutMs);
        try {
            await (0, browser_1.navigateWithRetry)(page, url, 3, 'networkidle2');
            await page.waitForSelector('.layout-builder__layout');
            const data = await page.evaluate(() => {
                const byXPath = (xp) => {
                    const res = document.evaluate(xp, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
                    const node = res.singleNodeValue;
                    return node?.textContent?.trim();
                };
                const bySel = (sel) => document.querySelector(sel)?.textContent?.trim();
                const nombre = document.querySelector('h1')?.textContent?.trim() || document.title.split(' | ')[0];
                const email = byXPath("//strong[contains(text(), 'Email de contacto')]/following-sibling::div//p") ||
                    bySel('.field--name-field-email p');
                const telefono = byXPath("//strong[contains(text(), 'Teléfono')]/following-sibling::div//p") ||
                    bySel('.field--name-field-phone p');
                const direccionRaw = document.querySelector('.field--name-field-address .address')?.innerText;
                const direccion = direccionRaw ? direccionRaw.replace(/\s+/g, ' ').replace(/\n/g, ', ').trim() : undefined;
                const objetivos = byXPath("//strong[contains(text(), 'Objetivos')]/following-sibling::div//p");
                const area_tematica = byXPath("//strong[contains(text(), 'Area tematica')]/following-sibling::div//p") ||
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
        }
        catch (err) {
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
        }
        finally {
            await page.close();
        }
    }
};
//# sourceMappingURL=ba.scraper.js.map