type DetalleErrorSharePoint = {
  message?: {
    value?: string;
  };
  code?: string;
};

/** `odata=verbose` responde `error`; `odata=nometadata` responde `odata.error`. */
type CuerpoErrorSharePoint = {
  error?: DetalleErrorSharePoint;
  'odata.error'?: DetalleErrorSharePoint;
};

type RespuestaConJson = {
  status: number;
  statusText: string;
  json: () => Promise<unknown>;
};

export async function ExtraerMensajeErrorSharePoint(response: RespuestaConJson): Promise<string> {
  try {
    const json = (await response.json()) as CuerpoErrorSharePoint;
    const detalle = json.error ?? json['odata.error'];
    const mensaje = detalle?.message?.value?.trim();
    if (mensaje) {
      return mensaje;
    }
    const codigo = detalle?.code?.trim();
    if (codigo) {
      return codigo;
    }
  } catch {
    // respuesta no JSON
  }
  return `${response.status} ${response.statusText}`.trim();
}
