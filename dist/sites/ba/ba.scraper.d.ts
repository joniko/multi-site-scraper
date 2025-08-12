import { z } from 'zod';
import type { SiteScraper } from '../../core/contracts';
export declare const BaRecordSchema: z.ZodObject<{
    url: z.ZodString;
    nombre: z.ZodString;
    email: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"No encontrado">]>;
    telefono: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"No encontrado">]>;
    direccion: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"No encontrado">]>;
    objetivos: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"No encontrado">]>;
    area_tematica: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"No encontrado">]>;
    scraped_at: z.ZodString;
    success: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    url: string;
    nombre: string;
    scraped_at: string;
    success: boolean;
    email?: string | undefined;
    telefono?: string | undefined;
    direccion?: string | undefined;
    objetivos?: string | undefined;
    area_tematica?: string | undefined;
}, {
    url: string;
    nombre: string;
    scraped_at: string;
    success: boolean;
    email?: string | undefined;
    telefono?: string | undefined;
    direccion?: string | undefined;
    objetivos?: string | undefined;
    area_tematica?: string | undefined;
}>;
export type BaRecord = z.infer<typeof BaRecordSchema>;
export declare const baScraper: SiteScraper<BaRecord>;
