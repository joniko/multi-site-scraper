"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.appendCsv = exports.writeCsv = void 0;
const csv_writer_1 = require("csv-writer");
const fs_1 = __importDefault(require("fs"));
const writeCsv = async (path, records) => {
    const csvWriter = (0, csv_writer_1.createObjectCsvWriter)({
        path,
        header: [
            { id: 'nombre', title: 'Nombre' },
            { id: 'email', title: 'Email' },
            { id: 'telefono', title: 'Telefono' },
            { id: 'direccion', title: 'Direccion' },
            { id: 'objetivos', title: 'Objetivos' },
            { id: 'area_tematica', title: 'AreaTematica' },
            { id: 'url', title: 'URL' },
            { id: 'scraped_at', title: 'ScrapedAt' },
            { id: 'success', title: 'Success' }
        ]
    });
    await csvWriter.writeRecords(records);
};
exports.writeCsv = writeCsv;
const appendCsv = async (path, records) => {
    if (records.length === 0)
        return;
    const csvWriter = (0, csv_writer_1.createObjectCsvWriter)({
        path,
        header: [
            { id: 'nombre', title: 'Nombre' },
            { id: 'email', title: 'Email' },
            { id: 'telefono', title: 'Telefono' },
            { id: 'direccion', title: 'Direccion' },
            { id: 'objetivos', title: 'Objetivos' },
            { id: 'area_tematica', title: 'AreaTematica' },
            { id: 'url', title: 'URL' },
            { id: 'scraped_at', title: 'ScrapedAt' },
            { id: 'success', title: 'Success' }
        ],
        append: fs_1.default.existsSync(path)
    });
    await csvWriter.writeRecords(records);
};
exports.appendCsv = appendCsv;
//# sourceMappingURL=csv.js.map