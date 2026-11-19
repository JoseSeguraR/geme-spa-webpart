import * as React from 'react';
import type { AdjuntoSolicitudFalla, DetalleSolicitudFalla } from '../../../../../models/SolicitudFalla';
import { FormatearFechaHoraVisible } from '../../../../../utils/FechaHoraCorConecta';
import {
  BloqueEstadoAlertaVerSolicitudFalla,
  CampoLecturaVerSolicitudFalla,
  ColumnaCampoVerSolicitudFalla,
  GrillaCamposVerSolicitudFalla,
  InsigniaIntegracionSiodVerFalla,
  ResolverTextoResultadoIntegracionSiod,
  TarjetaSeccionVerSolicitudFalla
} from './PresentacionVerSolicitudFalla';
import { IconoAdjuntoPorNombre } from './UtilidadesAdjuntosSolicitudFalla';

export type PresentacionDetalleSolicitudFallaProps = {
  detalle: DetalleSolicitudFalla;
  adjuntos: readonly AdjuntoSolicitudFalla[];
  cargando?: boolean;
  prefijoId?: string;
  mostrarIntegracionSiod?: boolean;
};

function FormatearEquiposMultilinea(equiposEtiqueta: string): string {
  if (!equiposEtiqueta.trim()) {
    return '';
  }
  return equiposEtiqueta
    .split(',')
    .map((parte) => parte.trim())
    .filter(Boolean)
    .join('\n');
}

