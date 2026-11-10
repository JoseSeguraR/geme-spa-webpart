import * as React from 'react';
import { useEffect, useState } from 'react';
import type { WebPartContext } from '@microsoft/sp-webpart-base';
import {
  ActualizarItemLista,
  CrearItemLista,
  type CuerpoItemLista
} from '../../../../../services/sharepoint/listaGenerica/ListaSharePointServicio';
import { SharePointRestError } from '../../../../../services/sharepoint/SharePointRestError';
import ModalFormulario from '../../../../comunes/ModalFormulario';
import type {
  CampoCatalogo,
  DefinicionCatalogo,
  FilaCatalogo,
  OpcionCampoCatalogo,
  OpcionesDinamicasCatalogo,
  ValoresRegistroCatalogo
} from './TiposCatalogo';
import { ValorTexto } from './UtilidadesCatalogo';

export type ModalRegistroCatalogoProps = {
  context: WebPartContext;
  definicion: DefinicionCatalogo;
  /** Registro a editar; sin él, el modal agrega uno nuevo. */
  fila?: FilaCatalogo;
  /** Registros cargados, para validar los campos únicos. */
  filas: readonly FilaCatalogo[];
  opciones: OpcionesDinamicasCatalogo;
  visible: boolean;
  /** Columnas que se agregan siempre al guardar (p. ej. la central de un equipo). */
  cuerpoFijo?: CuerpoItemLista;
  icono?: string;
  onCerrar: () => void;
  onGuardado: () => void;
};

function ValoresIniciales(campos: readonly CampoCatalogo[], fila: FilaCatalogo | undefined): ValoresRegistroCatalogo {
  const valores: ValoresRegistroCatalogo = {};
  for (const campo of campos) {
    if (fila) {
      const actual = fila[campo.clave];
      valores[campo.clave] = Array.isArray(actual) ? actual.slice() : ValorTexto(fila, campo.clave);
    } else if (campo.valorInicial !== undefined) {
      valores[campo.clave] = Array.isArray(campo.valorInicial) ? campo.valorInicial.slice() : campo.valorInicial;
    } else {
      valores[campo.clave] = campo.tipo === 'casillas' ? [] : '';
    }
  }
  return valores;
}

function NormalizarComparacion(texto: string): string {
  return texto.trim().toLowerCase();
}

function AvisoSinOpciones(campo: CampoCatalogo, opciones: OpcionesDinamicasCatalogo): string | undefined {
  const origen = (campo.origenOpciones ? opciones[campo.origenOpciones] : campo.opciones) ?? [];
  if (origen.length > 0) {
    return campo.opcionesUnicas ? 'Todas las opciones ya están asociadas a otro registro.' : undefined;
  }
  return typeof campo.ayudaSinOpciones === 'function' ? campo.ayudaSinOpciones() : campo.ayudaSinOpciones;
}

function OpcionesDeCampo(
  campo: CampoCatalogo,
  opciones: OpcionesDinamicasCatalogo,
  fila: FilaCatalogo | undefined,
  valorActual: string | string[],
  filas: readonly FilaCatalogo[]
): OpcionCampoCatalogo[] {
  const lista = (campo.origenOpciones ? opciones[campo.origenOpciones] : campo.opciones) ?? [];
  const usadas = campo.opcionesUnicas
    ? filas.filter((otra) => otra.id !== fila?.id).map((otra) => ValorTexto(otra, campo.clave))
    : [];
  const resultado = lista.filter((opcion) => usadas.indexOf(opcion.valor) < 0);
  const actual = typeof valorActual === 'string' ? valorActual : '';
  if (actual && !resultado.some((o) => o.valor === actual)) {
    const etiqueta = fila && campo.claveEtiquetaActual ? ValorTexto(fila, campo.claveEtiquetaActual) : actual;
    resultado.push({ valor: actual, etiqueta: `${etiqueta || actual} (${campo.etiquetaValorAusente ?? 'inactivo'})` });
  }
  return resultado;
}

