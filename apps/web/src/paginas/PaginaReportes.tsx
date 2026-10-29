/**
 * Página `/reportes`: reportes y estadísticas (EPIC-06), solo administración. Tiene tres vistas:
 *
 * - Panel (US-029): indicadores del programa o de una convocatoria.
 * - Solicitudes (US-028): filtros opcionales, agrupación y orden. Es la cara visible del patrón
 *   Builder: cada filtro lleno es un paso y los vacíos no se envían. El servidor rechaza las
 *   combinaciones sin sentido y su mensaje se muestra tal cual.
 * - Por región (US-031): los 22 departamentos, también los que no tienen becas.
 *
 * Las dos últimas se exportan a CSV o PDF (US-030). La tabla es genérica: el servidor dice qué
 * columnas tiene cada reporte.
 */
import { useCallback, useEffect, useState, type FormEvent, type ReactElement } from 'react';

import {
  exportarReporte,
  listarConvocatoriasGestion,
  obtenerPanel,
  obtenerReporteRegiones,
  obtenerReporteSolicitudes,
  type Convocatoria,
  type FiltrosReporte,
  type Indicadores,
  type Panel,
  type Reporte,
} from '../api/cliente';
import { MarcoPrivado } from '../componentes/MarcoPrivado';
import { guardarArchivo } from '../descargas';
import { formatearFechaHora, NOMBRE_DEPARTAMENTO, nombreEstadoSolicitud } from '../formato';

type Vista = 'panel' | 'solicitudes' | 'regiones';

const ESTADOS = ['ENVIADA', 'EN_EVALUACION', 'APROBADA', 'RECHAZADA', 'ADJUDICADA'];
const NIVELES: [string, string][] = [
  ['NIVEL_MEDIO', 'Nivel medio'],
  ['UNIVERSITARIO', 'Universitario'],
  ['POSGRADO', 'Posgrado'],
];
const AGRUPACIONES: [string, string][] = [
  ['ESTADO', 'Estado'],
  ['CONVOCATORIA', 'Convocatoria'],
  ['NIVEL', 'Nivel académico'],
  ['DEPARTAMENTO', 'Departamento'],
  ['CENTRO_EDUCATIVO', 'Centro educativo'],
];
const ORDENES: [string, string][] = [
  ['NUMERO', 'Número de solicitud'],
  ['ENVIO_RECIENTE', 'Envío más reciente'],
  ['ENVIO_ANTIGUO', 'Envío más antiguo'],
];
const DEPARTAMENTOS = Object.entries(NOMBRE_DEPARTAMENTO).sort((a, b) => a[1].localeCompare(b[1]));

const mensaje = (causa: unknown) =>
  causa instanceof Error
    ? causa.message
    : 'No se pudo generar el reporte. Revise su conexión y vuelva a intentarlo.';

export function PaginaReportes(): ReactElement {
  const [vista, setVista] = useState<Vista>('panel');
  const [convocatorias, setConvocatorias] = useState<Convocatoria[]>([]);

  useEffect(() => {
    listarConvocatoriasGestion()
      .then((lista) => setConvocatorias(lista.filter((c) => c.estado !== 'BORRADOR')))
      .catch(() => setConvocatorias([]));
  }, []);

  return (
    <MarcoPrivado>
      <div className="barra-resultados">
        <div>
          <h1>Reportes</h1>
          <p className="conteo">Datos de gestión del programa. No incluyen datos personales.</p>
        </div>
      </div>

      <div className="pestanas" role="group" aria-label="Tipo de reporte">
        {(
          [
            ['panel', 'Panel'],
            ['solicitudes', 'Solicitudes'],
            ['regiones', 'Por región'],
          ] as [Vista, string][]
        ).map(([clave, titulo]) => (
          <button
            key={clave}
            type="button"
            className="faceta"
            aria-pressed={vista === clave}
            onClick={() => setVista(clave)}
          >
            <span className="nombre">{titulo}</span>
          </button>
        ))}
      </div>

      {vista === 'panel' && <VistaPanel convocatorias={convocatorias} />}
      {vista === 'solicitudes' && <VistaSolicitudes convocatorias={convocatorias} />}
      {vista === 'regiones' && <VistaRegiones convocatorias={convocatorias} />}
    </MarcoPrivado>
  );
}

