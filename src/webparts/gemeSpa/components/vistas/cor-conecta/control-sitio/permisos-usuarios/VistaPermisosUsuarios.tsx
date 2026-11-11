import * as React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CentralMantenedor } from '../../../../../models/concentradorComun/CentralMantenedor';
import type {
  FuncionPermiso,
  InstalacionesUsuario,
  UsuarioPermisos
} from '../../../../../models/permisosUsuarios/PermisosUsuarios';
import { ObtenerCentralesInstalaciones } from '../../../../../services/sharepoint/concentradorComun/CentralesInstalacionesServicio';
import { InvalidarCacheMenu } from '../../../../../services/menu/InvalidarCacheMenu';
import {
  AgregarUsuarioAGrupo,
  DesvincularUsuario,
  ModuloBloqueoPropio,
  ObtenerFuncionesConcentrador,
  ObtenerInstalacionesPorUsuario,
  ObtenerUsuariosConcentrador,
  QuitarUsuarioDeGrupo
} from '../../../../../services/sharepoint/permisosUsuarios/PermisosUsuariosServicio';
import { SharePointRestError } from '../../../../../services/sharepoint/SharePointRestError';
import type { PropsVistaSpa } from '../../../../../constants/registro-vistas/TiposRegistroVistas';
import CarcasaControlSitio from '../CarcasaControlSitio';
import ModalAgregarUsuario from './ModalAgregarUsuario';
import ModalCentralesUsuario from './ModalCentralesUsuario';

const MensajeRequiereValidacion =
  'El rol requiere que el usuario tenga todos sus datos completos. Complételos y vuelva a otorgar el acceso.';

