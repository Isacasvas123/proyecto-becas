/**
 * PÁGINA `/evaluadores` — cuentas de evaluador (parte de US-017). Solo administración.
 *
 * El administrador crea la cuenta con una contraseña inicial y se la entrega a la persona por un
 * canal seguro. Cambiarla después es US-004 (perfil), que todavía no existe: queda anotado.
 */
import { useEffect, useState, type FormEvent, type ReactElement } from 'react';
import { Link } from 'react-router-dom';

import { crearEvaluador, listarEvaluadores, type CuentaEvaluador } from '../api/cliente';
import { MarcoPrivado } from '../componentes/MarcoPrivado';

const VACIO = { nombreCompleto: '', cui: '', correo: '', nombreUsuario: '', password: '' };

export function PaginaEvaluadores(): ReactElement {
  const [cuentas, setCuentas] = useState<CuentaEvaluador[] | null>(null);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [creando, setCreando] = useState(false);
  const [datos, setDatos] = useState(VACIO);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [exito, setExito] = useState<string | null>(null);

  useEffect(() => {
    listarEvaluadores()
      .then(setCuentas)
      .catch((causa: unknown) =>
        setErrorCarga(causa instanceof Error ? causa.message : 'No se pudieron cargar.'),
      );
  }, []);

  async function guardar(evento: FormEvent<HTMLFormElement>): Promise<void> {
    evento.preventDefault();
    setError(null);
    setGuardando(true);
    try {
      const nueva = await crearEvaluador(datos);
      setCuentas((lista) => [...(lista ?? []), nueva]);
      setExito(`Cuenta de ${nueva.nombreCompleto} creada. Entréguele su usuario y contraseña.`);
      setDatos(VACIO);
      setCreando(false);
    } catch (causa: unknown) {
      setError(causa instanceof Error ? causa.message : 'No se pudo crear la cuenta.');
    } finally {
      setGuardando(false);
    }
  }

  const campo = (clave: keyof typeof VACIO, etiqueta: string, extra: object = {}) => (
    <div className="campo">
      <label htmlFor={`ev-${clave}`}>{etiqueta}</label>
      <input
        id={`ev-${clave}`}
        required
        value={datos[clave]}
        onChange={(e) => setDatos({ ...datos, [clave]: e.target.value })}
        {...extra}
      />
    </div>
  );

  return (
    <MarcoPrivado>
      <div className="barra-resultados">
        <div>
          <h1>Evaluadores</h1>
          <p className="conteo">
            Las personas que pueden integrar un <Link to="/comites">comité</Link>.
          </p>
        </div>
        {!creando && (
          <button type="button" className="boton" onClick={() => setCreando(true)}>
            Nuevo evaluador
          </button>
        )}
      </div>

      {exito !== null && (
        <p className="aviso exito" role="status">
          {exito}
        </p>
      )}

      {creando && (
        <form className="panel formulario-convocatoria" onSubmit={(e) => void guardar(e)}>
          <div className="encabezado-form">
            <h2>Nueva cuenta de evaluador</h2>
            <p className="sub">
              Mismas reglas que el registro: CUI de 13 dígitos y contraseña de 8 caracteres con una
              mayúscula y un número.
            </p>
          </div>
          <div className="rejilla">
            {campo('nombreCompleto', 'Nombre completo', { maxLength: 120 })}
            {campo('cui', 'CUI', { maxLength: 20, inputMode: 'numeric' })}
            {campo('correo', 'Correo', { type: 'email', maxLength: 120 })}
            {campo('nombreUsuario', 'Nombre de usuario', { maxLength: 30, autoComplete: 'off' })}
            {campo('password', 'Contraseña inicial', {
              type: 'password',
              maxLength: 72,
              autoComplete: 'new-password',
            })}
          </div>
          {error !== null && (
            <p className="aviso error" role="alert">
              {error}
            </p>
          )}
          <div className="acciones">
            <button
              type="button"
              className="boton fantasma"
              disabled={guardando}
              onClick={() => {
                setCreando(false);
                setError(null);
              }}
            >
              Cancelar
            </button>
            <button type="submit" className="boton" disabled={guardando}>
              {guardando ? 'Creando…' : 'Crear cuenta'}
            </button>
          </div>
        </form>
      )}

      {errorCarga !== null && (
        <p className="aviso error" role="alert">
          {errorCarga}
        </p>
      )}

      {cuentas === null && errorCarga === null && (
        <div className="esqueleto alto" aria-busy="true" aria-label="Cargando evaluadores" />
      )}

      {cuentas !== null && cuentas.length === 0 && (
        <p className="aviso">
          Todavía no hay evaluadores. Cree el primero para poder formar comités.
        </p>
      )}

      {cuentas !== null && cuentas.length > 0 && (
        <div className="tabla-contenedor">
          <table className="tabla">
            <thead>
              <tr>
                <th scope="col">Nombre</th>
                <th scope="col">Usuario</th>
                <th scope="col">Correo</th>
                <th scope="col">Estado</th>
              </tr>
            </thead>
            <tbody>
              {cuentas.map((c) => (
                <tr key={c.id}>
                  <td className="titulo-fila">{c.nombreCompleto}</td>
                  <td className="codigo">{c.nombreUsuario}</td>
                  <td>{c.correo}</td>
                  <td>
                    <span className={`estado ${c.activo ? 'e-publicada' : 'e-cerrada'}`}>
                      {c.activo ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </MarcoPrivado>
  );
}
