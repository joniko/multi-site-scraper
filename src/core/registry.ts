import type { SiteScraper } from './contracts';
import { baScraper } from '../sites/ba/ba.scraper';

const registry: Record<string, SiteScraper<any>> = {
  ba: baScraper
};

export const getSite = (name: string) => {
  const site = registry[name];
  if (!site) throw new Error(`Site no registrado: ${name}`);
  return site;
};