function SelectorConvocatoria({
  convocatorias,
  valor,
  onCambiar,
  id,
}: {
  convocatorias: Convocatoria[];
  valor: string;
  onCambiar: (v: string) => void;
  id: string;
}): ReactElement {
  return (
    <div className="campo">
      <label htmlFor={id}>Convocatoria</label>
      <select id={id} value={valor} onChange={(e) => onCambiar(e.target.value)}>
        <option value="">Todas</option>
        {convocatorias.map((c) => (
          <option key={c.id} value={c.id}>
            {c.codigo} · {c.titulo}
          </option>
        ))}
      </select>
    </div>
  );
}

// ── Panel (US-029) ──────────────────────────────────────────────────────────

function VistaPanel({ convocatorias }: { convocatorias: Convocatoria[] }): ReactElement {
  const [convocatoriaId, setConvocatoriaId] = useState('');
  const [panel, setPanel] = useState<Panel | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPanel(null);
    setError(null);
    obtenerPanel(convocatoriaId || undefined)
      .then(setPanel)
      .catch((causa: unknown) => setError(mensaje(causa)));
  }, [convocatoriaId]);

  return (
    <>
      <section className="panel filtros-reporte">
        <div className="rejilla">
          <SelectorConvocatoria
            id="panel-convocatoria"
            convocatorias={convocatorias}
            valor={convocatoriaId}
            onCambiar={setConvocatoriaId}
          />
        </div>
      </section>

      {error !== null && (
        <p className="aviso error" role="alert">
          {error}
        </p>
      )}
      {panel === null && error === null && (
        <div className="esqueleto alto" aria-busy="true" aria-label="Calculando indicadores" />
      )}

      {panel !== null && (
        <>
          <Tarjetas i={panel} />
          <p className="nota-consulta">
            Calculado el {formatearFechaHora(panel.generadoEn)} · La tasa de aprobación se calcula
            sobre las solicitudes ya resueltas; las que siguen en evaluación no cuentan.
          </p>

          {panel.convocatorias.length > 0 && (
            <section className="panel">
              <h2>Por convocatoria</h2>
              <div className="tabla-contenedor">
                <table className="tabla">
                  <thead>
                    <tr>
                      <th scope="col">Convocatoria</th>
                      <th scope="col" className="num">
                        Recibidas
                      </th>
                      <th scope="col" className="num">
                        Por asignar
                      </th>
                      <th scope="col" className="num">
                        En evaluación
                      </th>
                      <th scope="col" className="num">
                        Aprobación
                      </th>
                      <th scope="col" className="num">
                        Cupos libres
                      </th>
                      <th scope="col" className="num">
                        Días para resolver
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {panel.convocatorias.map((c) => (
                      <tr key={c.id}>
                        <td>
                          <span className="codigo">{c.codigo}</span>
                          <div className="pista-fila">{c.titulo}</div>
                        </td>
                        <td className="num">{c.recibidas}</td>
                        <td className="num">{c.pendientesDeAsignar}</td>
                        <td className="num">{c.enEvaluacion}</td>
                        <td className="num">{porcentaje(c.tasaAprobacion)}</td>
                        <td className="num">
                          {c.cuposDisponibles} de {c.cuposTotales}
                        </td>
                        <td className="num">{c.diasPromedioResolucion ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}
    </>
  );
}

/** "1 rechazada", "2 rechazadas". */
const cuantas = (n: number, singular: string, plural = `${singular}s`) =>
  `${n} ${n === 1 ? singular : plural}`;

const porcentaje = (n: number | null) => (n === null ? '—' : `${n} %`);

function Tarjetas({ i }: { i: Indicadores }): ReactElement {
  const datos: [string, string, string?][] = [
    [
      'Solicitudes recibidas',
      String(i.recibidas),
      `${i.pendientesDeAsignar} por asignar · ${i.enEvaluacion} en evaluación`,
    ],
    [
      'Tasa de aprobación',
      porcentaje(i.tasaAprobacion),
      `${cuantas(i.aprobadas + i.adjudicadas, 'aprobada')} · ${cuantas(i.rechazadas, 'rechazada')}`,
    ],
    [
      'Cupos disponibles',
      `${i.cuposDisponibles}`,
      `de ${i.cuposTotales} · ${cuantas(i.adjudicadas, 'beca adjudicada', 'becas adjudicadas')}`,
    ],
    [
      'Tiempo promedio de resolución',
      i.diasPromedioResolucion === null ? '—' : `${i.diasPromedioResolucion} días`,
      'desde el envío hasta la decisión',
    ],
  ];
  return (
    <div className="tarjetas-indicadores">
      {datos.map(([rotulo, cifra, detalle]) => (
        <div key={rotulo} className="panel indicador">
          <span className="rotulo">{rotulo}</span>
          <span className="cifra">{cifra}</span>
          {detalle && <span className="pista">{detalle}</span>}
        </div>
      ))}
    </div>
  );
}

// ── Solicitudes (US-028, US-030) ────────────────────────────────────────────

function VistaSolicitudes({ convocatorias }: { convocatorias: Convocatoria[] }): ReactElement {
  const [filtros, setFiltros] = useState<FiltrosReporte>({ estado: [] });
  const [reporte, setReporte] = useState<Reporte | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  // Lo que se exporta es lo que se está viendo: los filtros con que se generó, no el formulario.
  const [aplicados, setAplicados] = useState<FiltrosReporte>({});

  const cambiar = (clave: keyof FiltrosReporte, valor: string | string[]) =>
    setFiltros((f) => ({ ...f, [clave]: valor }));

  const generar = useCallback(async (f: FiltrosReporte) => {
    setError(null);
    setCargando(true);
    try {
      setReporte(await obtenerReporteSolicitudes(f));
      setAplicados(f);
    } catch (causa: unknown) {
      setReporte(null);
      setError(mensaje(causa));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void generar({});
  }, [generar]);

  function enviar(evento: FormEvent<HTMLFormElement>): void {
    evento.preventDefault();
    void generar(filtros);
  }

  const alternarEstado = (e: string) =>
    cambiar(
      'estado',
      (filtros.estado ?? []).includes(e)
        ? (filtros.estado ?? []).filter((x) => x !== e)
        : [...(filtros.estado ?? []), e],
    );

  return (
    <>
      <form className="panel filtros-reporte" onSubmit={enviar}>
        <div className="rejilla tres">
          <SelectorConvocatoria
            id="rep-convocatoria"
            convocatorias={convocatorias}
            valor={filtros.convocatoriaId ?? ''}
            onCambiar={(v) => cambiar('convocatoriaId', v)}
          />
          <Selector
            id="rep-nivel"
            etiqueta="Nivel académico"
            opciones={NIVELES}
            valor={filtros.nivel ?? ''}
            onCambiar={(v) => cambiar('nivel', v)}
          />
          <Selector
            id="rep-departamento"
            etiqueta="Departamento"
            opciones={DEPARTAMENTOS}
            valor={filtros.departamento ?? ''}
            onCambiar={(v) => cambiar('departamento', v)}
          />
          <div className="campo">
            <label htmlFor="rep-desde">Enviadas desde</label>
            <input
              id="rep-desde"
              type="date"
              value={filtros.desde ?? ''}
              onChange={(e) => cambiar('desde', e.target.value)}
            />
          </div>
          <div className="campo">
            <label htmlFor="rep-hasta">Hasta (inclusive)</label>
            <input
              id="rep-hasta"
              type="date"
              value={filtros.hasta ?? ''}
              onChange={(e) => cambiar('hasta', e.target.value)}
            />
          </div>
          <Selector
            id="rep-agrupar"
            etiqueta="Agrupar por"
            opciones={AGRUPACIONES}
            valor={filtros.agruparPor ?? ''}
            vacio="Sin agrupar"
            onCambiar={(v) => cambiar('agruparPor', v)}
          />
          <Selector
            id="rep-orden"
            etiqueta="Ordenar por"
            opciones={ORDENES}
            valor={filtros.ordenarPor ?? ''}
            vacio="Número de solicitud"
            onCambiar={(v) => cambiar('ordenarPor', v)}
          />
        </div>
        <fieldset className="opciones en-linea">
          <legend>Estado (sin marcar: todos)</legend>
          {ESTADOS.map((e) => (
            <label key={e}>
              <input
                type="checkbox"
                checked={(filtros.estado ?? []).includes(e)}
                onChange={() => alternarEstado(e)}
              />
              {nombreEstadoSolicitud(e)}
            </label>
          ))}
        </fieldset>
        <div className="acciones">
          <button
            type="button"
            className="boton fantasma"
            onClick={() => {
              setFiltros({ estado: [] });
              void generar({});
            }}
          >
            Limpiar
          </button>
          <button type="submit" className="boton" disabled={cargando}>
            {cargando ? 'Generando…' : 'Generar reporte'}
          </button>
        </div>
      </form>

      <ResultadoReporte
        reporte={reporte}
        error={error}
        cargando={cargando}
        exportar={(formato) => exportarReporte('solicitudes', aplicados, formato)}
      />
    </>
  );
}

function Selector({
  id,
  etiqueta,
  opciones,
  valor,
  vacio = 'Todos',
  onCambiar,
}: {
  id: string;
  etiqueta: string;
  opciones: [string, string][];
  valor: string;
  vacio?: string;
  onCambiar: (v: string) => void;
}): ReactElement {
  return (
    <div className="campo">
      <label htmlFor={id}>{etiqueta}</label>
      <select id={id} value={valor} onChange={(e) => onCambiar(e.target.value)}>
        <option value="">{vacio}</option>
        {opciones.map(([codigo, nombre]) => (
          <option key={codigo} value={codigo}>
            {nombre}
          </option>
        ))}
      </select>
    </div>
  );
}

// ── Por región (US-031) ─────────────────────────────────────────────────────

function VistaRegiones({ convocatorias }: { convocatorias: Convocatoria[] }): ReactElement {
  const [convocatoriaId, setConvocatoriaId] = useState('');
  const [reporte, setReporte] = useState<Reporte | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setReporte(null);
    setError(null);
    obtenerReporteRegiones(convocatoriaId || undefined)
      .then(setReporte)
      .catch((causa: unknown) => setError(mensaje(causa)));
  }, [convocatoriaId]);

  return (
    <>
      <section className="panel filtros-reporte">
        <div className="rejilla">
          <SelectorConvocatoria
            id="reg-convocatoria"
            convocatorias={convocatorias}
            valor={convocatoriaId}
            onCambiar={setConvocatoriaId}
          />
        </div>
      </section>
      <ResultadoReporte
        reporte={reporte}
        error={error}
        cargando={reporte === null && error === null}
        barras={{ clave: 'becas' }}
        exportar={(formato) =>
          exportarReporte('regiones', { convocatoriaId: convocatoriaId || undefined }, formato)
        }
      />
    </>
  );
}

// ── Resultado genérico ──────────────────────────────────────────────────────

function ResultadoReporte({
  reporte,
  error,
  cargando,
  barras,
  exportar,
}: {
  reporte: Reporte | null;
  error: string | null;
  cargando: boolean;
  barras?: { clave: string };
  exportar: (formato: 'CSV' | 'PDF') => Promise<Blob>;
}): ReactElement {
  const [exportando, setExportando] = useState<string | null>(null);
  const [errorExportar, setErrorExportar] = useState<string | null>(null);

  async function descargar(formato: 'CSV' | 'PDF'): Promise<void> {
    if (reporte === null) return;
    setErrorExportar(null);
    setExportando(formato);
    try {
      const fecha = reporte.generadoEn.slice(0, 10);
      guardarArchivo(
        await exportar(formato),
        `${reporte.nombre}-${fecha}.${formato.toLowerCase()}`,
      );
    } catch (causa: unknown) {
      setErrorExportar(mensaje(causa));
    } finally {
      setExportando(null);
    }
  }

  if (error !== null) {
    return (
      <p className="aviso error" role="alert">
        {error}
      </p>
    );
  }
  if (reporte === null) {
    return cargando ? (
      <div className="esqueleto alto" aria-busy="true" aria-label="Generando reporte" />
    ) : (
      <></>
    );
  }

  const maximo = barras
    ? Math.max(1, ...reporte.filas.map((f) => Number(f[barras.clave] ?? 0)))
    : 1;
  const maximoGrupo = Math.max(1, ...(reporte.grupos ?? []).map((g) => g.total));

  return (
    <section className="panel" aria-busy={cargando}>
      <h2>
        {reporte.titulo} · {reporte.total} {reporte.total === 1 ? 'registro' : 'registros'}
      </h2>
      <div className="encabezado-reporte">
        <ul className="filtros-aplicados">
          {reporte.filtros.map((f) => (
            <li key={f.etiqueta}>
              <b>{f.etiqueta}:</b> {f.valor}
            </li>
          ))}
        </ul>
        <div className="exportar">
          {(['CSV', 'PDF'] as const).map((formato) => (
            <button
              key={formato}
              type="button"
              className="boton pequeno fantasma"
              disabled={exportando !== null}
              onClick={() => void descargar(formato)}
            >
              {exportando === formato ? 'Exportando…' : `Exportar ${formato}`}
            </button>
          ))}
        </div>
      </div>
      {errorExportar !== null && (
        <p className="aviso error" role="alert">
          {errorExportar}
        </p>
      )}

      {reporte.grupos !== null && reporte.grupos.length > 0 && (
        <div className="grupos">
          <h3>Por {reporte.agrupacion?.toLowerCase()}</h3>
          <ul>
            {reporte.grupos.map((g) => (
              <li key={g.clave}>
                <span className="etiqueta">{g.etiqueta}</span>
                <span className="barra" aria-hidden="true">
                  <span style={{ width: `${(g.total / maximoGrupo) * 100}%` }} />
                </span>
                <span className="total">{g.total}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {reporte.filas.length === 0 ? (
        <p className="nota-panel">No hay datos con estos filtros.</p>
      ) : (
        <div className="tabla-contenedor">
          <table className="tabla reporte">
            <thead>
              <tr>
                {reporte.columnas.map((c) => (
                  <th key={c.clave} scope="col" className={c.numerica ? 'num' : undefined}>
                    {c.titulo}
                  </th>
                ))}
                {barras && (
                  <th scope="col">
                    <span className="solo-lector">Proporción</span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {reporte.filas.map((fila, i) => (
                <tr key={i}>
                  {reporte.columnas.map((c) => (
                    <td key={c.clave} className={c.numerica ? 'num' : undefined}>
                      {fila[c.clave] ?? '—'}
                    </td>
                  ))}
                  {barras && (
                    <td className="celda-barra" aria-hidden="true">
                      <span className="barra">
                        <span
                          style={{ width: `${(Number(fila[barras.clave] ?? 0) / maximo) * 100}%` }}
                        />
                      </span>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
