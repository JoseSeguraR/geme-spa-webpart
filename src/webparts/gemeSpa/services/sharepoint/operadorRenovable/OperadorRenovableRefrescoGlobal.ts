/** Refresco cruzado entre pestañas (rutas hash distintas; suscripción en memoria de la SPA). */

let tokenRefresco = 0;
const suscriptores = new Set<(token: number) => void>();

export function ObtenerTokenRefrescoOperadorRenovable(): number {
  return tokenRefresco;
}

export function NotificarCambioDisponibilidadOperadorRenovable(): void {
  tokenRefresco += 1;
  suscriptores.forEach((fn) => fn(tokenRefresco));
}

export function SuscribirRefrescoOperadorRenovable(listener: (token: number) => void): () => void {
  suscriptores.add(listener);
  listener(tokenRefresco);
  return () => {
    suscriptores.delete(listener);
  };
}
