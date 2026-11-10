/** Columna de la matriz: una fila de SISTEMA_FUNCIONES, asociada a un grupo de SharePoint. */
export type FuncionPermiso = {
  id: number;
  modulo: string;
  funcion: string;
  descripcion: string;
  grupoId: number;
  requiereValidacion: boolean;
};

/** Fila de la matriz: usuario del grupo «GEME - CONC - Todos los usuarios». */
export type UsuarioPermisos = {
  id: number;
  nombre: string;
  login: string;
  correo: string;
  /** Id de los grupos de SharePoint del usuario. */
  grupos: number[];
};

/** Registro de CONC_MANTENEDOR_USUARIOSINSTALACIONES de un usuario. */
export type InstalacionesUsuario = {
  registroId: number | undefined;
  instalacionIds: number[];
};

/** Resultado del buscador de personas para «Agregar usuario». */
export type PersonaEncontrada = {
  login: string;
  nombre: string;
  correo: string;
};
