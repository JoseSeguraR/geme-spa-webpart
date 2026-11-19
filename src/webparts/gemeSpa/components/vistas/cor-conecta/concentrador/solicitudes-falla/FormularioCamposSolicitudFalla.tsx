import * as React from 'react';
import { useMemo } from 'react';
import type { CentralMantenedor, EquipoMantenedorFalla, MedidaPotenciaFalla } from '../../../../../models/SolicitudFalla';
import CampoFechaHora24 from '../../../../concentrador/CampoFechaHora24';
import { EstadoSolicitudFallaVigente } from './constantesSolicitudFalla';
import {
  ColumnaCampoVerSolicitudFalla,
  GrillaCamposVerSolicitudFalla,
  TarjetaSeccionVerSolicitudFalla
} from './PresentacionVerSolicitudFalla';
import SelectMultipleFiltroVista from './SelectMultipleFiltroVista';

export type ValoresFormularioSolicitudFalla = {
  idCen: string;
  centralId: string;
  equiposIds: string[];
  fechaPerturbacion: string;
  fechaRetorno: string;
  potencia: string;
  medida: MedidaPotenciaFalla;
  descripcion: string;
};

export type DisposicionFormularioSolicitudFalla = 'plano' | 'secciones';

export type FormularioCamposSolicitudFallaProps = {
  valores: ValoresFormularioSolicitudFalla;
  centrales: CentralMantenedor[];
  equipos: EquipoMantenedorFalla[];
  equiposCargando: boolean;
  estadoSoloLectura?: string;
  disposicion?: DisposicionFormularioSolicitudFalla;
  mostrarEstadoInicialVigente?: boolean;
  archivosAdjuntos?: File[];
  onCambioArchivosAdjuntos?: (archivos: File[]) => void;
  idAdjuntos?: string;
  onCambio: (parcial: Partial<ValoresFormularioSolicitudFalla>) => void;
  onCambioCentral: (centralId: string) => void;
};

const ClaseEtiqueta = 'form-label cowork-modal-solicitud-falla__etiqueta mb-1';
const ClaseControl = 'form-control form-control-sm cowork-modal-solicitud-falla__control';
const ClaseSelect = 'form-select form-select-sm cowork-modal-solicitud-falla__control';
const ClaseAyuda = 'cowork-modal-solicitud-falla__ayuda-campo d-block mt-1';

function ContenedorCampo(props: { children: React.ReactNode }): React.ReactElement {
  return <div className="cowork-modal-solicitud-falla__campo-contenedor">{props.children}</div>;
}

function CamposIdentificacionFalla(props: {
  valores: ValoresFormularioSolicitudFalla;
  estadoVisible?: string;
  textoAyudaEstado?: boolean;
  onCambio: (parcial: Partial<ValoresFormularioSolicitudFalla>) => void;
}): React.ReactElement {
  const { valores, estadoVisible, textoAyudaEstado, onCambio } = props;
  return (
    <GrillaCamposVerSolicitudFalla>
      <ColumnaCampoVerSolicitudFalla>
        <ContenedorCampo>
          <label className={ClaseEtiqueta} htmlFor="falla-id-cen">
            ID CEN <span className="text-danger">*</span>
          </label>
          <input
            id="falla-id-cen"
            className={ClaseControl}
            placeholder="Ej: CEN-2026-XXX"
            value={valores.idCen}
            onChange={(evento) => onCambio({ idCen: evento.target.value })}
            required
          />
          <small className={ClaseAyuda}>Identificador único de la perturbación</small>
        </ContenedorCampo>
      </ColumnaCampoVerSolicitudFalla>
      {estadoVisible ? (
        <ColumnaCampoVerSolicitudFalla>
          <ContenedorCampo>
            <label className={ClaseEtiqueta} htmlFor="falla-estado">
              Estado
            </label>
            <input id="falla-estado" className={ClaseControl} value={estadoVisible} disabled />
            {textoAyudaEstado ? <small className={ClaseAyuda}>Estado inicial de la solicitud</small> : null}
          </ContenedorCampo>
        </ColumnaCampoVerSolicitudFalla>
      ) : null}
    </GrillaCamposVerSolicitudFalla>
  );
}

