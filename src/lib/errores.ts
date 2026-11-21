// Error con código HTTP que el envoltorio de src/lib/http.ts traduce a JSON.
export class ErrorHttp extends Error {
  constructor(
    readonly estado: number,
    mensaje: string,
  ) {
    super(mensaje);
    this.name = "ErrorHttp";
  }
}
