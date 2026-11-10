import * as React from 'react';
import type { WebPartContext } from '@microsoft/sp-webpart-base';
import {
  NombreListaAfectaciones,
  NombreListaCentrales,
  NombreListaEmpresas,
  NombreListaTiposEquipos,
  NombreListaTiposTecnologia,
  NombreListaTiposTrabajos
} from '../../../../../services/sharepoint/concentradorComun/NombresListasConcentrador';
import { ObtenerTodosLosItemsLista } from '../../../../../services/sharepoint/listaGenerica/ListaSharePointServicio';
import { ObtenerCentralesMeteologica } from '../../../../../services/sharepoint/operadorRenovable/CapacidadCentralApiServicio';
import { CampoFacilityIdMeteologica } from '../../../../../services/sharepoint/operadorRenovable/CamposOperadorRenovable';
import { ClaseBootstrapIconoTecnologia, OpcionesIconoTecnologia } from './IconosTecnologia';
import type { DefinicionCatalogo, FilaCatalogo, OpcionCampoCatalogo, OpcionesDinamicasCatalogo } from './TiposCatalogo';
import {
  CampoEstadoCatalogo,
  CampoLookup,
  ColumnaEstadoCatalogo,
  EnteroONulo,
  EstadoRegistroActivo,
  TextoColumna,
  ValorTexto,
  ValoresMultiples
} from './UtilidadesCatalogo';

/** Clase de las celdas que parten el texto en varias líneas (`_vista.scss`, grilla multilínea). */
const ClaseTextoLargo = 'cowork-celda-texto-largo';

function TextoBusqueda(...claves: string[]): (fila: FilaCatalogo) => string {
  return (fila) => claves.map((clave) => ValorTexto(fila, clave)).join(' ');
}

function BadgeCodigo(props: { codigo: string }): React.ReactElement {
  return props.codigo ? <span className="badge text-bg-light border">{props.codigo}</span> : <span>—</span>;
}

// ---------------------------------------------------------------------------------------------
// Empresas solicitantes/receptoras — CONC_MANTENEDOR_EMPRESAS (EMPRESA, CODIGO, ESTADO)
// ---------------------------------------------------------------------------------------------
export const DefinicionEmpresas: DefinicionCatalogo = {
  lista: NombreListaEmpresas,
  nombreRegistro: 'empresa',
  consulta: { select: 'Id,EMPRESA,CODIGO,ESTADO', orderby: 'EMPRESA asc' },
  leer: (item) => ({
    id: Number(item.Id),
    nombre: TextoColumna(item.EMPRESA),
    codigo: TextoColumna(item.CODIGO),
    estado: TextoColumna(item.ESTADO)
  }),
  construirCuerpo: (v) => ({ EMPRESA: v.nombre, CODIGO: v.codigo, ESTADO: v.estado }),
  campos: [
    { clave: 'nombre', etiqueta: 'Nombre de la empresa', tipo: 'texto', obligatorio: true, maxLength: 255, unico: true },
    {
      clave: 'codigo',
      etiqueta: 'Código o abreviatura',
      tipo: 'texto',
      obligatorio: true,
      maxLength: 10,
      mayusculas: true,
      ayuda: 'Máximo 10 caracteres.'
    },
    CampoEstadoCatalogo
  ],
  columnas: [
    { field: 'nombre', headerName: 'Empresa', flex: 1, minWidth: 200, cellClassName: ClaseTextoLargo },
    {
      field: 'codigo',
      headerName: 'Código',
      width: 130,
      renderCell: (p) => <BadgeCodigo codigo={ValorTexto(p.row, 'codigo')} />
    },
    ColumnaEstadoCatalogo
  ],
  campoOrden: 'nombre',
  textoBusqueda: TextoBusqueda('nombre', 'codigo', 'estado')
};