function CamposFechasFalla(props: {
  valores: ValoresFormularioSolicitudFalla;
  onCambio: (parcial: Partial<ValoresFormularioSolicitudFalla>) => void;
}): React.ReactElement {
  const { valores, onCambio } = props;
  return (
    <GrillaCamposVerSolicitudFalla>
      <ColumnaCampoVerSolicitudFalla>
        <ContenedorCampo>
          <label className={ClaseEtiqueta} htmlFor="falla-fecha-perturbacion">
            Fecha y Hora de la Perturbación <span className="text-danger">*</span>
          </label>
          <CampoFechaHora24
            id="falla-fecha-perturbacion"
            valor={valores.fechaPerturbacion}
            onCambio={(valor) => onCambio({ fechaPerturbacion: valor })}
            required
          />
        </ContenedorCampo>
      </ColumnaCampoVerSolicitudFalla>
      <ColumnaCampoVerSolicitudFalla>
        <ContenedorCampo>
          <label className={ClaseEtiqueta} htmlFor="falla-fecha-retorno">
            Fecha y Hora Efectiva de Retorno
          </label>
          <CampoFechaHora24
            id="falla-fecha-retorno"
            valor={valores.fechaRetorno}
            onCambio={(valor) => onCambio({ fechaRetorno: valor })}
          />
        </ContenedorCampo>
      </ColumnaCampoVerSolicitudFalla>
    </GrillaCamposVerSolicitudFalla>
  );
}

function CamposUbicacionFalla(props: {
  valores: ValoresFormularioSolicitudFalla;
  centrales: CentralMantenedor[];
  equipos: EquipoMantenedorFalla[];
  equiposCargando: boolean;
  onCambio: (parcial: Partial<ValoresFormularioSolicitudFalla>) => void;
  onCambioCentral: (centralId: string) => void;
}): React.ReactElement {
  const { valores, centrales, equipos, equiposCargando, onCambio, onCambioCentral } = props;

  const opcionesEquipos = useMemo(
    () =>
      equipos.map((equipo) => ({
        id: String(equipo.id),
        etiqueta: equipo.nombre
      })),
    [equipos]
  );

  const textoEquipoSinSeleccion = !valores.centralId
    ? 'Seleccione una central'
    : equiposCargando
      ? 'Cargando equipos…'
      : opcionesEquipos.length === 0
        ? 'Sin equipos para esta central'
        : 'Seleccione uno o más';

  return (
    <>
      <GrillaCamposVerSolicitudFalla>
        <ColumnaCampoVerSolicitudFalla>
          <ContenedorCampo>
            <label className={ClaseEtiqueta} htmlFor="falla-central">
              Central <span className="text-danger">*</span>
            </label>
            <select
              id="falla-central"
              className={ClaseSelect}
              value={valores.centralId}
              onChange={(evento) => onCambioCentral(evento.target.value)}
              required
            >
              <option value="">Seleccione...</option>
              {centrales.map((central) => (
                <option key={central.id} value={central.id}>
                  {central.central}
                </option>
              ))}
            </select>
          </ContenedorCampo>
        </ColumnaCampoVerSolicitudFalla>
      </GrillaCamposVerSolicitudFalla>
      <GrillaCamposVerSolicitudFalla>
        <ColumnaCampoVerSolicitudFalla anchoCompleto>
          <ContenedorCampo>
            <label className={ClaseEtiqueta} htmlFor="falla-equipos">
              Equipo o Instalación <span className="text-danger">*</span>
            </label>
            <SelectMultipleFiltroVista
              id="falla-equipos"
              opciones={opcionesEquipos}
              valoresSeleccionados={valores.equiposIds}
              onCambio={(seleccionados) => onCambio({ equiposIds: seleccionados })}
              deshabilitado={!valores.centralId || equiposCargando || opcionesEquipos.length === 0}
              textoSinSeleccion={textoEquipoSinSeleccion}
              etiquetaAria="Seleccionar equipos o instalaciones afectados"
            />
            <small className={ClaseAyuda}>Busque en la lista y marque uno o más equipos</small>
          </ContenedorCampo>
        </ColumnaCampoVerSolicitudFalla>
      </GrillaCamposVerSolicitudFalla>
    </>
  );
}