/** Devuelve el primer error y la lista de campos con error. */
function Validar(
  definicion: DefinicionCatalogo,
  valores: ValoresRegistroCatalogo,
  filas: readonly FilaCatalogo[],
  idEdicion: number | undefined
): { mensaje?: string; campos: string[] } {
  const campos: string[] = [];
  let mensaje: string | undefined;
  const Registrar = (clave: string, texto: string): void => {
    campos.push(clave);
    if (!mensaje) {
      mensaje = texto;
    }
  };

  for (const campo of definicion.campos) {
    const valor = valores[campo.clave];
    if (campo.tipo === 'casillas') {
      if (campo.obligatorio && (!Array.isArray(valor) || valor.length === 0)) {
        Registrar(campo.clave, `Seleccione al menos una opción en «${campo.etiqueta}».`);
      }
      continue;
    }
    const texto = typeof valor === 'string' ? valor.trim() : '';
    if (!texto) {
      if (campo.obligatorio) {
        Registrar(campo.clave, `Complete el campo «${campo.etiqueta}».`);
      }
      continue;
    }
    if (campo.maxLength && texto.length > campo.maxLength) {
      Registrar(campo.clave, `«${campo.etiqueta}» admite hasta ${campo.maxLength} caracteres.`);
    } else if (campo.patron && !campo.patron.expresion.test(texto)) {
      Registrar(campo.clave, campo.patron.mensaje);
    } else if (campo.enteroMinimo !== undefined) {
      const numero = Number(texto);
      if (!/^\d+$/.test(texto) || numero < campo.enteroMinimo) {
        Registrar(campo.clave, `«${campo.etiqueta}» debe ser un número entero mayor o igual a ${campo.enteroMinimo}.`);
      }
    }
    if (campo.unico) {
      const repetido = filas.some(
        (fila) =>
          fila.id !== idEdicion &&
          NormalizarComparacion(ValorTexto(fila, campo.clave)) === NormalizarComparacion(texto)
      );
      if (repetido) {
        Registrar(campo.clave, `Ya existe un registro con ${campo.etiqueta.toLowerCase()} «${texto}».`);
      }
    }
  }

  if (!mensaje && definicion.validar) {
    mensaje = definicion.validar(valores);
  }
  return { mensaje, campos };
}

