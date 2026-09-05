/**
 * Estado de sesión compartido por toda la aplicación.
 *
 * POR QUÉ UN CONTEXTO Y NO PASAR LA SESIÓN POR PROPIEDADES
 *   Con dos páginas ya no hay un único componente que contenga a los demás: la página de
 *   login y la de convocatorias son hermanas dentro del enrutador. Pasar la sesión de una
 *   a otra por props obligaría a subirla hasta la raíz y bajarla por cada nivel
 *   ("prop drilling"). El contexto la deja disponible donde se necesite.
 *
 * LA SESIÓN SIGUE VIVIENDO SOLO EN MEMORIA
 *   No se guarda en `localStorage`, a propósito: un token ahí es legible por cualquier
 *   script de la página, y un XSS bastaría para robarlo. El precio es que al recargar
 *   (F5) hay que volver a iniciar sesión.
 *
 *   SPRINT 2 (US-002/US-003): la forma correcta es una cookie `httpOnly` emitida por el
 *   backend, que el JavaScript no puede leer. Se implementa junto con el guard que valida
 *   el token en cada petición.
 */
import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';

import { establecerToken, type Sesion } from '../api/cliente';

interface ValorContexto {
  sesion: Sesion | null;
  iniciar: (sesion: Sesion) => void;
  cerrar: () => void;
}

const ContextoSesion = createContext<ValorContexto | null>(null);

export function ProveedorSesion({ children }: { children: ReactNode }): ReactElement {
  const [sesion, setSesion] = useState<Sesion | null>(null);

  // `useMemo` evita crear un objeto nuevo en cada render, que forzaría a re-renderizar
  // a todos los componentes suscritos al contexto aunque la sesión no hubiera cambiado.
  const valor = useMemo<ValorContexto>(
    () => ({
      sesion,
      // El token se entrega al cliente HTTP en el mismo acto de iniciar o cerrar sesión.
      // Si fueran dos pasos separados, bastaría olvidar uno para que el estado de React y
      // el del cliente HTTP discreparan: la pantalla mostraría al usuario dentro mientras
      // todas sus peticiones reciben 401.
      iniciar: (nueva: Sesion) => {
        establecerToken(nueva.token);
        setSesion(nueva);
      },
      cerrar: () => {
        establecerToken(null);
        setSesion(null);
      },
    }),
    [sesion],
  );

  return <ContextoSesion.Provider value={valor}>{children}</ContextoSesion.Provider>;
}

/**
 * Acceso al estado de sesión.
 *
 * Lanza si se usa fuera del proveedor: es un error de programación, y fallar de inmediato
 * con un mensaje claro es mejor que devolver `null` y provocar un fallo confuso más tarde.
 */
export function useSesion(): ValorContexto {
  const contexto = useContext(ContextoSesion);

  if (contexto === null) {
    throw new Error('useSesion debe usarse dentro de <ProveedorSesion>');
  }

  return contexto;
}
