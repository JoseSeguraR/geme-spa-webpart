import type { RegistroSistemaAccesoNormalizado } from '../../models/SistemaAcceso';

export function UsuarioCumpleAudiencia(
  gruposAccesoNodo: number[],
  idsGruposUsuario: ReadonlySet<number>
): boolean {
  if (gruposAccesoNodo.length === 0) {
    return true;
  }
  return gruposAccesoNodo.some((idGrupo) => idsGruposUsuario.has(idGrupo));
}

export function FiltrarRegistrosPorAudienciaEnlace(
  registros: RegistroSistemaAccesoNormalizado[],
  idsGruposUsuario: ReadonlySet<number>
): RegistroSistemaAccesoNormalizado[] {
  return registros.filter((registro) => {
    if (registro.tipo === 'Header') {
      return true;
    }
    return UsuarioCumpleAudiencia(registro.gruposAccesoIds, idsGruposUsuario);
  });
}
