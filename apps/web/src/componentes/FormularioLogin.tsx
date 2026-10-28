/**
 * Formulario de inicio de sesión (US-002).
 *
 * Es un `<form>` de verdad y no un `<div>` con un botón: así funciona Enter para enviar, los
 * gestores de contraseñas reconocen los campos y los lectores de pantalla anuncian el error.
 * Autentica y entrega la sesión al componente padre.
 */
import { useState, type FormEvent, type ReactElement } from 'react';

import { Link } from 'react-router-dom';

import { iniciarSesion, type Sesion } from '../api/cliente';

interface Props {
  onSesionIniciada: (sesion: Sesion) => void;
}

export function FormularioLogin({ onSesionIniciada }: Props): ReactElement {
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function manejarEnvio(evento: FormEvent<HTMLFormElement>): Promise<void> {
    evento.preventDefault();
    setError(null);
    setEnviando(true);

    try {
      onSesionIniciada(await iniciarSesion(nombreUsuario, password));
    } catch (causa: unknown) {
      // El mensaje viene del backend y es deliberadamente genérico: no distingue
      // entre usuario inexistente y contraseña incorrecta (US-002).
      setError(causa instanceof Error ? causa.message : 'No se pudo iniciar sesión');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className="formulario" onSubmit={(e) => void manejarEnvio(e)} noValidate>
      <div className="encabezado-form">
        <h2>Ingrese a su cuenta</h2>
        <p className="sub">Use las credenciales con las que se registró en el programa.</p>
      </div>

      <div className="campo">
        <label htmlFor="nombreUsuario">Usuario</label>
        <input
          id="nombreUsuario"
          name="username"
          type="text"
          autoComplete="username"
          placeholder="Su nombre de usuario"
          value={nombreUsuario}
          onChange={(e) => setNombreUsuario(e.target.value)}
          required
          autoFocus
        />
      </div>

      <div className="campo">
        <label htmlFor="password">Contraseña</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      {/* `role="alert"` hace que el lector de pantalla anuncie el error al aparecer. */}
      {error !== null && (
        <p className="aviso error" role="alert">
          {error}
        </p>
      )}

      <button type="submit" className="boton ancho" disabled={enviando}>
        {enviando ? 'Verificando…' : 'Iniciar sesión'}
      </button>

      <p className="enlace-alterno">
        <Link to="/recuperar">¿Olvidó su contraseña?</Link>
      </p>

      <p className="enlace-alterno">
        ¿Todavía no tiene cuenta? <Link to="/registro">Regístrese aquí</Link>
      </p>

      {/* Ayuda para el equipo mientras se trabaja en local.
          ────────────────────────────────────────────────────────────────────
          ESTO ESTUVO PUBLICADO EN STAGING. La versión anterior de este bloque no comprobaba
          nada: decía «Entorno de desarrollo» y se compilaba igual en el despliegue, así que
          cualquiera que abriera la página de acceso de Staging leía el usuario y la contraseña
          del administrador. El comentario de entonces decía que se quitaría antes de
          desplegar; eso es exactamente lo que nadie se acuerda de hacer.

          `import.meta.env.DEV` lo resuelve de verdad: Vite lo sustituye por `false` al
          compilar y el bloque entero desaparece del paquete. No depende de que alguien se
          acuerde. */}
      {import.meta.env.DEV && (
        <p className="credenciales-demo">
          <b>Entorno de desarrollo.</b> Las credenciales de prueba están en el <code>.env</code> del
          proyecto y se cargan con <code>npm run db:seed</code>.
        </p>
      )}
    </form>
  );
}