function CamposDetallesTecnicosFalla(props: {
  valores: ValoresFormularioSolicitudFalla;
  archivosAdjuntos?: File[];
  idAdjuntos: string;
  onCambioArchivosAdjuntos?: (archivos: File[]) => void;
  onCambio: (parcial: Partial<ValoresFormularioSolicitudFalla>) => void;
}): React.ReactElement {
  const { valores, archivosAdjuntos, idAdjuntos, onCambioArchivosAdjuntos, onCambio } = props;

  return (
    <>
      <GrillaCamposVerSolicitudFalla>
        <ColumnaCampoVerSolicitudFalla>
          <ContenedorCampo>
            <label className={ClaseEtiqueta} htmlFor="falla-potencia">
              Pérdida de Potencia PP <span className="text-danger">*</span>
            </label>
            <input
              id="falla-potencia"
              type="number"
              step="0.01"
              min="0"
              className={ClaseControl}
              placeholder="Ej: 150.50"
              value={valores.potencia}
              onChange={(evento) => onCambio({ potencia: evento.target.value })}
              required
            />
            <small className={ClaseAyuda}>Dos decimales</small>
          </ContenedorCampo>
        </ColumnaCampoVerSolicitudFalla>
        <ColumnaCampoVerSolicitudFalla>
          <ContenedorCampo>
            <label className={ClaseEtiqueta} htmlFor="falla-medida">
              Medida <span className="text-danger">*</span>
            </label>
            <select
              id="falla-medida"
              className={ClaseSelect}
              value={valores.medida}
              onChange={(evento) => onCambio({ medida: evento.target.value as MedidaPotenciaFalla })}
            >
              <option value="MW">MW</option>
              <option value="MWh">MWh</option>
            </select>
          </ContenedorCampo>
        </ColumnaCampoVerSolicitudFalla>
        {onCambioArchivosAdjuntos ? (
          <ColumnaCampoVerSolicitudFalla>
            <ContenedorCampo>
              <label className={ClaseEtiqueta} htmlFor={idAdjuntos}>
                Adjuntos
              </label>
              <input
                id={idAdjuntos}
                type="file"
                className={ClaseControl}
                multiple
                accept=".pdf,.zip,.cfg,.dat,application/pdf,application/zip"
                onChange={(evento) => onCambioArchivosAdjuntos(Array.from(evento.target.files ?? []))}
              />
              <small className={ClaseAyuda}>Formatos permitidos: PDF, ZIP, CFG, DAT</small>
              {archivosAdjuntos && archivosAdjuntos.length > 0 ? (
                <ul className="list-group cowork-modal-solicitud-falla__adjuntos mt-2 mb-0">
                  {archivosAdjuntos.map((archivo) => (
                    <li key={`${archivo.name}-${archivo.size}`} className="list-group-item py-1">
                      <span className="cowork-modal-solicitud-falla__texto-adjunto d-flex align-items-center gap-2">
                        <i className="bi bi-file-earmark" aria-hidden="true" />
                        {archivo.name}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </ContenedorCampo>
          </ColumnaCampoVerSolicitudFalla>
        ) : null}
      </GrillaCamposVerSolicitudFalla>
      <GrillaCamposVerSolicitudFalla>
        <ColumnaCampoVerSolicitudFalla anchoCompleto>
          <ContenedorCampo>
            <label className={ClaseEtiqueta} htmlFor="falla-descripcion">
              Descripción <span className="text-danger">*</span>
            </label>
            <textarea
              id="falla-descripcion"
              className={ClaseControl}
              rows={4}
              placeholder="Describa detalladamente la perturbación, causas y acciones tomadas..."
              value={valores.descripcion}
              onChange={(evento) => onCambio({ descripcion: evento.target.value })}
              required
            />
          </ContenedorCampo>
        </ColumnaCampoVerSolicitudFalla>
      </GrillaCamposVerSolicitudFalla>
    </>
  );
}

export default function FormularioCamposSolicitudFalla(
  props: FormularioCamposSolicitudFallaProps
): React.ReactElement {
  const {
    valores,
    centrales,
    equipos,
    equiposCargando,
    estadoSoloLectura,
    disposicion = 'plano',
    mostrarEstadoInicialVigente,
    archivosAdjuntos,
    onCambioArchivosAdjuntos,
    idAdjuntos = 'falla-adjuntos-nueva',
    onCambio,
    onCambioCentral
  } = props;

  const estadoVisible =
    estadoSoloLectura ?? (mostrarEstadoInicialVigente ? EstadoSolicitudFallaVigente : undefined);
  const textoAyudaEstado = Boolean(mostrarEstadoInicialVigente && estadoVisible === EstadoSolicitudFallaVigente);

  if (disposicion === 'secciones') {
    return (
      <>
        <TarjetaSeccionVerSolicitudFalla titulo="Identificación" iconoBootstrap="bi-person-badge">
          <CamposIdentificacionFalla
            valores={valores}
            estadoVisible={estadoVisible}
            textoAyudaEstado={textoAyudaEstado}
            onCambio={onCambio}
          />
        </TarjetaSeccionVerSolicitudFalla>
        <TarjetaSeccionVerSolicitudFalla titulo="Fechas" iconoBootstrap="bi-calendar-event">
          <CamposFechasFalla valores={valores} onCambio={onCambio} />
        </TarjetaSeccionVerSolicitudFalla>
        <TarjetaSeccionVerSolicitudFalla titulo="Ubicación" iconoBootstrap="bi-geo-alt">
          <CamposUbicacionFalla
            valores={valores}
            centrales={centrales}
            equipos={equipos}
            equiposCargando={equiposCargando}
            onCambio={onCambio}
            onCambioCentral={onCambioCentral}
          />
        </TarjetaSeccionVerSolicitudFalla>
        <TarjetaSeccionVerSolicitudFalla titulo="Detalles Técnicos" iconoBootstrap="bi-lightning-charge">
          <CamposDetallesTecnicosFalla
            valores={valores}
            archivosAdjuntos={archivosAdjuntos}
            idAdjuntos={idAdjuntos}
            onCambioArchivosAdjuntos={onCambioArchivosAdjuntos}
            onCambio={onCambio}
          />
        </TarjetaSeccionVerSolicitudFalla>
      </>
    );
  }

  return (
    <div className="cowork-modal-solicitud-falla__campo-contenedor">
      <CamposIdentificacionFalla
        valores={valores}
        estadoVisible={estadoVisible}
        textoAyudaEstado={textoAyudaEstado}
        onCambio={onCambio}
      />
      <CamposFechasFalla valores={valores} onCambio={onCambio} />
      <CamposUbicacionFalla
        valores={valores}
        centrales={centrales}
        equipos={equipos}
        equiposCargando={equiposCargando}
        onCambio={onCambio}
        onCambioCentral={onCambioCentral}
      />
      <CamposDetallesTecnicosFalla
        valores={valores}
        archivosAdjuntos={archivosAdjuntos}
        idAdjuntos={idAdjuntos}
        onCambioArchivosAdjuntos={onCambioArchivosAdjuntos}
        onCambio={onCambio}
      />
    </div>
  );
}

export function ValidarFechasFalla(fechaPerturbacion: string, fechaRetorno: string): string | undefined {
  if (!fechaRetorno.trim()) {
    return undefined;
  }
  if (!fechaPerturbacion.trim()) {
    return 'Indique la fecha de perturbación.';
  }
  const perturbacion = new Date(fechaPerturbacion);
  const retorno = new Date(fechaRetorno);
  if (Number.isNaN(perturbacion.getTime()) || Number.isNaN(retorno.getTime())) {
    return 'Revise el formato de las fechas.';
  }
  if (retorno.getTime() <= perturbacion.getTime()) {
    return 'La fecha de retorno debe ser posterior a la fecha de perturbación.';
  }
  return undefined;
}