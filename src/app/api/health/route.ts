import { conHttp } from "@/lib/http";
import paquete from "../../../../package.json";

export const dynamic = "force-dynamic";

// Decisión #6: la HU 2 agrega el estado de la BD.
export const GET = conHttp("/api/health", () => Response.json({ status: "ok", version: paquete.version }));
