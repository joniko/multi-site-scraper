"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runPipeline = void 0;
const p_limit_1 = __importDefault(require("p-limit"));
const logger_1 = require("../utils/logger");
const runPipeline = async ({ scraper, storage, options }) => {
    const { context, outputPath, pagination, delayBetweenBatchesMs = 500 } = options;
    await storage.init(outputPath);
    const page = context.page;
    const endPage = typeof pagination.endPage === 'number'
        ? pagination.endPage
        : await scraper.getTotalPages(page);
    const all = [];
    for (let p = pagination.startPage; p <= endPage; p++) {
        const listUrl = scraper.buildListUrl(p);
        logger_1.logger.info(`[${scraper.siteName}] Navegando lista p=${p} → ${listUrl}`);
        await page.goto(listUrl, { waitUntil: 'networkidle2' });
        const links = await scraper.extractLinksFromList(page, p);
        logger_1.logger.info(`[${scraper.siteName}] p=${p}, enlaces únicos: ${links.length}`);
        const limit = (0, p_limit_1.default)(context.concurrency);
        const batch = await Promise.all(links.map((url) => limit(() => scraper.extractRecord(context.browser, url, context.timeoutMs))));
        await storage.appendBatch(batch);
        all.push(...batch);
        if (delayBetweenBatchesMs > 0) {
            await page.waitForTimeout(delayBetweenBatchesMs);
        }
    }
    await storage.close();
    return all;
};
exports.runPipeline = runPipeline;
//# sourceMappingURL=pipeline.js.map