"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeCsv = void 0;
const csv_writer_1 = require("csv-writer");
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
//# sourceMappingURL=csv.js.map