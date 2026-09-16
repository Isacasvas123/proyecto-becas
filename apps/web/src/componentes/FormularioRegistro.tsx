/**
 * Formulario de registro de estudiante (US-001).
 *
 * LA LISTA DE CONDICIONES DE LA CONTRASEÑA
 *   Se marca en vivo mientras la persona escribe, para que no descubra las reglas a base de
 *   errores. Es solo ORIENTACIÓN: quien decide es el servidor, y su mensaje se muestra tal cual si
 *   rechaza algo. Si la política cambia en el backend y aquí no, lo peor que pasa es que esta lista
 *   quede desactualizada; la cuenta nunca se crearía con una contraseña que el servidor no acepta.
 *
 * EL CUI
 *   Se acepta con espacios, como viene impreso en el DPI. El servidor lo normaliza.
 */
import { useState, type FormEvent, type ReactElement } from 'react';
import { Link } from 'react-router-dom';

import { registrarEstudiante, type Sesion } from '../api/cliente';

interface Props {
  onRegistrado: (sesion: Sesion) => void;
}

const CONDICIONES = [
  { texto: 'Al menos 8 caracteres', cumple: (c: string) => c.length >= 8 },
  { texto: 'Una letra mayúscula', cumple: (c: string) => /[A-ZÁÉÍÓÚÑ]/.test(c) },
  { texto: 'Un número', cumple: (c: string) => /\d/.test(c) },
];

export function FormularioRegistro({ onRegistrado }: Props): ReactElement {
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [cui, setCui] = useState('');
  const [correo, setCorreo] = useState('');
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const noCoinciden = confirmacion !== '' && confirmacion !== password;

  async function enviar(evento: FormEvent<HTMLFormElement>): Promise<void> {
    evento.preventDefault();
    setError(null);

    // La confirmación es lo único que se valida solo aquí: al servidor no le importa, es una
    // ayuda para que la persona no se quede fuera por un error de tipeo.
    if (password !== confirmacion) {
      setError('Las dos contraseñas no coinciden.');
      return;
    }

    setEnviando(true);
    try {
      onRegistrado(
        await registrarEstudiante({ nombreCompleto, cui, correo, nombreUsuario, password }),
      );
    } catch (causa: unknown) {
      setError(causa instanceof Error ? causa.message : 'No se pudo crear la cuenta.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className="formulario" onSubmit={(e) => void enviar(e)}>
      <div className="encabezado-form">
        <h2>Cree su cuenta</h2>
        <p className="sub">Para postular a las becas del Ministerio. Tarda menos de un minuto.</p>
      </div>

      <div className="campo">
        <label htmlFor="nombreCompleto">Nombre completo</label>
        <input
          id="nombreCompleto"
          autoComplete="name"
          required
          maxLength={120}
          value={nombreCompleto}
          onChange={(e) => setNombreCompleto(e.target.value)}
          autoFocus
        />
      </div>

      <div className="campo">
        <label htmlFor="cui">CUI</label>
        <input
          id="cui"
          inputMode="numeric"
          required
          maxLength={20}
          placeholder="0000 00000 0000"
          value={cui}
          onChange={(e) => setCui(e.target.value)}
        />
        <span className="pista">
          Los 13 dígitos de su DPI o de su certificado de nacimiento del RENAP.
        </span>
      </div>

      <div className="campo">
        <label htmlFor="correo">Correo electrónico</label>
        <input
          id="correo"
          type="email"
          autoComplete="email"
          required
          maxLength={120}
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
        />
      </div>

      <div className="campo">
        <label htmlFor="nombreUsuarioRegistro">Nombre de usuario</label>
        <input
          id="nombreUsuarioRegistro"
          autoComplete="username"
          required
          minLength={3}
          maxLength={30}
          value={nombreUsuario}
          onChange={(e) => setNombreUsuario(e.target.value)}
        />
        <span className="pista">Con el que iniciará sesión. Letras, números, punto o guion.</span>
      </div>

      <div className="campo">
        <label htmlFor="passwordRegistro">Contraseña</label>
        <input
          id="passwordRegistro"
          type="password"
          autoComplete="new-password"
          required
          maxLength={72}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-describedby="condiciones-contrasena"
        />
        <ul id="condiciones-contrasena" className="condiciones">
          {CONDICIONES.map((c) => {
            const cumple = c.cumple(password);
            return (
              <li key={c.texto} className={cumple ? 'cumple' : undefined}>
                <span aria-hidden="true">{cumple ? '✓' : '·'}</span> {c.texto}
                <span className="solo-lector">{cumple ? ' (cumplido)' : ' (pendiente)'}</span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="campo">
        <label htmlFor="confirmacion">Repita la contraseña</label>
        <input
          id="confirmacion"
          type="password"
          autoComplete="new-password"
          required
          value={confirmacion}
          onChange={(e) => setConfirmacion(e.target.value)}
          aria-invalid={noCoinciden}
        />
        {noCoinciden && <span className="pista alerta">No coincide con la contraseña.</span>}
      </div>

      {error !== null && (
        <p className="aviso error" role="alert">
          {error}
        </p>
      )}

      <button type="submit" className="boton ancho" disabled={enviando}>
        {enviando ? 'Creando cuenta…' : 'Crear cuenta'}
      </button>

      <p className="enlace-alterno">
        ¿Ya tiene cuenta? <Link to="/login">Inicie sesión</Link>
      </p>
    </form>
  );
}
