import { z } from 'zod';
export declare const EventickRecordSchema: z.ZodObject<{
    url: z.ZodString;
    event_id: z.ZodNumber;
    event_name: z.ZodString;
    organizer_phone: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"No encontrado">]>;
    organizer_email: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"No encontrado">]>;
    organizer_website: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"No encontrado">]>;
    scraped_at: z.ZodString;
    success: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    url: string;
    scraped_at: string;
    success: boolean;
    event_id: number;
    event_name: string;
    organizer_phone?: string | undefined;
    organizer_email?: string | undefined;
    organizer_website?: string | undefined;
}, {
    url: string;
    scraped_at: string;
    success: boolean;
    event_id: number;
    event_name: string;
    organizer_phone?: string | undefined;
    organizer_email?: string | undefined;
    organizer_website?: string | undefined;
}>;
export type EventickRecord = z.infer<typeof EventickRecordSchema>;
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
export interface EventickScrapingProgress {
    totalEvents: number;
    currentEventId: number;
    processedEvents: number;
    successfulExtractions: number;
    failedExtractions: number;
    startTime: Date;
    estimatedTimeRemaining?: number;
}
