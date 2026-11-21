import { crearGetAcerca } from "../../../modulos/acerca/handler";

// Falla cerrado (401) hasta que la HU 1b aporte la sesión real (decisión #2).
const sinSesion = () => null;

export const GET = crearGetAcerca(sinSesion);