// ---------------------------------------------------------------------------------------------
// Tipos de tecnología — CONC_MANTENEDOR_TIPOTECNOLOGIA (CODIGO, NOMBRE, ICONO, ESTADO)
// ---------------------------------------------------------------------------------------------
export const DefinicionTiposTecnologia: DefinicionCatalogo = {
  lista: NombreListaTiposTecnologia,
  nombreRegistro: 'tipo de tecnología',
  consulta: { select: 'Id,CODIGO,NOMBRE,ICONO,ESTADO', orderby: 'NOMBRE asc' },
  leer: (item) => ({
    id: Number(item.Id),
    codigo: TextoColumna(item.CODIGO),
    nombre: TextoColumna(item.NOMBRE),
    icono: TextoColumna(item.ICONO),
    estado: TextoColumna(item.ESTADO)
  }),
  construirCuerpo: (v) => ({ CODIGO: v.codigo, NOMBRE: v.nombre, ICONO: v.icono, ESTADO: v.estado }),
  campos: [
    { clave: 'codigo', etiqueta: 'Código', tipo: 'texto', obligatorio: true, maxLength: 20, unico: true, placeholder: 'Solar, Termica, BESS' },
    { clave: 'nombre', etiqueta: 'Nombre', tipo: 'texto', obligatorio: true, maxLength: 255, unico: true },
    {
      clave: 'icono',
      etiqueta: 'Ícono',
      tipo: 'seleccion',
      obligatorio: true,
      opciones: OpcionesIconoTecnologia,
      textoOpcionVacia: '-- Seleccione --'
    },
    CampoEstadoCatalogo
  ],
  columnas: [
    {
      field: 'codigo',
      headerName: 'Código',
      width: 130,
      renderCell: (p) => <BadgeCodigo codigo={ValorTexto(p.row, 'codigo')} />
    },
    { field: 'nombre', headerName: 'Nombre', flex: 1, minWidth: 180, cellClassName: ClaseTextoLargo },
    {
      field: 'icono',
      headerName: 'Ícono',
      width: 90,
      align: 'center',
      headerAlign: 'center',
      sortable: false,
      renderCell: (p) => {
        const clase = ClaseBootstrapIconoTecnologia(ValorTexto(p.row, 'icono'));
        return clase ? <i className={`bi ${clase} fs-5`} title={ValorTexto(p.row, 'icono')} aria-hidden="true" /> : <span>—</span>;
      }
    },
    ColumnaEstadoCatalogo
  ],
  campoOrden: 'nombre',
  textoBusqueda: TextoBusqueda('codigo', 'nombre', 'estado')
};

// ---------------------------------------------------------------------------------------------
// Centrales GM — CONC_MANTENEDOR_INSTALACIONES
// ---------------------------------------------------------------------------------------------
const OpcionesTipoCentral: readonly OpcionCampoCatalogo[] = [
  { valor: 'Interna', etiqueta: 'Interna' },
  { valor: 'Externa', etiqueta: 'Externa' }
];

const OpcionesModulosCentral: readonly OpcionCampoCatalogo[] = [
  { valor: 'Concentrador', etiqueta: 'Concentrador' },
  { valor: 'COPE', etiqueta: 'COPE' }
];

/** Tecnologías activas para el selector de la central (lookup TIPO_TECNOLOGIA → NOMBRE). */
async function CargarOpcionesTecnologia(context: WebPartContext): Promise<OpcionesDinamicasCatalogo> {
  const items = await ObtenerTodosLosItemsLista<Record<string, unknown>>(context, NombreListaTiposTecnologia, {
    select: 'Id,NOMBRE',
    filter: `ESTADO eq '${EstadoRegistroActivo}'`,
    orderby: 'NOMBRE asc'
  });
  return {
    tecnologias: items.map((item) => ({ valor: String(item.Id), etiqueta: TextoColumna(item.NOMBRE) }))
  };
}

/**
 * Centrales de la cuenta de Meteológica para asociar a la central (`FACILITY_ID_METEOLOGICA`), desde la App Function.
 * Si la URL no está configurada o la Function falla, la lista queda vacía y el mantenedor sigue funcionando.
 */
let motivoSinCentralesMeteologica = '';

async function CargarOpcionesMeteologica(): Promise<OpcionesDinamicasCatalogo> {
  try {
    const centrales = await ObtenerCentralesMeteologica();
    if (centrales === undefined) {
      motivoSinCentralesMeteologica =
        'El web part no tiene configurada la «URL centrales en Meteológica» (propiedades del web part, grupo «Operador renovable · Meteológica»).';
    } else if (centrales.length === 0) {
      motivoSinCentralesMeteologica = 'Meteológica no devolvió centrales para la cuenta de GM.';
    }
    return {
      centralesMeteologica: (centrales ?? [])
        .sort((a, b) => a.nombre.localeCompare(b.nombre))
        .map((central) => ({
          valor: central.facilityId,
          etiqueta:
            `${central.nombre} — ${central.facilityId}` +
            (central.capacidadMw === undefined ? '' : ` (${central.capacidadMw.toLocaleString('es-CL')} MW)`)
        }))
    };
  } catch (err) {
    console.error('[Meteológica] No se pudo obtener el listado de centrales.', err);
    const mensaje = err instanceof Error ? err.message : '';
    motivoSinCentralesMeteologica = /^HTTP \d+/.test(mensaje)
      ? `La App Function respondió ${mensaje}. Revise la URL y su ?code=<function key>.`
      : `No se pudo conectar con la App Function. Revise la URL y que el CORS de la Function App permita ${window.location.origin}.`;
    return { centralesMeteologica: [] };
  }
}

