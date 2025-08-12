import type { StorageAdapter, RecordBase } from '../contracts';
export declare const createCsvAdapter: <R extends RecordBase>(headers: Array<{
    id: keyof R & string;
    title: string;
}>) => StorageAdapter<R>;
