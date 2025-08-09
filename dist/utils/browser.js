"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.safeText = exports.navigateWithRetry = exports.newPage = exports.launchBrowser = void 0;
const puppeteer_extra_1 = __importDefault(require("puppeteer-extra"));
const puppeteer_extra_plugin_stealth_1 = __importDefault(require("puppeteer-extra-plugin-stealth"));
puppeteer_extra_1.default.use((0, puppeteer_extra_plugin_stealth_1.default)());
const launchBrowser = async (config) => {
    const browser = await puppeteer_extra_1.default.launch({
        headless: config.headless,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--window-size=1920,1080'
        ]
    });
    return browser; // types alignment
};
exports.launchBrowser = launchBrowser;
const newPage = async (browser, timeoutMs) => {
    const page = await browser.newPage();
    await page.setViewport({ width: 1600, height: 1000 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');
    page.setDefaultTimeout(timeoutMs);
    return page;
};
exports.newPage = newPage;
const navigateWithRetry = async (page, url, attempts, waitUntil = 'networkidle2') => {
    let lastError = null;
    for (let i = 1; i <= attempts; i++) {
        try {
            const resp = await page.goto(url, { waitUntil });
            return resp;
        }
        catch (err) {
            lastError = err;
            await page.waitForTimeout(1000 * i);
        }
    }
    throw lastError ?? new Error('Navigation failed');
};
exports.navigateWithRetry = navigateWithRetry;
const safeText = (value, fallback = 'No encontrado') => {
    const v = (value ?? '').trim();
    return v.length > 0 ? v : fallback;
};
exports.safeText = safeText;
//# sourceMappingURL=browser.js.map