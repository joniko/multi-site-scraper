import { z } from 'zod';

// Schema de validación para organizaciones
export const OrganizationSchema = z.object({
  url: z.string().url(),
  nombre: z.string().min(1),
  email: z.string().email().optional().or(z.literal('No encontrado')),
  telefono: z.string().optional().or(z.literal('No encontrado')),
  direccion: z.string().optional().or(z.literal('No encontrado')),
  objetivos: z.string().optional().or(z.literal('No encontrado')),
  area_tematica: z.string().optional().or(z.literal('No encontrado')),
  scraped_at: z.string().datetime(),
  success: z.boolean()
});

export type Organization = z.infer<typeof OrganizationSchema>;

// Schema para respuesta de páginas
export const PageResponseSchema = z.object({
  page: z.number(),
  organizationLinks: z.array(z.string().url()),
  hasNextPage: z.boolean(),
  totalFound: z.number()
});

export type PageResponse = z.infer<typeof PageResponseSchema>;

// Configuración del scraper
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

// Estado del scraping
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
