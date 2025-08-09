"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runBAScraper = exports.extractOrganization = exports.extractLinksFromPage = exports.getTotalPages = void 0;
const p_limit_1 = __importDefault(require("p-limit"));
const organization_1 = require("../types/organization");
const browser_1 = require("../utils/browser");
const logger_1 = require("../utils/logger");
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
const getTotalPages = async (page) => {
    await (0, browser_1.navigateWithRetry)(page, buildSearchUrl(1), 3, 'networkidle2');
    await page.waitForSelector('.card-deck');
    const pages = await page.$$eval('.pager li a', (as) => as
        .map((a) => (a.textContent || '').trim())
        .filter((t) => /^\d+$/.test(t))
        .map((t) => Number(t)));
    if (pages.length === 0)
        return 1;
    return Math.max(...pages);
};
exports.getTotalPages = getTotalPages;
const extractLinksFromPage = async (page, pageNum) => {
    await (0, browser_1.navigateWithRetry)(page, buildSearchUrl(pageNum), 3, 'networkidle2');
    await page.waitForSelector('.card-deck');
    const links = await page.$$eval('.card-deck a.card', (cards) => cards
        .map((c) => c.href)
        .filter((href) => href && href.includes('/organizacion/')));
    return links;
};
exports.extractLinksFromPage = extractLinksFromPage;
const extractOrganization = async (browser, url, timeoutMs) => {
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
        const org = {
            url,
            nombre: (0, browser_1.safeText)(data.nombre, 'No encontrado'),
            email: data.email ? data.email : 'No encontrado',
            telefono: data.telefono ? data.telefono : 'No encontrado',
            direccion: data.direccion ? data.direccion : 'No encontrado',
            objetivos: data.objetivos ? data.objetivos : 'No encontrado',
            area_tematica: data.area_tematica ? data.area_tematica : 'No encontrado',
            scraped_at: new Date().toISOString(),
            success: true
        };
        // Validación
        organization_1.OrganizationSchema.parse(org);
        return org;
    }
    catch (err) {
        logger_1.logger.warn(`Fallo extrayendo ${url}: ${err.message}`);
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
};
exports.extractOrganization = extractOrganization;
const runBAScraper = async (page, options) => {
    const totalPages = await (0, exports.getTotalPages)(page);
    const lastPage = options.endPage ? Math.min(options.endPage, totalPages) : totalPages;
    logger_1.logger.info(`Páginas totales: ${totalPages}. Rango a procesar: ${options.startPage}-${lastPage}`);
    // Reusar la misma page para listar links por página
    const allLinks = [];
    for (let p = options.startPage; p <= lastPage; p++) {
        const links = await (0, exports.extractLinksFromPage)(page, p);
        logger_1.logger.info(`Página ${p}: ${links.length} enlaces`);
        allLinks.push(...links);
        await page.waitForTimeout(500);
    }
    const limit = (0, p_limit_1.default)(options.concurrency);
    const tasks = allLinks.map((url) => limit(() => (0, exports.extractOrganization)(options.browser, url, options.timeoutMs)));
    const results = await Promise.all(tasks);
    return results;
};
exports.runBAScraper = runBAScraper;
//# sourceMappingURL=ba.js.map