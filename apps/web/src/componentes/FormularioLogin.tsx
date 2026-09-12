/**
 * Formulario de inicio de sesión (US-002).
 *
 * ALCANCE (Sprint 1): solo autentica y entrega la sesión al componente padre. El registro
 * (US-001), la recuperación de contraseña (US-005) y las rutas protegidas por rol (US-003)
 * son del Sprint 2.
 *
 * ACCESIBILIDAD: es un `<form>` de verdad, no un `<div>` con un botón. Así funciona el
 * Enter para enviar, los gestores de contraseñas reconocen los campos, y los lectores de
 * pantalla anuncian el error. Es parte del NFR de usabilidad.
 */
import { useState, type FormEvent, type ReactElement } from 'react';

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
      // El mensaje viene del backend y es deliberadamente genérico: no distingue entre
      // usuario inexistente y contraseña incorrecta (US-002).
      setError(causa instanceof Error ? causa.message : 'No se pudo iniciar sesión');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className="formulario" onSubmit={(e) => void manejarEnvio(e)} noValidate>
      <div className="campo">
        <label htmlFor="nombreUsuario">Usuario</label>
        <input
          id="nombreUsuario"
          name="username"
          type="text"
          autoComplete="username"
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
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      {/* `role="alert"` hace que el lector de pantalla anuncie el error al aparecer. */}
      {error !== null && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <button type="submit" disabled={enviando}>
        {enviando ? 'Verificando…' : 'Iniciar sesión'}
      </button>
    </form>
  );
}