async function CargarOpcionesCentrales(context: WebPartContext): Promise<OpcionesDinamicasCatalogo> {
  const [tecnologias, meteologica] = await Promise.all([CargarOpcionesTecnologia(context), CargarOpcionesMeteologica()]);
  return { ...tecnologias, ...meteologica };
}

export const DefinicionCentrales: DefinicionCatalogo = {
  lista: NombreListaCentrales,
  nombreRegistro: 'central',
  consulta: {
    select:
      'Id,INSTALACION,CODIGO,CODIGO_SIOD,TIPO_TECNOLOGIAId,TIPO_TECNOLOGIA/NOMBRE,TIPO_TECNOLOGIA/ICONO,Type,MODULOS,ID_MANT_SIG,ESTADO,' +
      CampoFacilityIdMeteologica,
    expand: 'TIPO_TECNOLOGIA',
    orderby: 'INSTALACION asc'
  },
  leer: (item) => ({
    id: Number(item.Id),
    nombre: TextoColumna(item.INSTALACION),
    codigo: TextoColumna(item.CODIGO),
    codigoSiod: TextoColumna(item.CODIGO_SIOD),
    tecnologiaId: TextoColumna(item.TIPO_TECNOLOGIAId),
    tecnologia: CampoLookup(item.TIPO_TECNOLOGIA, 'NOMBRE'),
    iconoTecnologia: CampoLookup(item.TIPO_TECNOLOGIA, 'ICONO'),
    tipoCentral: TextoColumna(item.Type),
    modulos: ValoresMultiples(item.MODULOS),
    idMantSig: TextoColumna(item.ID_MANT_SIG),
    facilityId: TextoColumna(item[CampoFacilityIdMeteologica]),
    estado: TextoColumna(item.ESTADO)
  }),
  construirCuerpo: (v) => ({
    INSTALACION: v.nombre,
    CODIGO: v.codigo,
    CODIGO_SIOD: typeof v.codigoSiod === 'string' ? v.codigoSiod.toUpperCase() : '',
    TIPO_TECNOLOGIAId: EnteroONulo(v.tecnologiaId),
    Type: v.tipoCentral,
    'MODULOS@odata.type': 'Collection(Edm.String)',
    MODULOS: Array.isArray(v.modulos) ? v.modulos : [],
    ID_MANT_SIG: typeof v.idMantSig === 'string' && v.idMantSig ? v.idMantSig : null,
    [CampoFacilityIdMeteologica]: typeof v.facilityId === 'string' && v.facilityId ? v.facilityId : null,
    ESTADO: v.estado
  }),
  campos: [
    { clave: 'nombre', etiqueta: 'Nombre de la central', tipo: 'texto', obligatorio: true, maxLength: 255, unico: true },
    {
      clave: 'codigo',
      etiqueta: 'Código',
      tipo: 'texto',
      obligatorio: true,
      maxLength: 50,
      mayusculas: true,
      unico: true,
      patron: { expresion: /^[A-Z0-9_]+$/, mensaje: 'El código solo puede tener letras, números y guion bajo.' },
      ayuda: 'Mayúsculas, números y guion bajo.'
    },
    {
      clave: 'codigoSiod',
      etiqueta: 'Código SIOD',
      tipo: 'texto',
      maxLength: 50,
      mayusculas: true,
      ayuda: 'Vacío si la central no se integra con SIOD.'
    },
    {
      clave: 'tecnologiaId',
      etiqueta: 'Tipo de tecnología',
      tipo: 'seleccion',
      obligatorio: true,
      origenOpciones: 'tecnologias',
      textoOpcionVacia: '-- Seleccione --',
      claveEtiquetaActual: 'tecnologia'
    },
    {
      clave: 'tipoCentral',
      etiqueta: 'Tipo de central',
      tipo: 'seleccion',
      obligatorio: true,
      opciones: OpcionesTipoCentral,
      valorInicial: 'Interna'
    },
    { clave: 'idMantSig', etiqueta: 'ID central SIG', tipo: 'numero', enteroMinimo: 1, ayuda: 'Opcional. Enlaza con el maestro de centrales de SIG.' },
    {
      clave: 'modulos',
      etiqueta: 'Módulos',
      tipo: 'casillas',
      obligatorio: true,
      opciones: OpcionesModulosCentral,
      valorInicial: ['Concentrador']
    },
    {
      clave: 'facilityId',
      etiqueta: 'Central en Meteológica',
      tipo: 'seleccion',
      origenOpciones: 'centralesMeteologica',
      textoOpcionVacia: '-- Sin asociar --',
      opcionesUnicas: true,
      unico: true,
      etiquetaValorAusente: 'no está en Meteológica',
      ayuda: 'Opcional. Con ella el Operador renovable informa la capacidad a Meteológica. Cada central de Meteológica se asocia a una sola central.',
      ayudaSinOpciones: () => `No hay centrales de Meteológica para elegir. ${motivoSinCentralesMeteologica}`,
      anchoCompleto: true
    },
    CampoEstadoCatalogo
  ],
  columnas: [
    {
      field: 'nombre',
      headerName: 'Central',
      flex: 3,
      minWidth: 170,
      cellClassName: ClaseTextoLargo,
      renderCell: (p) => {
        const icono = ClaseBootstrapIconoTecnologia(ValorTexto(p.row, 'iconoTecnologia'));
        return (
          <span>
            {icono ? <i className={`bi ${icono} me-1 text-secondary`} aria-hidden="true" /> : null}
            {ValorTexto(p.row, 'nombre')}
          </span>
        );
      }
    },
    {
      field: 'codigo',
      headerName: 'Código / SIOD',
      width: 140,
      renderCell: (p) => (
        <span className="d-flex flex-column align-items-start lh-sm py-1">
          <BadgeCodigo codigo={ValorTexto(p.row, 'codigo')} />
          {ValorTexto(p.row, 'codigoSiod') ? (
            <small className="text-muted">SIOD: {ValorTexto(p.row, 'codigoSiod')}</small>
          ) : null}
        </span>
      )
    },
    { field: 'tecnologia', headerName: 'Tecnología', flex: 2, minWidth: 120, cellClassName: ClaseTextoLargo },
    { field: 'tipoCentral', headerName: 'Tipo', width: 100 },
    {
      field: 'modulos',
      headerName: 'Módulos',
      width: 170,
      sortable: false,
      renderCell: (p) => (
        <span className="d-flex flex-wrap gap-1">
          {(Array.isArray(p.row.modulos) ? p.row.modulos : []).map((modulo) => (
            <span key={modulo} className="badge text-bg-info">
              {modulo}
            </span>
          ))}
        </span>
      )
    },
    {
      field: 'facilityId',
      headerName: 'Meteo\u00ADlógica',
      width: 100,
      sortable: false,
      renderCell: (p) => {
        const facilityId = ValorTexto(p.row, 'facilityId');
        return facilityId ? (
          <span title={facilityId}>
            <i className="bi bi-cloud-check text-success" aria-hidden="true" />
            <span className="visually-hidden">Asociada a {facilityId}</span>
          </span>
        ) : (
          <span className="text-muted" title="Sin central de Meteológica asociada">
            —
          </span>
        );
      }
    },
    ColumnaEstadoCatalogo
  ],
  campoOrden: 'nombre',
  textoBusqueda: TextoBusqueda('nombre', 'codigo', 'codigoSiod', 'tecnologia', 'tipoCentral', 'modulos', 'facilityId', 'estado'),
  cargarOpciones: CargarOpcionesCentrales
};