function NormalizarTexto(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

/** Permisos de usuario del Concentrador: matriz usuario × función (réplica de `CONC/Administracion/admuserfn.aspx`). */
export default function VistaPermisosUsuarios(props: PropsVistaSpa): React.ReactElement {
  const { context } = props;
  const idUsuarioActual = Number(context.pageContext.legacyPageContext?.userId);

  const [funciones, setFunciones] = useState<FuncionPermiso[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioPermisos[]>([]);
  const [instalaciones, setInstalaciones] = useState<Map<number, InstalacionesUsuario>>(new Map());
  const [centrales, setCentrales] = useState<CentralMantenedor[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | undefined>();
  const [errorAccion, setErrorAccion] = useState<string | undefined>();
  const [aviso, setAviso] = useState<string | undefined>();
  const [modulo, setModulo] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [pendientes, setPendientes] = useState<string[]>([]);
  const [usuarioCentrales, setUsuarioCentrales] = useState<UsuarioPermisos | undefined>();
  const [agregarVisible, setAgregarVisible] = useState(false);
  const [version, setVersion] = useState(0);

  const Recargar = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    let cancelado = false;
    setCargando(true);
    setErrorCarga(undefined);
    Promise.all([
      ObtenerFuncionesConcentrador(context),
      ObtenerUsuariosConcentrador(context),
      ObtenerInstalacionesPorUsuario(context),
      // Centrales activas del Concentrador (`soloRenovables` filtra ESTADO = Activo).
      ObtenerCentralesInstalaciones(context, { soloModuloConcentrador: true, soloRenovables: true })
    ])
      .then(([funcionesCargadas, usuariosCargados, instalacionesCargadas, centralesCargadas]) => {
        if (cancelado) {
          return;
        }
        setFunciones(funcionesCargadas);
        setUsuarios(usuariosCargados);
        setInstalaciones(instalacionesCargadas);
        setCentrales(centralesCargadas);
        setModulo((actual) =>
          actual && funcionesCargadas.some((f) => f.modulo === actual) ? actual : funcionesCargadas[0]?.modulo ?? ''
        );
      })
      .catch((err: unknown) => {
        if (!cancelado) {
          console.error(err);
          setErrorCarga(
            err instanceof SharePointRestError
              ? `No se pudo cargar la matriz de permisos: ${err.message}`
              : 'No se pudo cargar la matriz de permisos.'
          );
        }
      })
      .then(() => {
        if (!cancelado) {
          setCargando(false);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelado = true;
    };
  }, [context, version]);

  const modulos = useMemo(() => {
    const lista: { nombre: string; cantidad: number }[] = [];
    for (const funcion of funciones) {
      const existente = lista.find((m) => m.nombre === funcion.modulo);
      if (existente) {
        existente.cantidad += 1;
      } else {
        lista.push({ nombre: funcion.modulo, cantidad: 1 });
      }
    }
    return lista;
  }, [funciones]);

  const funcionesModulo = useMemo(() => funciones.filter((f) => f.modulo === modulo), [funciones, modulo]);

  const usuariosVisibles = useMemo(() => {
    const consulta = NormalizarTexto(busqueda.trim());
    return consulta ? usuarios.filter((u) => NormalizarTexto(u.nombre).indexOf(consulta) >= 0) : usuarios;
  }, [usuarios, busqueda]);

  const ActualizarGruposUsuario = (usuarioId: number, grupoId: number, agregar: boolean): void => {
    setUsuarios((previos) =>
      previos.map((u) =>
        u.id !== usuarioId
          ? u
          : { ...u, grupos: agregar ? u.grupos.concat(grupoId) : u.grupos.filter((g) => g !== grupoId) }
      )
    );
  };

  const AlternarFuncion = async (usuario: UsuarioPermisos, funcion: FuncionPermiso): Promise<void> => {
    const tiene = usuario.grupos.indexOf(funcion.grupoId) >= 0;
    if (!tiene && funcion.requiereValidacion) {
      setErrorAccion(MensajeRequiereValidacion);
      return;
    }
    const clavePendiente = `${usuario.id}-${funcion.grupoId}`;
    setPendientes((p) => p.concat(clavePendiente));
    setErrorAccion(undefined);
    setAviso(undefined);
    try {
      if (tiene) {
        await QuitarUsuarioDeGrupo(context, funcion.grupoId, usuario.login);
      } else {
        await AgregarUsuarioAGrupo(context, funcion.grupoId, usuario.login);
      }
      ActualizarGruposUsuario(usuario.id, funcion.grupoId, !tiene);
      if (usuario.id === idUsuarioActual) {
        // Sus propios grupos cambian el menú: se vuelve a leer al recargar la página.
        InvalidarCacheMenu(context);
      }
    } catch (err) {
      console.error(err);
      setErrorAccion(
        `${tiene ? 'No se pudo quitar' : 'No se pudo otorgar'} «${funcion.funcion}» a ${usuario.nombre}: ${
          err instanceof SharePointRestError ? err.message : 'error inesperado'
        }`
      );
    } finally {
      setPendientes((p) => p.filter((c) => c !== clavePendiente));
    }
  };

  const Desvincular = async (usuario: UsuarioPermisos): Promise<void> => {
    if (
      !window.confirm(
        `¿Está seguro que desea desvincular a ${usuario.nombre} de la plataforma? Perderá todas sus funciones del Concentrador y el acceso al sitio.`
      )
    ) {
      return;
    }
    setErrorAccion(undefined);
    setAviso(undefined);
    setPendientes((p) => p.concat(`desvincular-${usuario.id}`));
    try {
      await DesvincularUsuario(context, usuario, funciones);
      setAviso(`${usuario.nombre} fue desvinculado.`);
      Recargar();
    } catch (err) {
      console.error(err);
      setErrorAccion(
        `No se pudo desvincular a ${usuario.nombre}: ${err instanceof SharePointRestError ? err.message : 'error inesperado'}`
      );
    } finally {
      setPendientes((p) => p.filter((c) => c !== `desvincular-${usuario.id}`));
    }
  };

  return (
    <CarcasaControlSitio
      icono="people"
      titulo="Permisos de usuario"
      descripcion="Funciones de cada usuario en el Concentrador, Control Sitio y COPE, y las centrales que puede gestionar."
    >
      <div className="cowork-vista__barra-acciones d-flex flex-wrap align-items-end gap-3 mb-3">
        <div>
          <label className="form-label mb-1" htmlFor="cowork-permisos-modulo">
            Módulo
          </label>
          <select
            id="cowork-permisos-modulo"
            className="form-select form-select-sm"
            value={modulo}
            onChange={(e) => setModulo(e.target.value)}
            disabled={cargando || modulos.length === 0}
          >
            {modulos.map((m) => (
              <option key={m.nombre} value={m.nombre}>
                {m.nombre} ({m.cantidad})
              </option>
            ))}
          </select>
        </div>
        <div className="flex-grow-1 cowork-permisos__busqueda">
          <label className="form-label mb-1" htmlFor="cowork-permisos-busqueda">
            Buscar usuario
          </label>
          <input
            id="cowork-permisos-busqueda"
            type="search"
            className="form-control form-control-sm"
            placeholder="Nombre del usuario"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <button type="button" className="btn btn-sm cowork-btn-primary" onClick={() => setAgregarVisible(true)} disabled={cargando}>
          <i className="bi bi-person-plus me-1" aria-hidden="true" />
          Agregar usuario
        </button>
      </div>

      {errorAccion ? (
        <div className="alert alert-danger py-2 d-flex justify-content-between align-items-start" role="alert">
          <span>{errorAccion}</span>
          <button type="button" className="btn-close" aria-label="Cerrar aviso" onClick={() => setErrorAccion(undefined)} />
        </div>
      ) : null}
      {aviso ? (
        <div className="alert alert-success py-2 d-flex justify-content-between align-items-start" role="status">
          <span>{aviso}</span>
          <button type="button" className="btn-close" aria-label="Cerrar aviso" onClick={() => setAviso(undefined)} />
        </div>
      ) : null}
      {errorCarga ? (
        <div className="alert alert-warning d-flex align-items-center justify-content-between" role="alert">
          <span>{errorCarga}</span>
          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={Recargar}>
            Reintentar
          </button>
        </div>
      ) : null}

      {cargando ? (
        <div className="text-muted py-3">
          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
          Cargando permisos…
        </div>
      ) : errorCarga ? null : usuariosVisibles.length === 0 ? (
        <p className="text-muted">{busqueda ? 'No hay usuarios que coincidan con la búsqueda.' : 'No hay usuarios en el Concentrador.'}</p>
      ) : (
        <table className="table table-sm table-bordered align-middle cowork-tabla-fichas cowork-tabla-fichas--lg cowork-permisos__matriz">
          <thead>
            <tr>
              <th scope="colgroup" colSpan={3} className="cowork-permisos__esquina" />
              <th
                scope="colgroup"
                colSpan={Math.max(funcionesModulo.length, 1)}
                className={`text-center cowork-permisos__modulo${
                  modulo === ModuloBloqueoPropio ? ' cowork-permisos__modulo--sitio' : ''
                }`}
              >
                {modulo}
              </th>
            </tr>
            <tr>
              <th scope="col">Usuario</th>
              <th scope="col" className="text-center">
                Centrales
              </th>
              <th scope="col" className="text-center">
                Desvin&shy;cular
              </th>
              {funcionesModulo.map((funcion) => (
                <th key={funcion.id} scope="col" className="text-center cowork-permisos__funcion" title={funcion.descripcion || undefined}>
                  {funcion.funcion}
                  {funcion.requiereValidacion ? (
                    <i className="bi bi-lock ms-1" title="Requiere datos completos del usuario" aria-hidden="true" />
                  ) : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {usuariosVisibles.map((usuario) => {
              const esActual = usuario.id === idUsuarioActual;
              const cantidadCentrales = instalaciones.get(usuario.id)?.instalacionIds.length ?? 0;
              const desvinculando = pendientes.indexOf(`desvincular-${usuario.id}`) >= 0;
              return (
                <tr key={usuario.id}>
                  <th scope="row" data-label="Usuario" className="cowork-permisos__usuario">
                    <i className="bi bi-person-circle me-2 text-success" aria-hidden="true" />
                    {usuario.nombre}
                    {usuario.correo ? <div className="small text-muted fw-normal">{usuario.correo}</div> : null}
                  </th>
                  <td data-label="Centrales" className="text-center">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary"
                      title="Gestionar centrales"
                      aria-label={`Centrales de ${usuario.nombre}: ${cantidadCentrales}`}
                      onClick={() => setUsuarioCentrales(usuario)}
                    >
                      <i className="bi bi-building me-1" aria-hidden="true" />
                      <span className="badge text-bg-info">{cantidadCentrales}</span>
                    </button>
                  </td>
                  <td data-label="Desvincular" className="text-center">
                    {esActual ? (
                      <i className="bi bi-person-lock text-muted" title="No puede desvincularse a sí mismo" aria-label="No puede desvincularse a sí mismo" />
                    ) : (
                      <button
                        type="button"
                        className="btn btn-sm btn-link p-0 text-danger"
                        title="Desvincular usuario"
                        aria-label={`Desvincular a ${usuario.nombre}`}
                        disabled={desvinculando}
                        onClick={() => {
                          Desvincular(usuario).catch(() => undefined);
                        }}
                      >
                        {desvinculando ? (
                          <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                        ) : (
                          <i className="bi bi-trash" aria-hidden="true" />
                        )}
                      </button>
                    )}
                  </td>
                  {funcionesModulo.map((funcion) => {
                    const tiene = usuario.grupos.indexOf(funcion.grupoId) >= 0;
                    const bloqueada = esActual && tiene && funcion.modulo === ModuloBloqueoPropio;
                    const pendiente = pendientes.indexOf(`${usuario.id}-${funcion.grupoId}`) >= 0;
                    const descripcion = `${usuario.nombre} - ${funcion.modulo} - ${funcion.funcion}`;
                    return (
                      <td key={funcion.id} data-label={funcion.funcion} className="text-center">
                        {bloqueada ? (
                          <i
                            className="bi bi-check-circle-fill text-danger cowork-permisos__icono"
                            title="No puede quitar este permiso"
                            aria-label={`${descripcion}: no puede quitar este permiso`}
                          />
                        ) : (
                          <button
                            type="button"
                            className="btn btn-sm btn-link p-0 cowork-permisos__celda"
                            title={`${descripcion}: ${tiene ? 'quitar' : 'otorgar'}`}
                            aria-label={`${descripcion}`}
                            aria-pressed={tiene}
                            disabled={pendiente}
                            onClick={() => {
                              AlternarFuncion(usuario, funcion).catch(() => undefined);
                            }}
                          >
                            {pendiente ? (
                              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                            ) : (
                              <i
                                className={`bi cowork-permisos__icono ${
                                  tiene ? 'bi-check-circle-fill text-success' : 'bi-circle text-muted'
                                }`}
                                aria-hidden="true"
                              />
                            )}
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <ModalCentralesUsuario
        context={context}
        usuario={usuarioCentrales}
        centrales={centrales}
        asignadas={usuarioCentrales ? instalaciones.get(usuarioCentrales.id) : undefined}
        onCerrar={() => setUsuarioCentrales(undefined)}
        onGuardado={(usuarioId, registro) => {
          setInstalaciones((previo) => new Map(previo).set(usuarioId, registro));
        }}
      />
      <ModalAgregarUsuario
        context={context}
        visible={agregarVisible}
        usuariosExistentes={usuarios}
        onCerrar={() => setAgregarVisible(false)}
        onAgregado={(nombre) => {
          setAviso(`${nombre} fue agregado al Concentrador. Asígnele sus funciones en la matriz.`);
          Recargar();
        }}
      />
    </CarcasaControlSitio>
  );
}
