/**
 * PÁGINA `/login` — inicio de sesión (US-002).
 *
 * DISEÑO: dos columnas. A la izquierda el contexto institucional; a la derecha
 * el formulario. Se descartó la tarjeta flotante centrada porque no dice nada:
 * un ciudadano que llega a un portal del Estado necesita confirmar **dónde
 * está y para qué sirve** antes de entregar sus credenciales. Los portales de
 * becas guatemaltecos hacen exactamente esto.
 *
 * En móvil las columnas se apilan y la lista de garantías se oculta: ahí lo
 * único que importa es entrar.
 *
 * ALCANCE: el inicio de sesión y el enlace a crear cuenta (US-001). El de
 * "olvidé mi contraseña" (US-005) aparecerá cuando esa historia exista: no se
 * ponen enlaces que no llevan a ningún lado.
 */
import { useEffect, type ReactElement } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { FormularioLogin } from '../componentes/FormularioLogin';
import { Emblema, IconoDocumento, IconoEscudo, IconoLupa } from '../componentes/Iconos';
import { useSesion } from '../sesion/ContextoSesion';

interface EstadoNavegacion {
  destino?: string;
}

export function PaginaLogin(): ReactElement {
  const { sesion, iniciar } = useSesion();
  const navegar = useNavigate();
  const ubicacion = useLocation();

  const destinoPedido = (ubicacion.state as EstadoNavegacion | null)?.destino;

  // Si venía de una ruta concreta, se le devuelve ahí. Si no, cada rol va a su panel: entrar al
  // sistema para aterrizar en una página que ya podía ver sin cuenta no le sirve a nadie.
  function destinoPara(rol: string): string {
    if (destinoPedido !== undefined) return destinoPedido;
    if (rol === 'ADMINISTRADOR') return '/gestion';
    if (rol === 'ESTUDIANTE') return '/solicitudes';
    if (rol === 'EVALUADOR') return '/evaluaciones';
    return '/convocatorias';
  }

  // Si ya hay sesión no tiene sentido mostrar el formulario. Va en un efecto y
  // no en el cuerpo del componente porque navegar es un efecto secundario, y
  // hacerlo durante el render es un error en React.
  useEffect(() => {
    if (sesion !== null) {
      navegar(destinoPara(sesion.usuario.rol), { replace: true });
    }
  }, [sesion, destinoPedido, navegar]);

  return (
    <div className="acceso">
      <section className="presentacion">
        <div className="marca" style={{ gap: '0.75rem' }}>
          <Emblema size={44} />
          <div>
            <div className="institucion" style={{ color: 'var(--gob-300)' }}>
              Ministerio de Educación
            </div>
            <div className="titulo" style={{ color: '#fff' }}>
              Fondo Nacional de Becas
            </div>
          </div>
        </div>

        <h1>Una sola plataforma para todo el ciclo de una beca</h1>

        <p className="entrada">
          Consulte convocatorias vigentes, presente su solicitud con la documentación de respaldo y
          dé seguimiento a su expediente en línea, sin trasladarse a la capital.
        </p>

        <ul className="puntos">
          <li>
            <span className="icono">
              <IconoLupa />
            </span>
            <span>
              <b>Convocatorias abiertas</b>
              Requisitos, cupos y plazos de cada programa, antes de iniciar el trámite.
            </span>
          </li>
          <li>
            <span className="icono">
              <IconoDocumento />
            </span>
            <span>
              <b>Expediente trazable</b>
              Cada cambio de estado queda registrado con su fecha y su responsable.
            </span>
          </li>
          <li>
            <span className="icono">
              <IconoEscudo />
            </span>
            <span>
              <b>Datos protegidos</b>
              Las contraseñas se almacenan cifradas y la sesión caduca automáticamente.
            </span>
          </li>
        </ul>
      </section>

      <section className="formulario-zona">
        <FormularioLogin
          onSesionIniciada={(nueva) => {
            iniciar(nueva);
            navegar(destinoPara(nueva.usuario.rol), { replace: true });
          }}
        />
      </section>
    </div>
  );
}