// ---------------------------------------------------------------------------------------------
// Tipos de equipos — CONC_MANTENEDOR_TIPOSEQUIPOS (TIPOEQUIPO, CODIGO, NIVEL, ESTADO)
// ---------------------------------------------------------------------------------------------
const OpcionesNivelTipoEquipo: readonly OpcionCampoCatalogo[] = [
  { valor: 'Equipo', etiqueta: 'Equipo' },
  { valor: 'SubEquipo', etiqueta: 'Subequipo' }
];

export const DefinicionTiposEquipos: DefinicionCatalogo = {
  lista: NombreListaTiposEquipos,
  nombreRegistro: 'tipo de equipo',
  consulta: { select: 'Id,TIPOEQUIPO,CODIGO,NIVEL,ESTADO', orderby: 'TIPOEQUIPO asc' },
  leer: (item) => ({
    id: Number(item.Id),
    nombre: TextoColumna(item.TIPOEQUIPO),
    codigo: TextoColumna(item.CODIGO),
    nivel: TextoColumna(item.NIVEL),
    estado: TextoColumna(item.ESTADO)
  }),
  construirCuerpo: (v) => ({
    TIPOEQUIPO: v.nombre,
    CODIGO: v.codigo,
    NIVEL: typeof v.nivel === 'string' && v.nivel ? v.nivel : null,
    ESTADO: v.estado
  }),
  campos: [
    { clave: 'nombre', etiqueta: 'Tipo de equipo', tipo: 'texto', obligatorio: true, maxLength: 255, unico: true },
    { clave: 'codigo', etiqueta: 'Código', tipo: 'texto', maxLength: 50, mayusculas: true, unico: true },
    {
      clave: 'nivel',
      etiqueta: 'Nivel',
      tipo: 'seleccion',
      opciones: OpcionesNivelTipoEquipo,
      textoOpcionVacia: '-- Sin nivel --',
      ayuda: 'Equipo o subequipo (Operador Renovable).'
    },
    CampoEstadoCatalogo
  ],
  columnas: [
    { field: 'nombre', headerName: 'Tipo de equipo', flex: 1, minWidth: 200, cellClassName: ClaseTextoLargo },
    {
      field: 'codigo',
      headerName: 'Código',
      width: 150,
      renderCell: (p) => <BadgeCodigo codigo={ValorTexto(p.row, 'codigo')} />
    },
    { field: 'nivel', headerName: 'Nivel', width: 120 },
    ColumnaEstadoCatalogo
  ],
  campoOrden: 'nombre',
  textoBusqueda: TextoBusqueda('nombre', 'codigo', 'nivel', 'estado')
};