export default function PresentacionDetalleSolicitudFalla(
  props: PresentacionDetalleSolicitudFallaProps
): React.ReactElement {
  const {
    detalle,
    adjuntos,
    cargando,
    prefijoId = 'detalle-falla',
    mostrarIntegracionSiod = true
  } = props;

  const fechaIntegracionVisible = FormatearFechaHoraVisible(detalle.fechaIntegracionSiod) || '—';
  const fechaCreacionVisible = FormatearFechaHoraVisible(detalle.fechaCreacion) || '—';
  const potenciaVisible =
    typeof detalle.potencia === 'number' && !Number.isNaN(detalle.potencia)
      ? detalle.potencia.toFixed(2)
      : '—';
  const medidaVisible = detalle.medida?.trim() || 'MW';
  const resultadoSiod = ResolverTextoResultadoIntegracionSiod(detalle.integradoSiod, detalle.resultadoSiod);

  return (
    <>
      {cargando ? <p className="cowork-modal-solicitud-falla__texto-apoyo mb-3">Cargando detalle…</p> : null}

      <TarjetaSeccionVerSolicitudFalla titulo="Estado" iconoBootstrap="bi-info-circle">
        <GrillaCamposVerSolicitudFalla>
          <ColumnaCampoVerSolicitudFalla anchoCompleto>
            <BloqueEstadoAlertaVerSolicitudFalla estado={detalle.estado} />
          </ColumnaCampoVerSolicitudFalla>
        </GrillaCamposVerSolicitudFalla>
      </TarjetaSeccionVerSolicitudFalla>

      {mostrarIntegracionSiod ? (
        <TarjetaSeccionVerSolicitudFalla titulo="Estado de Integración SIOD" iconoBootstrap="bi-arrow-repeat">
          <GrillaCamposVerSolicitudFalla>
            <ColumnaCampoVerSolicitudFalla>
              <div className="cowork-modal-solicitud-falla__campo-contenedor">
                <span className="form-label cowork-modal-solicitud-falla__etiqueta mb-1 d-block">Estado de Integración</span>
                <InsigniaIntegracionSiodVerFalla integrado={detalle.integradoSiod} />
              </div>
            </ColumnaCampoVerSolicitudFalla>
            {detalle.integradoSiod ? (
              <ColumnaCampoVerSolicitudFalla>
                <CampoLecturaVerSolicitudFalla
                  id={`${prefijoId}-fecha-integracion`}
                  etiqueta="Fecha de Integración"
                  valor={fechaIntegracionVisible}
                />
              </ColumnaCampoVerSolicitudFalla>
            ) : null}
          </GrillaCamposVerSolicitudFalla>
          {detalle.integradoSiod ? (
            <GrillaCamposVerSolicitudFalla>
              <ColumnaCampoVerSolicitudFalla anchoCompleto>
                <div className="cowork-modal-solicitud-falla__campo-contenedor">
                  <span className="form-label cowork-modal-solicitud-falla__etiqueta mb-1 d-block">
                    Resultado de Integración
                  </span>
                  <div className="alert alert-success mb-0 py-2" role="status">
                    <i className="bi bi-check-circle me-2" aria-hidden="true" />
                    <strong>{resultadoSiod}</strong>
                  </div>
                </div>
              </ColumnaCampoVerSolicitudFalla>
            </GrillaCamposVerSolicitudFalla>
          ) : null}
        </TarjetaSeccionVerSolicitudFalla>
      ) : null}

      <TarjetaSeccionVerSolicitudFalla titulo="Identificación" iconoBootstrap="bi-person-badge">
        <GrillaCamposVerSolicitudFalla>
          <ColumnaCampoVerSolicitudFalla>
            <CampoLecturaVerSolicitudFalla
              id={`${prefijoId}-id-cen`}
              etiqueta="ID CEN"
              valor={detalle.idCen || '—'}
            />
          </ColumnaCampoVerSolicitudFalla>
          <ColumnaCampoVerSolicitudFalla>
            <CampoLecturaVerSolicitudFalla
              id={`${prefijoId}-fecha-creacion`}
              etiqueta="Fecha de Creación"
              valor={fechaCreacionVisible}
            />
          </ColumnaCampoVerSolicitudFalla>
          <ColumnaCampoVerSolicitudFalla>
            <CampoLecturaVerSolicitudFalla
              id={`${prefijoId}-usuario`}
              etiqueta="Usuario Creador"
              valor={detalle.usuarioCreador?.trim() || '—'}
            />
          </ColumnaCampoVerSolicitudFalla>
        </GrillaCamposVerSolicitudFalla>
      </TarjetaSeccionVerSolicitudFalla>

      <TarjetaSeccionVerSolicitudFalla titulo="Fechas" iconoBootstrap="bi-calendar-event">
        <GrillaCamposVerSolicitudFalla>
          <ColumnaCampoVerSolicitudFalla>
            <CampoLecturaVerSolicitudFalla
              id={`${prefijoId}-perturbacion`}
              etiqueta="Fecha y Hora de la Perturbación"
              valor={FormatearFechaHoraVisible(detalle.fechaPerturbacion) || '—'}
            />
          </ColumnaCampoVerSolicitudFalla>
          <ColumnaCampoVerSolicitudFalla>
            <CampoLecturaVerSolicitudFalla
              id={`${prefijoId}-retorno`}
              etiqueta="Fecha y Hora Efectiva de Retorno"
              valor={FormatearFechaHoraVisible(detalle.fechaRetorno) || '—'}
            />
          </ColumnaCampoVerSolicitudFalla>
        </GrillaCamposVerSolicitudFalla>
      </TarjetaSeccionVerSolicitudFalla>

      <TarjetaSeccionVerSolicitudFalla titulo="Ubicación" iconoBootstrap="bi-geo-alt">
        <GrillaCamposVerSolicitudFalla>
          <ColumnaCampoVerSolicitudFalla>
            <CampoLecturaVerSolicitudFalla
              id={`${prefijoId}-central`}
              etiqueta="Central"
              valor={detalle.centralEtiqueta || '—'}
            />
          </ColumnaCampoVerSolicitudFalla>
        </GrillaCamposVerSolicitudFalla>
        <GrillaCamposVerSolicitudFalla>
          <ColumnaCampoVerSolicitudFalla anchoCompleto>
            <CampoLecturaVerSolicitudFalla
              id={`${prefijoId}-equipos`}
              etiqueta="Equipo o Instalación"
              valor={FormatearEquiposMultilinea(detalle.equiposEtiqueta) || '—'}
              multilinea
              filas={3}
            />
          </ColumnaCampoVerSolicitudFalla>
        </GrillaCamposVerSolicitudFalla>
      </TarjetaSeccionVerSolicitudFalla>

      <TarjetaSeccionVerSolicitudFalla titulo="Detalles Técnicos" iconoBootstrap="bi-lightning-charge">
        <GrillaCamposVerSolicitudFalla>
          <ColumnaCampoVerSolicitudFalla>
            <CampoLecturaVerSolicitudFalla
              id={`${prefijoId}-potencia`}
              etiqueta="Pérdida de Potencia PP"
              valor={potenciaVisible}
            />
          </ColumnaCampoVerSolicitudFalla>
          <ColumnaCampoVerSolicitudFalla>
            <CampoLecturaVerSolicitudFalla id={`${prefijoId}-medida`} etiqueta="Medida" valor={medidaVisible} />
          </ColumnaCampoVerSolicitudFalla>
        </GrillaCamposVerSolicitudFalla>
        <GrillaCamposVerSolicitudFalla>
          <ColumnaCampoVerSolicitudFalla anchoCompleto>
            <CampoLecturaVerSolicitudFalla
              id={`${prefijoId}-descripcion`}
              etiqueta="Descripción"
              valor={detalle.descripcion?.trim() || '—'}
              multilinea
              filas={4}
            />
          </ColumnaCampoVerSolicitudFalla>
        </GrillaCamposVerSolicitudFalla>
      </TarjetaSeccionVerSolicitudFalla>

      <TarjetaSeccionVerSolicitudFalla titulo="Archivos Adjuntos" iconoBootstrap="bi-paperclip">
        {adjuntos.length === 0 ? (
          <p className="cowork-modal-solicitud-falla__texto-apoyo mb-0">Sin archivos adjuntos</p>
        ) : (
          <ul className="list-group cowork-modal-solicitud-falla__adjuntos mb-0">
            {adjuntos.map((adjunto) => (
              <li
                key={adjunto.nombreArchivo}
                className="list-group-item d-flex align-items-center justify-content-between gap-2"
              >
                <span className="text-break d-flex align-items-center gap-2 cowork-modal-solicitud-falla__texto-adjunto">
                  <i className={`bi ${IconoAdjuntoPorNombre(adjunto.nombreArchivo)}`} aria-hidden="true" />
                  {adjunto.nombreArchivo}
                </span>
                <a
                  className="btn btn-sm btn-primary text-nowrap"
                  href={adjunto.urlDescarga}
                  download={adjunto.nombreArchivo}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i className="bi bi-download me-1" aria-hidden="true" />
                  Descargar
                </a>
              </li>
            ))}
          </ul>
        )}
      </TarjetaSeccionVerSolicitudFalla>
    </>
  );
}