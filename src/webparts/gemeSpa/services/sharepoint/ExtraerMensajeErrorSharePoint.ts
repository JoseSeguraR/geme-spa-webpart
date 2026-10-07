type CuerpoErrorSharePoint = {
  error?: {
    message?: {
      value?: string;
    };
    code?: string;
  };
};

type RespuestaConJson = {
  status: number;
  statusText: string;
  json: () => Promise<unknown>;
};

export async function ExtraerMensajeErrorSharePoint(response: RespuestaConJson): Promise<string> {
  try {
    const json = (await response.json()) as CuerpoErrorSharePoint;
    const mensaje = json.error?.message?.value?.trim();
    if (mensaje) {
      return mensaje;
    }
    const codigo = json.error?.code?.trim();
    if (codigo) {
      return codigo;
    }
  } catch {
    // respuesta no JSON
  }
  return `${response.status} ${response.statusText}`.trim();
}
