import type { Organization } from '../types/organization';
export declare const writeCsv: (path: string, records: Organization[]) => Promise<void>;
export declare const appendCsv: (path: string, records: Organization[]) => Promise<void>;
