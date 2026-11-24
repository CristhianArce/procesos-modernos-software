import { z } from "zod";

/** Identificador de una notificación en la ruta (CA-4). `z.guid()` acepta todo UUID 8-4-4-4-12 que guarda Postgres. */
export const idNotificacionSchema = z.object({ id: z.guid() });
