export class SharePointRestError extends Error {
  public readonly operacion: string;
  public readonly recurso: string;
  public readonly status: number;
  public readonly statusText: string;

  public constructor(
    operacion: string,
    recurso: string,
    status: number,
    statusText: string,
    mensaje?: string
  ) {
    super(mensaje ?? `Error SharePoint REST (${status}) en ${operacion}: ${recurso}`);
    this.name = 'SharePointRestError';
    this.operacion = operacion;
    this.recurso = recurso;
    this.status = status;
    this.statusText = statusText;
  }
}
