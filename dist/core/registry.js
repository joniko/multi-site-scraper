"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSite = void 0;
const ba_scraper_1 = require("../sites/ba/ba.scraper");
const registry = {
    ba: ba_scraper_1.baScraper
};
const getSite = (name) => {
    const site = registry[name];
    if (!site)
        throw new Error(`Site no registrado: ${name}`);
    return site;
};
exports.getSite = getSite;
//# sourceMappingURL=registry.js.map