export default function ModalRegistroCatalogo(props: ModalRegistroCatalogoProps): React.ReactElement {
  const { context, definicion, fila, filas, opciones, visible, cuerpoFijo, icono, onCerrar, onGuardado } = props;
  const [valores, setValores] = useState<ValoresRegistroCatalogo>({});
  const [camposConError, setCamposConError] = useState<string[]>([]);
  const [error, setError] = useState<string | undefined>();
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!visible) {
      return;
    }
    setValores(ValoresIniciales(definicion.campos, fila));
    setCamposConError([]);
    setError(undefined);
    setGuardando(false);
  }, [visible, definicion, fila]);

  const Cambiar = (campo: CampoCatalogo, valor: string | string[]): void => {
    const final = typeof valor === 'string' && campo.mayusculas ? valor.toUpperCase() : valor;
    setValores((previo) => ({ ...previo, [campo.clave]: final }));
  };

  const Guardar = async (): Promise<void> => {
    const resultado = Validar(definicion, valores, filas, fila?.id);
    setCamposConError(resultado.campos);
    if (resultado.mensaje) {
      setError(resultado.mensaje);
      return;
    }
    const limpios: ValoresRegistroCatalogo = {};
    for (const clave of Object.keys(valores)) {
      const valor = valores[clave];
      limpios[clave] = typeof valor === 'string' ? valor.trim() : valor;
    }
    const cuerpo = { ...definicion.construirCuerpo(limpios), ...(cuerpoFijo ?? {}) };

    setGuardando(true);
    setError(undefined);
    try {
      if (fila) {
        await ActualizarItemLista(context, definicion.lista, fila.id, cuerpo);
      } else {
        await CrearItemLista(context, definicion.lista, cuerpo);
      }
      onGuardado();
      onCerrar();
    } catch (err) {
      console.error(err);
      setError(err instanceof SharePointRestError ? err.message : 'No se pudo guardar el registro.');
    } finally {
      setGuardando(false);
    }
  };

  const idBase = `cowork-catalogo-${definicion.lista.toLowerCase()}`;

  return (
    <ModalFormulario
      visible={visible}
      titulo={`${fila ? 'Editar' : 'Agregar'} ${definicion.nombreRegistro}`}
      icono={icono}
      error={error}
      guardando={guardando}
      onGuardar={() => {
        Guardar().catch(() => undefined);
      }}
      onCerrar={onCerrar}
      tamano={definicion.campos.length > 4 ? 'lg' : undefined}
    >
      <div className="row g-3">
        {definicion.campos.map((campo) => {
          const id = `${idBase}-${campo.clave}`;
          const valor = valores[campo.clave] ?? (campo.tipo === 'casillas' ? [] : '');
          const invalido = camposConError.indexOf(campo.clave) >= 0;
          const claseEtiqueta = `form-label${campo.obligatorio ? ' cowork-formulario__etiqueta--obligatoria' : ''}`;
          const columna = campo.anchoCompleto || definicion.campos.length <= 4 ? 'col-12' : 'col-md-6';
          const idAyuda = campo.ayuda ? `${id}-ayuda` : undefined;
          const opcionesCampo = campo.tipo === 'seleccion' ? OpcionesDeCampo(campo, opciones, fila, valor, filas) : [];

          if (campo.tipo === 'casillas') {
            const seleccionados = Array.isArray(valor) ? valor : [];
            return (
              <fieldset key={campo.clave} className={columna}>
                <legend className={`${claseEtiqueta} fs-6`}>{campo.etiqueta}</legend>
                <div className={`d-flex flex-wrap gap-3${invalido ? ' is-invalid' : ''}`}>
                  {OpcionesDeCampo(campo, opciones, fila, '', filas).map((opcion) => (
                    <div key={opcion.valor} className="form-check">
                      <input
                        id={`${id}-${opcion.valor}`}
                        type="checkbox"
                        className={`form-check-input${invalido ? ' is-invalid' : ''}`}
                        checked={seleccionados.indexOf(opcion.valor) >= 0}
                        onChange={(evento) =>
                          Cambiar(
                            campo,
                            evento.target.checked
                              ? seleccionados.concat(opcion.valor)
                              : seleccionados.filter((v) => v !== opcion.valor)
                          )
                        }
                      />
                      <label className="form-check-label" htmlFor={`${id}-${opcion.valor}`}>
                        {opcion.etiqueta}
                      </label>
                    </div>
                  ))}
                </div>
                {campo.ayuda ? <div className="form-text">{campo.ayuda}</div> : null}
              </fieldset>
            );
          }

          return (
            <div key={campo.clave} className={columna}>
              <label className={claseEtiqueta} htmlFor={id}>
                {campo.etiqueta}
              </label>
              {campo.tipo === 'seleccion' ? (
                <select
                  id={id}
                  className={`form-select form-select-sm${invalido ? ' is-invalid' : ''}`}
                  value={typeof valor === 'string' ? valor : ''}
                  aria-describedby={idAyuda}
                  onChange={(evento) => Cambiar(campo, evento.target.value)}
                >
                  {campo.textoOpcionVacia !== undefined ? <option value="">{campo.textoOpcionVacia}</option> : null}
                  {opcionesCampo.map((opcion) => (
                    <option key={opcion.valor} value={opcion.valor}>
                      {opcion.etiqueta}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id={id}
                  type="text"
                  inputMode={campo.tipo === 'numero' ? 'numeric' : undefined}
                  className={`form-control form-control-sm${invalido ? ' is-invalid' : ''}`}
                  value={typeof valor === 'string' ? valor : ''}
                  maxLength={campo.maxLength}
                  placeholder={campo.placeholder}
                  aria-describedby={idAyuda}
                  onChange={(evento) => Cambiar(campo, evento.target.value)}
                />
              )}
              {campo.ayuda ? (
                <div id={idAyuda} className="form-text">
                  {campo.ayuda}
                </div>
              ) : null}
              {campo.tipo === 'seleccion' && opcionesCampo.length === 0 && AvisoSinOpciones(campo, opciones) ? (
                <div className="form-text text-warning-emphasis">{AvisoSinOpciones(campo, opciones)}</div>
              ) : null}
            </div>
          );
        })}
      </div>
      <p className="cowork-formulario__nota-obligatorios mt-3 mb-0">Los campos con * son obligatorios.</p>
    </ModalFormulario>
  );
}
