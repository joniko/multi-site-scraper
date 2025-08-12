import { createObjectCsvWriter } from 'csv-writer';
import fs from 'fs';
import type { Organization } from '../types/organization';

export const writeCsv = async (
  path: string,
  records: Organization[]
): Promise<void> => {
  const csvWriter = createObjectCsvWriter({
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

export const appendCsv = async (
  path: string,
  records: Organization[]
): Promise<void> => {
  if (records.length === 0) return;
  const csvWriter = createObjectCsvWriter({
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
    append: fs.existsSync(path)
  });
  await csvWriter.writeRecords(records);
};


