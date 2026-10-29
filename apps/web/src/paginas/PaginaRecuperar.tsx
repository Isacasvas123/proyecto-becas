/**
 * US-035: recuperar una contraseña olvidada.
 *
 * Es una pantalla para dos momentos: sin token en la URL (`/recuperar`) pide el correo y manda el
 * enlace, y con token (`/recuperar/:token`) pide la contraseña nueva. Es un solo archivo porque es
 * el mismo trámite y separarlos duplicaría el encabezado, el marco y los avisos.
 *
 * El mensaje de éxito dice "si esa dirección tiene una cuenta, le enviamos el enlace", la misma
 * decisión que toma el servidor al responder 204 en los dos casos. Si aquí se confirmara solo
 * cuando la cuenta existe, se desharía la protección.
 */
import { useState, type FormEvent, type ReactElement } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { restablecerPassword, solicitarRecuperacion } from '../api/cliente';
import { Encabezado } from '../componentes/Encabezado';

const LONGITUD_MINIMA = 8;

export function PaginaRecuperar(): ReactElement {
  const { token } = useParams();
  return (
    <>
      <Encabezado />
      <main className="contenido estrecho">
        {token === undefined ? <PedirEnlace /> : <ElegirPassword token={token} />}
      </main>
    </>
  );
}

/** Paso 1: la persona escribe su correo y el sistema le manda el enlace. */
function PedirEnlace(): ReactElement {
  const [correo, setCorreo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enviar(evento: FormEvent): Promise<void> {
    evento.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      await solicitarRecuperacion(correo);
      setEnviado(true);
    } catch (causa: unknown) {
      setError(causa instanceof Error ? causa.message : 'No se pudo enviar el enlace.');
    } finally {
      setEnviando(false);
    }
  }

  if (enviado) {
    return (
      <section className="panel">
        <h1>Revise su correo</h1>
        <p className="aviso exito" role="status">
          Si <strong>{correo}</strong> tiene una cuenta en la plataforma, le enviamos un enlace para
          elegir una contraseña nueva.
        </p>
        <p className="pista">
          El enlace vence en una hora y sirve una sola vez. Si no le llega, revise la carpeta de
          correo no deseado antes de volver a solicitarlo.
        </p>
        <p className="enlace-alterno">
          <Link to="/login">Volver al inicio de sesión</Link>
        </p>
      </section>
    );
  }

  return (
    <section className="panel">
      <h1>¿Olvidó su contraseña?</h1>
      <p className="pista">
        Escriba el correo con el que se registró. Le enviaremos un enlace para elegir una nueva.
      </p>

      <form onSubmit={(e) => void enviar(e)} noValidate>
        {error !== null && (
          <p className="aviso error" role="alert">
            {error}
          </p>
        )}

        <div className="campo">
          <label htmlFor="correo">Correo electrónico</label>
          <input
            id="correo"
            type="email"
            autoComplete="email"
            required
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            placeholder="sunombre@correo.com"
          />
        </div>

        <button type="submit" className="boton" disabled={enviando || correo.trim() === ''}>
          {enviando ? 'Enviando…' : 'Enviarme el enlace'}
        </button>
      </form>

      <p className="enlace-alterno">
        ¿Ya la recordó? <Link to="/login">Inicie sesión</Link>
      </p>
    </section>
  );
}

/** Paso 2: la persona llegó por el enlace del correo y elige su contraseña nueva. */
function ElegirPassword({ token }: { token: string }): ReactElement {
  const navegar = useNavigate();
  const [password, setPassword] = useState('');
  const [repetida, setRepetida] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // La comprobación de que coinciden es solo de esta pantalla: evita el error de tecleo
  // antes de gastar el enlace, que sirve una sola vez. La política de la contraseña la
  // decide el servidor, y su mensaje se muestra tal cual.
  const coinciden = password === repetida;
  const suficiente = password.length >= LONGITUD_MINIMA;

  async function enviar(evento: FormEvent): Promise<void> {
    evento.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      await restablecerPassword(token, password);
      // No se inicia sesión sola: la persona la escribe en el login y así confirma que la
      // recuerda. Un enlace interceptado no deja a nadie dentro.
      navegar('/login', { replace: true, state: { passwordRestablecida: true } });
    } catch (causa: unknown) {
      setError(causa instanceof Error ? causa.message : 'No se pudo cambiar la contraseña.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className="panel">
      <h1>Elija su contraseña nueva</h1>
      <p className="pista">
        Debe tener al menos {LONGITUD_MINIMA} caracteres. Después iniciará sesión con ella.
      </p>

      <form onSubmit={(e) => void enviar(e)} noValidate>
        {error !== null && (
          <p className="aviso error" role="alert">
            {error}{' '}
            {/* Un enlace vencido o ya usado no se arregla reintentando: hay que pedir otro. */}
            <Link to="/recuperar">Solicitar un enlace nuevo</Link>
          </p>
        )}

        <div className="campo">
          <label htmlFor="password">Contraseña nueva</label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {password.length > 0 && !suficiente && (
            <span className="pista alerta">
              Lleva {password.length} de {LONGITUD_MINIMA} caracteres.
            </span>
          )}
        </div>

        <div className="campo">
          <label htmlFor="repetida">Repítala</label>
          <input
            id="repetida"
            type="password"
            autoComplete="new-password"
            required
            value={repetida}
            onChange={(e) => setRepetida(e.target.value)}
          />
          {repetida.length > 0 && !coinciden && (
            <span className="pista alerta">Las dos contraseñas no son iguales.</span>
          )}
        </div>

        <button
          type="submit"
          className="boton"
          disabled={enviando || !suficiente || !coinciden || repetida === ''}
        >
          {enviando ? 'Guardando…' : 'Cambiar mi contraseña'}
        </button>
      </form>
    </section>
  );
}
