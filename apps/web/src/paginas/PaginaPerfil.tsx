/**
 * PÁGINA `/perfil` — perfil académico y socioeconómico (US-011).
 *
 * SE PUEDE GUARDAR A MEDIAS
 *   Reunir el promedio o el ingreso familiar puede tomar días. El formulario guarda lo que haya y
 *   el aviso de arriba dice qué falta. La lista la calcula el servidor: es la misma regla que
 *   después decide si se puede postular, así que no puede haber dos versiones de "completo".
 *
 * UN CAMPO VACÍO SE MANDA COMO `null`
 *   El backend exige el perfil entero en cada guardado para distinguir "no lo mandé" de "lo quiero
 *   vacío". Por eso cada campo del formulario se traduce a su valor o a `null`, nunca se omite.
 */
import { useEffect, useState, type FormEvent, type ReactElement } from 'react';
import { Link, useLocation } from 'react-router-dom';

import {
  guardarPerfil,
  listarDepartamentos,
  obtenerPerfil,
  type DatosPerfil,
  type ElementoCatalogo,
  type PerfilEstudiante,
} from '../api/cliente';
import { MarcoPrivado } from '../componentes/MarcoPrivado';

const NIVELES: ElementoCatalogo[] = [
  { codigo: 'NIVEL_MEDIO', descripcion: 'Nivel medio (diversificado)' },
  { codigo: 'UNIVERSITARIO', descripcion: 'Universitario' },
  { codigo: 'POSGRADO', descripcion: 'Posgrado' },
];

type Formulario = Record<keyof DatosPerfil, string>;

const aTexto = (valor: string | number | null): string => (valor === null ? '' : String(valor));

function aFormulario(perfil: PerfilEstudiante): Formulario {
  return {
    centroEducativo: aTexto(perfil.centroEducativo),
    nivel: aTexto(perfil.nivel),
    promedio: aTexto(perfil.promedio),
    ingresoFamiliarMensual: aTexto(perfil.ingresoFamiliarMensual),
    dependientes: aTexto(perfil.dependientes),
    departamento: aTexto(perfil.departamento),
    municipio: aTexto(perfil.municipio),
  };
}

const texto = (v: string): string | null => (v.trim() === '' ? null : v.trim());
const numero = (v: string): number | null => (v.trim() === '' ? null : Number(v));

function aDatos(f: Formulario): DatosPerfil {
  return {
    centroEducativo: texto(f.centroEducativo),
    nivel: texto(f.nivel),
    promedio: numero(f.promedio),
    ingresoFamiliarMensual: numero(f.ingresoFamiliarMensual),
    dependientes: numero(f.dependientes),
    departamento: texto(f.departamento),
    municipio: texto(f.municipio),
  };
}

interface EstadoNavegacion {
  volverA?: string;
}

