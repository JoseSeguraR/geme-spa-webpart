import * as React from 'react';
import { useEffect, useState } from 'react';
import type { WebPartContext } from '@microsoft/sp-webpart-base';
import type { CentralMantenedor } from '../../../../../models/concentradorComun/CentralMantenedor';
import type { InstalacionesUsuario, UsuarioPermisos } from '../../../../../models/permisosUsuarios/PermisosUsuarios';
import { GuardarInstalacionesUsuario } from '../../../../../services/sharepoint/permisosUsuarios/PermisosUsuariosServicio';
import { SharePointRestError } from '../../../../../services/sharepoint/SharePointRestError';
import ModalFormulario from '../../../../comunes/ModalFormulario';

export type ModalCentralesUsuarioProps = {
  context: WebPartContext;
  usuario: UsuarioPermisos | undefined;
  /** Centrales activas del Concentrador. */
  centrales: readonly CentralMantenedor[];
  asignadas: InstalacionesUsuario | undefined;
  onCerrar: () => void;
  onGuardado: (usuarioId: number, registro: InstalacionesUsuario) => void;
};

/** Centrales GM que el usuario puede gestionar en el Concentrador (CONC_MANTENEDOR_USUARIOSINSTALACIONES). */
export default function ModalCentralesUsuario(props: ModalCentralesUsuarioProps): React.ReactElement {
  const { context, usuario, centrales, asignadas, onCerrar, onGuardado } = props;
  const [seleccionadas, setSeleccionadas] = useState<number[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    setSeleccionadas(asignadas?.instalacionIds.slice() ?? []);
    setError(undefined);
    setGuardando(false);
  }, [usuario, asignadas]);

  if (!usuario) {
    return <></>;
  }

  // Centrales asignadas que ya no están activas: se conservan al guardar, sin mostrarse para elegir.
  const idsActivas = centrales.map((c) => c.id);
  const asignadasInactivas = seleccionadas.filter((id) => idsActivas.indexOf(id) === -1);

  const Alternar = (id: number, marcada: boolean): void => {
    setSeleccionadas((previas) => (marcada ? previas.concat(id) : previas.filter((v) => v !== id)));
  };

  const Guardar = async (): Promise<void> => {
    setGuardando(true);
    setError(undefined);
    try {
      const registroId = await GuardarInstalacionesUsuario(context, usuario.id, asignadas?.registroId, seleccionadas);
      onGuardado(usuario.id, { registroId, instalacionIds: seleccionadas.slice() });
      onCerrar();
    } catch (err) {
      console.error(err);
      setError(err instanceof SharePointRestError ? err.message : 'No se pudieron guardar las centrales.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <ModalFormulario
      visible
      titulo={`Centrales - ${usuario.nombre}`}
      icono="bi-building"
      error={error}
      guardando={guardando}
      onGuardar={() => {
        Guardar().catch(() => undefined);
      }}
      onCerrar={onCerrar}
    >
      <p className="small">Seleccione las centrales GM que el usuario puede gestionar en el Concentrador:</p>
      {centrales.length === 0 ? (
        <p className="text-muted mb-0">No hay centrales activas en el catálogo.</p>
      ) : (
        <div className="d-flex justify-content-between align-items-center mb-2">
          <span className="small text-muted">
            {seleccionadas.length - asignadasInactivas.length} de {centrales.length} seleccionadas
          </span>
          <span className="d-flex gap-2">
            <button type="button" className="btn btn-sm btn-link p-0" onClick={() => setSeleccionadas(asignadasInactivas.concat(idsActivas))}>
              Todas
            </button>
            <button type="button" className="btn btn-sm btn-link p-0" onClick={() => setSeleccionadas(asignadasInactivas.slice())}>
              Ninguna
            </button>
          </span>
        </div>
      )}
      <div className="cowork-permisos__lista-centrales">
        {centrales.map((central) => (
          <div key={central.id} className="form-check">
            <input
              id={`cowork-centrales-usuario-${central.id}`}
              type="checkbox"
              className="form-check-input"
              checked={seleccionadas.indexOf(central.id) >= 0}
              onChange={(e) => Alternar(central.id, e.target.checked)}
            />
            <label className="form-check-label" htmlFor={`cowork-centrales-usuario-${central.id}`}>
              {central.central}
            </label>
          </div>
        ))}
      </div>
      {asignadasInactivas.length > 0 ? (
        <p className="form-text mb-0 mt-2">
          Además tiene {asignadasInactivas.length} {asignadasInactivas.length === 1 ? 'central inactiva asignada' : 'centrales inactivas asignadas'}, que se
          conservan.
        </p>
      ) : null}
    </ModalFormulario>
  );
}
