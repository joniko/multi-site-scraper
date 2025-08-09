import { z } from 'zod';
export declare const OrganizationSchema: z.ZodObject<{
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
export type Organization = z.infer<typeof OrganizationSchema>;
export declare const PageResponseSchema: z.ZodObject<{
    page: z.ZodNumber;
    organizationLinks: z.ZodArray<z.ZodString, "many">;
    hasNextPage: z.ZodBoolean;
    totalFound: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    page: number;
    organizationLinks: string[];
    hasNextPage: boolean;
    totalFound: number;
}, {
    page: number;
    organizationLinks: string[];
    hasNextPage: boolean;
    totalFound: number;
}>;
export type PageResponse = z.infer<typeof PageResponseSchema>;
export interface ScraperConfig {
    headless: boolean;
    maxConcurrent: number;
    timeout: number;
    retryAttempts: number;
    delayBetweenRequests: number;
    outputFile: string;
    resumeFromFile?: string;
    verbose: boolean;
}
export interface ScrapingProgress {
    totalPages: number;
    currentPage: number;
    totalOrganizations: number;
    processedOrganizations: number;
    successfulExtractions: number;
    failedExtractions: number;
    startTime: Date;
    estimatedTimeRemaining?: number;
}
