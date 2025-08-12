import { createObjectCsvWriter } from 'csv-writer';
import fs from 'fs';
import type { StorageAdapter, RecordBase } from '../contracts';

export const createCsvAdapter = <R extends RecordBase>(
  headers: Array<{ id: keyof R & string; title: string }>
): StorageAdapter<R> => {
  let writer: any;
  let path: string;

  return {
    async init(outputPath) {
      path = outputPath;
      writer = createObjectCsvWriter({
        path,
        header: headers,
        append: fs.existsSync(path)
      });
    },
    async appendBatch(records) {
      if (records.length === 0) return;
      await writer.writeRecords(records);
    },
    async close() {
      // no-op
    }
  };
};


