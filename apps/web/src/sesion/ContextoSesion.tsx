/**
 * Estado de sesión compartido por toda la aplicación. Es un contexto porque las páginas son
 * hermanas dentro del enrutador y pasar la sesión por props obligaría a subirla hasta la raíz y
 * bajarla por cada nivel.
 *
 * El token se guarda en `sessionStorage`. Antes vivía solo en memoria y cada F5 echaba a quien
 * trabajaba, lo que en una pantalla de gestión obliga a volver a entrar en mitad de un trámite.
 * Es una concesión: frente a un XSS, `sessionStorage` no protege más que `localStorage`, aunque el
 * token muere al cerrar la pestaña y no queda en disco.
 *
 * Lo correcto sigue siendo una cookie `httpOnly`. No se hizo porque el frontend y la API están en
 * dominios distintos (`becas-web-staging` y `becas-api-staging`), así que la cookie tendría que ser
 * `SameSite=None` y exigiría protección CSRF aparte, trabajo de backend, CORS y guards que no se
 * asumió a días de la entrega. Queda anotado como deuda.
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

const CLAVE = 'becas.sesion';

/**
 * Lee la sesión guardada, si la hay y si todavía sirve.
 *
 * Todo va dentro de un `try`: en una ventana privada, o con el almacenamiento bloqueado por
 * el navegador, el simple acceso lanza. Una sesión que no se puede leer no es un error que
 * deba romper la aplicación; simplemente no hay sesión.
 */
function sesionGuardada(): Sesion | null {
  try {
    const crudo = window.sessionStorage.getItem(CLAVE);
    if (crudo === null) return null;

    const sesion = JSON.parse(crudo) as Sesion;

    // El backend rechazaría un token vencido con un 401, pero entonces la pantalla mostraría
    // al usuario dentro y todas sus peticiones fallarían. Se comprueba antes de creerle.
    if (new Date(sesion.expiraEn).getTime() <= Date.now()) {
      window.sessionStorage.removeItem(CLAVE);
      return null;
    }

    return sesion;
  } catch {
    return null;
  }
}

function guardar(sesion: Sesion | null): void {
  try {
    if (sesion === null) window.sessionStorage.removeItem(CLAVE);
    else window.sessionStorage.setItem(CLAVE, JSON.stringify(sesion));
  } catch {
    // Sin almacenamiento la aplicación sigue funcionando: se vuelve al comportamiento
    // anterior, que era perder la sesión al recargar. No vale la pena molestar al usuario.
  }
}

export function ProveedorSesion({ children }: { children: ReactNode }): ReactElement {
  // El valor inicial se calcula una sola vez, antes del primer render, para que nadie llegue
  // a ver la pantalla de invitado un instante antes de que se restaure la sesión.
  const [sesion, setSesion] = useState<Sesion | null>(() => {
    const guardada = sesionGuardada();
    if (guardada !== null) establecerToken(guardada.token);
    return guardada;
  });

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
        guardar(nueva);
        setSesion(nueva);
      },
      cerrar: () => {
        establecerToken(null);
        guardar(null);
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
