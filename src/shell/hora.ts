// Misma zona que el resto de la app (formato del dashboard): no depende de la zona del servidor ni del navegador.
const HORA = new Intl.DateTimeFormat("es-CO", { hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23", timeZone: "America/Bogota" });

export const horaBogota = (ms: number) => HORA.format(ms);
