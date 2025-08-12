import { z } from 'zod';

// Schema de validación para eventos de Eventick
export const EventickRecordSchema = z.object({
  url: z.string().url(),
  event_id: z.number(),
  event_name: z.string().min(1),
  organizer_phone: z.string().optional().or(z.literal('No encontrado')),
  organizer_email: z.string().email().optional().or(z.literal('No encontrado')),
  organizer_website: z.string().url().optional().or(z.literal('No encontrado')),
  scraped_at: z.string().datetime(),
  success: z.boolean()
});

export type EventickRecord = z.infer<typeof EventickRecordSchema>;

// Configuración específica para Eventick
export interface EventickConfig {
  baseUrl: string;
  startEventId: number;
  endEventId: number;
  headless: boolean;
  maxConcurrent: number;
  timeout: number;
  retryAttempts: number;
  delayBetweenRequests: number;
  outputFile: string;
  verbose: boolean;
}

// Estado del scraping de Eventick
export interface EventickScrapingProgress {
  totalEvents: number;
  currentEventId: number;
  processedEvents: number;
  successfulExtractions: number;
  failedExtractions: number;
  startTime: Date;
  estimatedTimeRemaining?: number;
}
