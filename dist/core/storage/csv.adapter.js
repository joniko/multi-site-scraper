"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCsvAdapter = void 0;
const csv_writer_1 = require("csv-writer");
const fs_1 = __importDefault(require("fs"));
const createCsvAdapter = (headers) => {
    let writer;
    let path;
    return {
        async init(outputPath) {
            path = outputPath;
            writer = (0, csv_writer_1.createObjectCsvWriter)({
                path,
                header: headers,
                append: fs_1.default.existsSync(path)
            });
        },
        async appendBatch(records) {
            if (records.length === 0)
                return;
            await writer.writeRecords(records);
        },
        async close() {
            // no-op
        }
    };
};
exports.createCsvAdapter = createCsvAdapter;
//# sourceMappingURL=csv.adapter.js.map