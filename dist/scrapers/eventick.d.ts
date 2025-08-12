interface EventickScrapingOptions {
    eventIds?: number[];
    startEventId?: number;
    endEventId?: number;
    headless?: boolean;
    maxConcurrent?: number;
    timeout?: number;
    delayBetweenRequests?: number;
    outputFile?: string;
    verbose?: boolean;
}
export declare class EventickScraper {
    private browser;
    private storage;
    private options;
    constructor(options?: EventickScrapingOptions);
    initialize(): Promise<void>;
    scrape(): Promise<void>;
    private processEvent;
    private delay;
    close(): Promise<void>;
}
export {};