// ---------------------------------------------------------------------------------------------
// Afectaciones — CONC_MANTENEDOR_AFECTACIONES (AFECTACION, ESTADO)
// ---------------------------------------------------------------------------------------------
export const DefinicionAfectaciones: DefinicionCatalogo = {
  lista: NombreListaAfectaciones,
  nombreRegistro: 'afectación',
  consulta: { select: 'Id,AFECTACION,ESTADO', orderby: 'AFECTACION asc' },
  leer: (item) => ({
    id: Number(item.Id),
    nombre: TextoColumna(item.AFECTACION),
    estado: TextoColumna(item.ESTADO)
  }),
  construirCuerpo: (v) => ({ AFECTACION: v.nombre, ESTADO: v.estado }),
  campos: [
    { clave: 'nombre', etiqueta: 'Afectación', tipo: 'texto', obligatorio: true, maxLength: 255, unico: true },
    CampoEstadoCatalogo
  ],
  columnas: [
    { field: 'nombre', headerName: 'Afectación', flex: 1, minWidth: 200, cellClassName: ClaseTextoLargo },
    ColumnaEstadoCatalogo
  ],
  campoOrden: 'nombre',
  textoBusqueda: TextoBusqueda('nombre', 'estado')
};

// ---------------------------------------------------------------------------------------------
// Tipos de trabajo — CONC_MANTENEDOR_TIPOSTRABAJOS (CODIGO, DESCRIPCION, ESTADO)
// ---------------------------------------------------------------------------------------------
export const DefinicionTiposTrabajo: DefinicionCatalogo = {
  lista: NombreListaTiposTrabajos,
  nombreRegistro: 'tipo de trabajo',
  consulta: { select: 'Id,CODIGO,DESCRIPCION,ESTADO', orderby: 'DESCRIPCION asc' },
  leer: (item) => ({
    id: Number(item.Id),
    codigo: TextoColumna(item.CODIGO),
    descripcion: TextoColumna(item.DESCRIPCION),
    estado: TextoColumna(item.ESTADO)
  }),
  construirCuerpo: (v) => ({ CODIGO: v.codigo, DESCRIPCION: v.descripcion, ESTADO: v.estado }),
  campos: [
    { clave: 'codigo', etiqueta: 'Código', tipo: 'texto', obligatorio: true, maxLength: 10, mayusculas: true, unico: true },
    { clave: 'descripcion', etiqueta: 'Descripción', tipo: 'texto', obligatorio: true, maxLength: 255 },
    CampoEstadoCatalogo
  ],
  columnas: [
    {
      field: 'codigo',
      headerName: 'Código',
      width: 120,
      renderCell: (p) => <BadgeCodigo codigo={ValorTexto(p.row, 'codigo')} />
    },
    { field: 'descripcion', headerName: 'Descripción', flex: 1, minWidth: 200, cellClassName: ClaseTextoLargo },
    ColumnaEstadoCatalogo
  ],
  campoOrden: 'descripcion',
  textoBusqueda: TextoBusqueda('codigo', 'descripcion', 'estado')
};
