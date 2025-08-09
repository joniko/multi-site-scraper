import { Browser, Page } from 'puppeteer';
import { Organization } from '../types/organization';
export declare const getTotalPages: (page: Page) => Promise<number>;
export declare const extractLinksFromPage: (page: Page, pageNum: number) => Promise<string[]>;
export declare const extractOrganization: (browser: Browser, url: string, timeoutMs: number) => Promise<Organization>;
export interface RunOptions {
    browser: Browser;
    timeoutMs: number;
    concurrency: number;
    startPage: number;
    endPage?: number;
}
export declare const runBAScraper: (page: Page, options: RunOptions) => Promise<Organization[]>;
