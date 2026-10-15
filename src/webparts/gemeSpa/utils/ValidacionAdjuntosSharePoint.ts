import { TamanoMaximoAdjuntoBytes } from '../components/vistas/cor-conecta/concentrador/administrador/constantesSolicitudesIl';
import { SanearNombreArchivoAdjunto } from './SanearNombreArchivoAdjunto';

/** Extensiones habitualmente bloqueadas en SharePoint Online (adjuntos de lista). */
export const ExtensionesAdjuntoSharePointBloqueadas = new Set(
  [
    'ada',
    'adp',
    'app',
    'asax',
    'ascx',
    'ashx',
    'asmx',
    'asp',
    'aspx',
    'bas',
    'bat',
    'cdx',
    'cer',
    'chm',
    'class',
    'cmd',
    'com',
    'config',
    'cpl',
    'crt',
    'csh',
    'dll',
    'exe',
    'fxp',
    'hlp',
    'hta',
    'htr',
    'htw',
    'ida',
    'idc',
    'idq',
    'ins',
    'isp',
    'its',
    'jar',
    'js',
    'jse',
    'ksh',
    'lnk',
    'mad',
    'maf',
    'mag',
    'mam',
    'maq',
    'mar',
    'mas',
    'mat',
    'mau',
    'mav',
    'maw',
    'mda',
    'mdb',
    'mde',
    'mdt',
    'mdw',
    'mdz',
    'msc',
    'msh',
    'msh1',
    'msh1xml',
    'msh2',
    'msh2xml',
    'mshxml',
    'msi',
    'msp',
    'mst',
    'ops',
    'pcd',
    'pif',
    'prf',
    'prg',
    'pst',
    'reg',
    'scf',
    'scr',
    'sct',
    'shb',
    'shs',
    'shtm',
    'shtml',
    'soap',
    'stm',
    'svc',
    'url',
    'vb',
    'vbe',
    'vbs',
    'vsmacros',
    'vss',
    'vst',
    'vsw',
    'ws',
    'wsc',
    'wsf',
    'wsh',
    'xnk',
    'ps1',
    'ps1xml',
    'ps2',
    'ps2xml',
    'psc1',
    'psc2'
  ].map((ext) => ext.toLowerCase())
);

function ObtenerExtension(nombreArchivo: string): string {
  const ultimoPunto = nombreArchivo.lastIndexOf('.');
  if (ultimoPunto <= 0 || ultimoPunto === nombreArchivo.length - 1) {
    return '';
  }
  return nombreArchivo.substring(ultimoPunto + 1).toLowerCase();
}

export function ValidarArchivoAdjuntoSharePoint(archivo: File): string | undefined {
  if (archivo.size > TamanoMaximoAdjuntoBytes) {
    return `El archivo "${archivo.name}" supera 10 MB.`;
  }

  const nombreParaValidar = SanearNombreArchivoAdjunto(archivo.name);
  if (!nombreParaValidar) {
    return `El nombre del archivo "${archivo.name}" no es válido.`;
  }

  const extension = ObtenerExtension(nombreParaValidar);
  if (!extension) {
    return `El archivo "${archivo.name}" debe incluir una extensión.`;
  }

  if (ExtensionesAdjuntoSharePointBloqueadas.has(extension)) {
    return `La extensión ".${extension}" no está permitida en SharePoint para "${archivo.name}".`;
  }

  return undefined;
}
