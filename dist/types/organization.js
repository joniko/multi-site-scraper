"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PageResponseSchema = exports.OrganizationSchema = void 0;
const zod_1 = require("zod");
// Schema de validación para organizaciones
exports.OrganizationSchema = zod_1.z.object({
    url: zod_1.z.string().url(),
    nombre: zod_1.z.string().min(1),
    email: zod_1.z.string().email().optional().or(zod_1.z.literal('No encontrado')),
    telefono: zod_1.z.string().optional().or(zod_1.z.literal('No encontrado')),
    direccion: zod_1.z.string().optional().or(zod_1.z.literal('No encontrado')),
    objetivos: zod_1.z.string().optional().or(zod_1.z.literal('No encontrado')),
    area_tematica: zod_1.z.string().optional().or(zod_1.z.literal('No encontrado')),
    scraped_at: zod_1.z.string().datetime(),
    success: zod_1.z.boolean()
});
// Schema para respuesta de páginas
exports.PageResponseSchema = zod_1.z.object({
    page: zod_1.z.number(),
    organizationLinks: zod_1.z.array(zod_1.z.string().url()),
    hasNextPage: zod_1.z.boolean(),
    totalFound: zod_1.z.number()
});
//# sourceMappingURL=organization.js.map