"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventickScraper = void 0;
const browser_1 = require("../../utils/browser");
const eventick_1 = require("../../types/eventick");
const BASE_URL = 'https://eventick.com.ar';
const buildEventUrl = (eventId) => {
    return `${BASE_URL}/evento/${eventId}`;
};
exports.eventickScraper = {
    siteName: 'eventick',
    recordSchema: eventick_1.EventickRecordSchema,
    async getTotalPages(page) {
        // Para Eventick, vamos a probar eventos del 1 al 400
        // Este método no se usa realmente para Eventick, pero mantenemos la interfaz
        return 400;
    },
    buildListUrl(pageNum) {
        // Para Eventick, cada "página" es un ID de evento
        return buildEventUrl(pageNum);
    },
    async extractLinksFromList(page, pageNum) {
        // Para Eventick, verificamos si el evento existe
        const eventUrl = buildEventUrl(pageNum);
        try {
            await (0, browser_1.navigateWithRetry)(page, eventUrl, 2, 'networkidle2');
            // Verificar si la página existe (no es 404)
            const exists = await page.evaluate(() => {
                // Verificar si hay un título de evento
                const titleElement = document.querySelector('.listing-detail__title');
                if (!titleElement)
                    return false;
                // Verificar que no sea una página de error
                const errorSelectors = [
                    'h1:contains("404")',
                    'h1:contains("Not Found")',
                    'h1:contains("Error")',
                    '.error-page',
                    '.not-found'
                ];
                return !errorSelectors.some(selector => document.querySelector(selector));
            });
            return exists ? [eventUrl] : [];
        }
        catch (error) {
            // Si hay error de navegación, el evento no existe
            return [];
        }
    },
    async extractRecord(browser, url, timeoutMs) {
        const page = await (0, browser_1.newPage)(browser, timeoutMs);
        const eventId = parseInt(url.split('/').pop() || '0');
        try {
            await (0, browser_1.navigateWithRetry)(page, url, 3, 'networkidle2');
            // Esperar a que cargue el contenido principal
            await page.waitForSelector('.listing-detail__title, .sidebar__widget', {
                timeout: 10000
            });
            const data = await page.evaluate(() => {
                // Extraer nombre del evento - múltiples selectores para mayor compatibilidad
                let eventName = 'No encontrado';
                // Intentar diferentes selectores para el título
                const titleSelectors = [
                    '.listing-detail__title .listing-detail__title-black span',
                    '.listing-detail__title span',
                    '.listing-detail__title',
                    'h1.listing-detail__title',
                    'h1',
                    '.event-title',
                    '.title'
                ];
                for (const selector of titleSelectors) {
                    const element = document.querySelector(selector);
                    if (element && element.textContent && element.textContent.trim()) {
                        eventName = element.textContent.trim();
                        break;
                    }
                }
                // Si no se encuentra, intentar con el título de la página
                if (eventName === 'No encontrado') {
                    const pageTitle = document.title;
                    if (pageTitle && !pageTitle.includes('404') && !pageTitle.includes('Error')) {
                        eventName = pageTitle.replace(' | Eventick', '').replace(' - Eventick', '').trim();
                    }
                }
                // Buscar información del organizador
                let organizerPhone = 'No encontrado';
                let organizerEmail = 'No encontrado';
                let organizerWebsite = 'No encontrado';
                // Buscar en la sección del organizador
                const organizerSection = document.querySelector('.sidebar__widget-listing-details');
                if (organizerSection) {
                    const listItems = organizerSection.querySelectorAll('.sidebar__listing-list li');
                    listItems.forEach(item => {
                        const icon = item.querySelector('i');
                        const link = item.querySelector('a');
                        if (icon && link) {
                            const iconClass = icon.className;
                            const linkText = link.textContent?.trim() || '';
                            const linkHref = link.href || '';
                            // Identificar tipo de información por el ícono
                            if (iconClass.includes('la-mobile-phone') || iconClass.includes('la-phone')) {
                                organizerPhone = linkText || linkHref.replace('tel:', '');
                            }
                            else if (iconClass.includes('la-envelope') || iconClass.includes('la-mail')) {
                                organizerEmail = linkText || linkHref.replace('mailto:', '');
                            }
                            else if (iconClass.includes('la-link') || iconClass.includes('la-globe')) {
                                organizerWebsite = linkHref;
                            }
                        }
                    });
                }
                // Fallback: buscar en toda la página si no se encontró en la sección específica
                if (organizerPhone === 'No encontrado') {
                    const phoneLinks = document.querySelectorAll('a[href^="tel:"]');
                    if (phoneLinks.length > 0) {
                        const phoneLink = phoneLinks[0];
                        organizerPhone = phoneLink.href.replace('tel:', '') || phoneLink.textContent?.trim() || 'No encontrado';
                    }
                }
                if (organizerEmail === 'No encontrado') {
                    const emailLinks = document.querySelectorAll('a[href^="mailto:"]');
                    if (emailLinks.length > 0) {
                        const emailLink = emailLinks[0];
                        organizerEmail = emailLink.href.replace('mailto:', '') || emailLink.textContent?.trim() || 'No encontrado';
                    }
                }
                return {
                    eventName,
                    organizerPhone,
                    organizerEmail,
                    organizerWebsite
                };
            });
            return {
                url,
                event_id: eventId,
                event_name: data.eventName,
                organizer_phone: data.organizerPhone,
                organizer_email: data.organizerEmail,
                organizer_website: data.organizerWebsite,
                scraped_at: new Date().toISOString(),
                success: true
            };
        }
        catch (err) {
            console.error(`Error scraping event ${eventId}:`, err);
            return {
                url,
                event_id: eventId,
                event_name: 'Error',
                organizer_phone: 'Error',
                organizer_email: 'Error',
                organizer_website: 'Error',
                scraped_at: new Date().toISOString(),
                success: false
            };
        }
        finally {
            await page.close();
        }
    }
};
//# sourceMappingURL=eventick.scraper.js.map