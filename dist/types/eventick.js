"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventickRecordSchema = void 0;
const zod_1 = require("zod");
// Schema de validación para eventos de Eventick
exports.EventickRecordSchema = zod_1.z.object({
    url: zod_1.z.string().url(),
    event_id: zod_1.z.number(),
    event_name: zod_1.z.string().min(1),
    organizer_phone: zod_1.z.string().optional().or(zod_1.z.literal('No encontrado')),
    organizer_email: zod_1.z.string().email().optional().or(zod_1.z.literal('No encontrado')),
    organizer_website: zod_1.z.string().url().optional().or(zod_1.z.literal('No encontrado')),
    scraped_at: zod_1.z.string().datetime(),
    success: zod_1.z.boolean()
});
//# sourceMappingURL=eventick.js.map