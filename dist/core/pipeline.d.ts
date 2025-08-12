import type { RecordBase, SiteScraper, StorageAdapter, PipelineOptions } from './contracts';
export declare const runPipeline: <R extends RecordBase>({ scraper, storage, options }: {
    scraper: SiteScraper<R>;
    storage: StorageAdapter<R>;
    options: PipelineOptions;
}) => Promise<R[]>;
