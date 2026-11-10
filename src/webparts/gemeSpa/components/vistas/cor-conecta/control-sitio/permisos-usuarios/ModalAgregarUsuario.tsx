import * as React from 'react';
import { useEffect, useState } from 'react';
import type { WebPartContext } from '@microsoft/sp-webpart-base';
import type { PersonaEncontrada, UsuarioPermisos } from '../../../../../models/permisosUsuarios/PermisosUsuarios';
import {
  AgregarUsuarioConcentrador,
  BuscarPersonas
} from '../../../../../services/sharepoint/permisosUsuarios/PermisosUsuariosServicio';
import { SharePointRestError } from '../../../../../services/sharepoint/SharePointRestError';
import ModalFormulario from '../../../../comunes/ModalFormulario';

export type ModalAgregarUsuarioProps = {
  context: WebPartContext;
  visible: boolean;
  usuariosExistentes: readonly UsuarioPermisos[];
  onCerrar: () => void;
  onAgregado: (nombre: string) => void;
};

const LargoMinimoBusqueda = 3;
const DemoraBusquedaMs = 350;

/** Busca una persona del directorio y la agrega al Concentrador (grupos «todos los usuarios»). */
export default function ModalAgregarUsuario(props: ModalAgregarUsuarioProps): React.ReactElement {
  const { context, visible, usuariosExistentes, onCerrar, onAgregado } = props;
  const [texto, setTexto] = useState('');
  const [resultados, setResultados] = useState<PersonaEncontrada[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [seleccionada, setSeleccionada] = useState<PersonaEncontrada | undefined>();
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    if (visible) {
      setTexto('');
      setResultados([]);
      setSeleccionada(undefined);
      setError(undefined);
      setGuardando(false);
    }
  }, [visible]);

  useEffect(() => {
    const consulta = texto.trim();
    if (!visible || consulta.length < LargoMinimoBusqueda) {
      setResultados([]);
      setBuscando(false);
      return undefined;
    }
    let cancelado = false;
    setBuscando(true);
    const id = window.setTimeout(() => {
      BuscarPersonas(context, consulta)
        .then((personas) => {
          if (!cancelado) {
            setResultados(personas);
          }
        })
        .catch((err: unknown) => {
          if (!cancelado) {
            console.error(err);
            setError(err instanceof SharePointRestError ? err.message : 'No se pudo buscar personas.');
          }
        })
        .then(() => {
          if (!cancelado) {
            setBuscando(false);
          }
        })
        .catch(() => undefined);
    }, DemoraBusquedaMs);
    return () => {
      cancelado = true;
      window.clearTimeout(id);
    };
  }, [context, texto, visible]);

  const YaEsUsuario = (persona: PersonaEncontrada): boolean =>
    usuariosExistentes.some((u) => u.login.toLowerCase() === persona.login.toLowerCase());

  const Guardar = async (): Promise<void> => {
    if (!seleccionada) {
      setError('Busque y seleccione una persona.');
      return;
    }
    if (YaEsUsuario(seleccionada)) {
      setError(`${seleccionada.nombre} ya es usuario del Concentrador.`);
      return;
    }
    setGuardando(true);
    setError(undefined);
    try {
      await AgregarUsuarioConcentrador(context, seleccionada);
      onAgregado(seleccionada.nombre);
      onCerrar();
    } catch (err) {
      console.error(err);
      setError(err instanceof SharePointRestError ? err.message : 'No se pudo agregar el usuario.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <ModalFormulario
      visible={visible}
      titulo="Agregar usuario"
      icono="bi-person-plus"
      error={error}
      guardando={guardando}
      textoGuardar="Agregar"
      onGuardar={() => {
        Guardar().catch(() => undefined);
      }}
      onCerrar={onCerrar}
    >
      <label className="form-label cowork-formulario__etiqueta--obligatoria" htmlFor="cowork-agregar-usuario-buscar">
        Persona
      </label>
      <input
        id="cowork-agregar-usuario-buscar"
        type="search"
        className="form-control form-control-sm"
        placeholder="Nombre o correo"
        autoComplete="off"
        value={texto}
        aria-describedby="cowork-agregar-usuario-ayuda"
        onChange={(e) => {
          setTexto(e.target.value);
          setSeleccionada(undefined);
          setError(undefined);
        }}
      />
      <div id="cowork-agregar-usuario-ayuda" className="form-text">
        Escriba al menos {LargoMinimoBusqueda} letras. El usuario queda en el Concentrador sin funciones; se las asigna en la
        matriz.
      </div>

      {buscando ? (
        <div className="text-muted small mt-2">
          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
          Buscando…
        </div>
      ) : null}
      {!buscando && texto.trim().length >= LargoMinimoBusqueda && resultados.length === 0 ? (
        <p className="text-muted small mt-2 mb-0">No se encontraron personas.</p>
      ) : null}
      {resultados.length > 0 ? (
        <div className="list-group mt-2 cowork-permisos__resultados" role="listbox" aria-label="Personas encontradas">
          {resultados.map((persona) => {
            const existente = YaEsUsuario(persona);
            const activa = seleccionada?.login === persona.login;
            return (
              <button
                key={persona.login}
                type="button"
                role="option"
                aria-selected={activa}
                className={`list-group-item list-group-item-action py-2${activa ? ' active' : ''}`}
                disabled={existente}
                onClick={() => setSeleccionada(persona)}
              >
                <span className="d-block fw-semibold">{persona.nombre}</span>
                <small className={activa ? '' : 'text-muted'}>
                  {persona.correo || persona.login}
                  {existente ? ' · ya es usuario' : ''}
                </small>
              </button>
            );
          })}
        </div>
      ) : null}
    </ModalFormulario>
  );
}
