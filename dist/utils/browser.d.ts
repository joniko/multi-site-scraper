import { Browser, HTTPResponse, Page } from 'puppeteer';
export interface BrowserConfig {
    headless: boolean;
    timeoutMs: number;
}
export declare const launchBrowser: (config: BrowserConfig) => Promise<Browser>;
export declare const newPage: (browser: Browser, timeoutMs: number) => Promise<Page>;
export declare const navigateWithRetry: (page: Page, url: string, attempts: number, waitUntil?: "load" | "domcontentloaded" | "networkidle0" | "networkidle2") => Promise<HTTPResponse | null>;
export declare const safeText: (value: string | null | undefined, fallback?: string) => string;