export function PaginaPerfil(): ReactElement {
  const ubicacion = useLocation();
  const volverA = (ubicacion.state as EstadoNavegacion | null)?.volverA;

  const [perfil, setPerfil] = useState<PerfilEstudiante | null>(null);
  const [formulario, setFormulario] = useState<Formulario | null>(null);
  const [departamentos, setDepartamentos] = useState<ElementoCatalogo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);

  useEffect(() => {
    Promise.all([obtenerPerfil(), listarDepartamentos()])
      .then(([p, d]) => {
        setPerfil(p);
        setFormulario(aFormulario(p));
        setDepartamentos(d);
      })
      .catch((causa: unknown) =>
        setError(causa instanceof Error ? causa.message : 'No se pudo cargar el perfil.'),
      );
  }, []);

  function cambiar(campo: keyof DatosPerfil, valor: string): void {
    setGuardado(false);
    setFormulario((f) => (f === null ? f : { ...f, [campo]: valor }));
  }

  async function guardar(evento: FormEvent<HTMLFormElement>): Promise<void> {
    evento.preventDefault();
    if (formulario === null) return;
    setError(null);
    setGuardando(true);
    try {
      const actualizado = await guardarPerfil(aDatos(formulario));
      setPerfil(actualizado);
      setFormulario(aFormulario(actualizado));
      setGuardado(true);
    } catch (causa: unknown) {
      setError(causa instanceof Error ? causa.message : 'No se pudo guardar.');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <MarcoPrivado>
      <div className="barra-resultados">
        <div>
          <h1>Mi perfil</h1>
          <p className="conteo">
            Estos datos se usan para evaluar su solicitud. Puede guardarlos por partes.
          </p>
        </div>
      </div>

      {perfil !== null && !perfil.completo && (
        <p className="aviso pendiente" role="status">
          Para postular a una beca falta: <strong>{perfil.camposFaltantes.join(', ')}</strong>.
        </p>
      )}

      {perfil !== null && perfil.completo && (
        <p className="aviso exito" role="status">
          Su perfil está completo. Ya puede postular.{' '}
          <Link to={volverA ?? '/convocatorias'}>
            {volverA !== undefined ? 'Volver a la postulación' : 'Ver convocatorias'}
          </Link>
        </p>
      )}

      {error !== null && (
        <p className="aviso error" role="alert">
          {error}
        </p>
      )}

      {formulario === null && error === null && (
        <div className="esqueleto alto" aria-busy="true" aria-label="Cargando perfil" />
      )}

      {formulario !== null && (
        <form className="panel formulario-perfil" onSubmit={(e) => void guardar(e)} noValidate>
          <fieldset>
            <legend>Datos académicos</legend>
            <div className="rejilla">
              <div className="campo ancho">
                <label htmlFor="centroEducativo">Centro educativo</label>
                <input
                  id="centroEducativo"
                  maxLength={150}
                  value={formulario.centroEducativo}
                  onChange={(e) => cambiar('centroEducativo', e.target.value)}
                  placeholder="Instituto, colegio o universidad donde estudia"
                />
              </div>
              <div className="campo">
                <label htmlFor="nivel">Nivel académico</label>
                <select
                  id="nivel"
                  value={formulario.nivel}
                  onChange={(e) => cambiar('nivel', e.target.value)}
                >
                  <option value="">Seleccione…</option>
                  {NIVELES.map((n) => (
                    <option key={n.codigo} value={n.codigo}>
                      {n.descripcion}
                    </option>
                  ))}
                </select>
              </div>
              <div className="campo">
                <label htmlFor="promedio">Promedio del último ciclo</label>
                <input
                  id="promedio"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={100}
                  step={0.01}
                  value={formulario.promedio}
                  onChange={(e) => cambiar('promedio', e.target.value)}
                  placeholder="0 a 100"
                />
              </div>
            </div>
          </fieldset>

          <fieldset>
            <legend>Situación socioeconómica</legend>
            <div className="rejilla">
              <div className="campo">
                <label htmlFor="ingreso">Ingreso familiar mensual (Q)</label>
                <input
                  id="ingreso"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={1}
                  value={formulario.ingresoFamiliarMensual}
                  onChange={(e) => cambiar('ingresoFamiliarMensual', e.target.value)}
                  placeholder="En quetzales, sin centavos"
                />
                <span className="pista">Suma de lo que ganan todas las personas del hogar.</span>
              </div>
              <div className="campo">
                <label htmlFor="dependientes">Personas que dependen de ese ingreso</label>
                <input
                  id="dependientes"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={50}
                  step={1}
                  value={formulario.dependientes}
                  onChange={(e) => cambiar('dependientes', e.target.value)}
                />
              </div>
            </div>
          </fieldset>

          <fieldset>
            <legend>Residencia</legend>
            <div className="rejilla">
              <div className="campo">
                <label htmlFor="departamento">Departamento</label>
                <select
                  id="departamento"
                  value={formulario.departamento}
                  onChange={(e) => cambiar('departamento', e.target.value)}
                >
                  <option value="">Seleccione…</option>
                  {departamentos.map((d) => (
                    <option key={d.codigo} value={d.codigo}>
                      {d.descripcion}
                    </option>
                  ))}
                </select>
              </div>
              <div className="campo">
                <label htmlFor="municipio">Municipio</label>
                <input
                  id="municipio"
                  maxLength={80}
                  value={formulario.municipio}
                  onChange={(e) => cambiar('municipio', e.target.value)}
                />
              </div>
            </div>
          </fieldset>

          <div className="acciones">
            {guardado && (
              <span className="confirmacion" role="status">
                Cambios guardados
              </span>
            )}
            <button type="submit" className="boton" disabled={guardando}>
              {guardando ? 'Guardando…' : 'Guardar perfil'}
            </button>
          </div>
        </form>
      )}
    </MarcoPrivado>
  );
}
