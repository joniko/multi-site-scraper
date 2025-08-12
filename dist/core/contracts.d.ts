import type { Browser, Page } from 'puppeteer';
import type { z } from 'zod';
export type RecordBase = {
    url: string;
    scraped_at: string;
    success: boolean;
};
export interface SiteContext {
    browser: Browser;
    page: Page;
    timeoutMs: number;
    concurrency: number;
}
export interface PaginationRange {
    startPage: number;
    endPage?: number;
}
export interface SiteScraper<R extends RecordBase> {
    siteName: string;
    recordSchema: z.ZodType<R>;
    getTotalPages(page: Page): Promise<number>;
    buildListUrl(pageNum: number): string;
    extractLinksFromList(page: Page, pageNum: number): Promise<string[]>;
    extractRecord(browser: Browser, url: string, timeoutMs: number): Promise<R>;
}
export interface StorageAdapter<R extends RecordBase> {
    init(outputPath: string): Promise<void>;
    appendBatch(records: R[]): Promise<void>;
    close(): Promise<void>;
}
export interface RetryPolicy {
    maxAttempts: number;
    baseDelayMs: number;
    backoffMultiplier: number;
}
export interface PipelineOptions {
    context: SiteContext;
    outputPath: string;
    pagination: PaginationRange;
    retry: RetryPolicy;
    delayBetweenBatchesMs?: number;
}
