/**
 * Formulario de nueva convocatoria (US-006).
 *
 * DE DÓNDE SALEN LOS REQUISITOS POR DEFECTO
 *   De `GET /convocatorias/catalogo`, que a su vez los lee de las fábricas del backend
 *   (Factory Method). El frontend NO tiene su propia lista: si la tuviera, el día que el
 *   Ministerio cambie los documentos de posgrado habría dos listas y una estaría mal.
 *
 * QUÉ SE VALIDA AQUÍ Y QUÉ NO
 *   Aquí solo lo que el navegador ya sabe hacer (`required`, `min`) para ahorrarle un viaje al
 *   servidor al administrador. Las reglas de verdad —cierre posterior a apertura, el tope de
 *   posgrado— las decide el backend y su mensaje se muestra tal cual. Repetirlas aquí sería
 *   tener dos definiciones de la misma regla que tarde o temprano dirían cosas distintas.
 */
import { useEffect, useState, type FormEvent, type ReactElement } from 'react';

import {
  crearConvocatoria,
  obtenerCatalogo,
  type CatalogoConvocatorias,
  type Convocatoria,
} from '../api/cliente';
import { TIPOS_BECA, formatearMontoEscrito, formatearQuetzales, nombreTipo } from '../formato';

interface Props {
  onCreada: (convocatoria: Convocatoria) => void;
  onCancelar: () => void;
}

/**
 * El mismo umbral que `shared/reglas/montos.ts` en el backend, repetido aquí a propósito.
 *
 * No es una regla duplicada: la decisión la toma el servidor y este número solo decide qué
 * aviso se muestra mientras se escribe. Si algún día cambia allá y no acá, lo peor que pasa
 * es que el aviso se adelante o se atrase; ninguna convocatoria se guarda mal por eso.
 */
const UMBRAL_SEGUNDA_APROBACION = 10_000;

/** Hoy en fecha LOCAL. `toISOString()` daria el dia de ayer para quien esta en Guatemala. */
const HOY = (() => {
  const d = new Date();
  const dosDigitos = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${dosDigitos(d.getMonth() + 1)}-${dosDigitos(d.getDate())}`;
})();

/** Fecha local `AAAA-MM-DD` de un `<input type="date">` a instante ISO. */
function aIso(fecha: string, finDelDia: boolean): string {
  // Apertura desde el primer segundo del día; cierre hasta el último. Para un aspirante,
  // "cierra el 31 de octubre" incluye todo el 31 de octubre.
  return new Date(`${fecha}T${finDelDia ? '23:59:59' : '00:00:00'}`).toISOString();
}

export function FormularioConvocatoria({ onCreada, onCancelar }: Props): ReactElement {
  const [catalogo, setCatalogo] = useState<CatalogoConvocatorias | null>(null);
  const [errorCatalogo, setErrorCatalogo] = useState<string | null>(null);

  const [tipo, setTipo] = useState<string>('UNIVERSITARIA');
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [cupos, setCupos] = useState('');
  // PO, 17 Oct 2026: el monto decide si sus solicitudes necesitarán dos aprobaciones.
  const [montoBeca, setMontoBeca] = useState('');
  // El campo guarda el texto con separadores ("15,000"); el numero se deriva de el.
  const montoNumerico = formatearMontoEscrito(montoBeca).valor;
  const [apertura, setApertura] = useState(HOY);
  const [cierre, setCierre] = useState('');
  const [requisitos, setRequisitos] = useState<string[]>([]);
  const [documentos, setDocumentos] = useState<string[]>([]);

  // Cuánto dura el periodo, para no tener que calcularlo de cabeza entre dos calendarios.
  const diasDePlazo =
    apertura === '' || cierre === ''
      ? null
      : Math.round(
          (new Date(`${cierre}T00:00:00`).getTime() - new Date(`${apertura}T00:00:00`).getTime()) /
            86_400_000,
        );

  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    obtenerCatalogo()
      .then((datos) => {
        if (!cancelado) setCatalogo(datos);
      })
      .catch((causa: unknown) => {
        if (!cancelado) {
          setErrorCatalogo(
            causa instanceof Error ? causa.message : 'No se pudo cargar el catálogo.',
          );
        }
      });
    return () => {
      cancelado = true;
    };
  }, []);

  // Al cambiar de tipo —y al cargar el catálogo— se proponen los requisitos y documentos de ese
  // tipo. El administrador puede quitar o agregar después; esto es solo el punto de partida.
  useEffect(() => {
    const porDefecto = catalogo?.tipos.find((t) => t.tipo === tipo);
    if (porDefecto !== undefined) {
      setRequisitos(porDefecto.requisitosPorDefecto);
      setDocumentos(porDefecto.documentosPorDefecto);
    }
  }, [catalogo, tipo]);

  function alternar(lista: string[], codigo: string): string[] {
    return lista.includes(codigo) ? lista.filter((c) => c !== codigo) : [...lista, codigo];
  }

  async function enviar(evento: FormEvent<HTMLFormElement>): Promise<void> {
    evento.preventDefault();
    setError(null);
    setEnviando(true);

    try {
      const creada = await crearConvocatoria({
        tipo,
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        cupos: Number(cupos),
        montoBeca: montoNumerico,
        fechaApertura: aIso(apertura, false),
        fechaCierre: aIso(cierre, true),
        requisitos,
        documentosExigidos: documentos,
      });
      onCreada(creada);
    } catch (causa: unknown) {
      setError(causa instanceof Error ? causa.message : 'No se pudo crear la convocatoria.');
    } finally {
      setEnviando(false);
    }
  }

  if (errorCatalogo !== null) {
    return (
      <p className="aviso error" role="alert">
        {errorCatalogo}
      </p>
    );
  }

  if (catalogo === null) {
    return <div className="esqueleto alto" aria-busy="true" aria-label="Cargando formulario" />;
  }

  return (
    <form className="formulario-convocatoria" onSubmit={(e) => void enviar(e)}>
      <div className="encabezado-form">
        <h2>Nueva convocatoria</h2>
        <p className="sub">
          Se guarda en <b>borrador</b>. No será visible al público hasta que la publique.
        </p>
      </div>

      <div className="rejilla">
        <div className="campo">
          <label htmlFor="tipo">Tipo de beca</label>
          <select id="tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
            {TIPOS_BECA.map((t) => (
              <option key={t} value={t}>
                {nombreTipo(t)}
              </option>
            ))}
          </select>
          <span className="pista">Cambiar el tipo propone sus requisitos y documentos.</span>
        </div>

        <div className="campo">
          <label htmlFor="cupos">Cupos</label>
          <input
            id="cupos"
            type="number"
            min={1}
            step={1}
            required
            value={cupos}
            onChange={(e) => setCupos(e.target.value)}
          />
          {tipo === 'POSGRADO' && <span className="pista">Posgrado admite hasta 50 cupos.</span>}
        </div>

        {/* El monto NO es un `type="number"`: ese campo muestra «15000» y nadie distingue de un
            vistazo quince mil de ciento cincuenta mil. Aquí se escriben solo dígitos y el valor
            se reescribe con separadores de millar en cada tecla, así que un cero de más salta a
            la vista mientras se escribe, no después de guardar. */}
        <div className="campo">
          <label htmlFor="montoBeca">Monto de la beca</label>
          <div className="campo-con-prefijo">
            <span className="prefijo" aria-hidden="true">
              Q
            </span>
            <input
              id="montoBeca"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="15,000"
              required
              value={montoBeca}
              onChange={(e) => setMontoBeca(formatearMontoEscrito(e.target.value).texto)}
            />
            <span className="sufijo" aria-hidden="true">
              .00
            </span>
          </div>
          <span className={`pista${montoNumerico > UMBRAL_SEGUNDA_APROBACION ? ' destacada' : ''}`}>
            {montoNumerico > UMBRAL_SEGUNDA_APROBACION
              ? `${formatearQuetzales(montoNumerico)} supera el umbral: cada solicitud necesitará dos aprobaciones, de dos personas distintas.`
              : 'Por encima de Q10,000.00, cada solicitud necesitará dos aprobaciones.'}
          </span>
        </div>

        <div className="campo ancho">
          <label htmlFor="titulo">Título</label>
          <input
            id="titulo"
            maxLength={150}
            required
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Beca Universitaria Nacional 2027"
          />
        </div>

        <div className="campo ancho">
          <label htmlFor="descripcion">Descripción</label>
          <textarea
            id="descripcion"
            maxLength={2000}
            rows={3}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
          />
        </div>

        {/* La apertura viene con la fecha de hoy ya puesta. Es el caso normal —una convocatoria
            que se crea hoy suele abrir hoy— y evita el error que costó una verificación fallida:
            una convocatoria creada con apertura futura, que aparecía en el listado como si
            estuviera abierta y rechazaba a quien intentaba postular. */}
        <div className="campo">
          <label htmlFor="apertura">Abre el</label>
          <input
            id="apertura"
            type="date"
            required
            min={HOY}
            value={apertura}
            onChange={(e) => setApertura(e.target.value)}
          />
          <span className="pista">
            {apertura > HOY
              ? 'Nadie podrá postular hasta esa fecha, aunque la convocatoria esté publicada.'
              : 'Recibe postulaciones desde el mismo día en que se publique.'}
          </span>
        </div>

        <div className="campo">
          <label htmlFor="cierre">Cierra el</label>
          <input
            id="cierre"
            type="date"
            required
            min={apertura === '' ? HOY : apertura}
            value={cierre}
            onChange={(e) => setCierre(e.target.value)}
          />
          {diasDePlazo !== null && (
            <span className="pista">
              {diasDePlazo > 0
                ? `${diasDePlazo} días de plazo para postular.`
                : 'El cierre debe ser posterior a la apertura.'}
            </span>
          )}
        </div>
      </div>

      <div className="opciones-dobles">
        <fieldset className="opciones">
          <legend>
            Requisitos <span className="cuenta">{requisitos.length}</span>
          </legend>
          {catalogo.requisitos.map((r) => (
            <label key={r.codigo}>
              <input
                type="checkbox"
                checked={requisitos.includes(r.codigo)}
                onChange={() => setRequisitos((lista) => alternar(lista, r.codigo))}
              />
              {r.descripcion}
            </label>
          ))}
        </fieldset>

        <fieldset className="opciones">
          <legend>
            Documentos exigidos <span className="cuenta">{documentos.length}</span>
          </legend>
          {catalogo.documentos.map((d) => (
            <label key={d.codigo}>
              <input
                type="checkbox"
                checked={documentos.includes(d.codigo)}
                onChange={() => setDocumentos((lista) => alternar(lista, d.codigo))}
              />
              {d.descripcion}
            </label>
          ))}
        </fieldset>
      </div>

      {(requisitos.length === 0 || documentos.length === 0) && (
        <p className="aviso">
          Puede guardarla así, pero <b>no se podrá publicar</b> sin al menos un requisito y un
          documento exigido.
        </p>
      )}

      {error !== null && (
        <p className="aviso error" role="alert">
          {error}
        </p>
      )}

      <div className="acciones">
        <button type="button" className="boton fantasma" onClick={onCancelar} disabled={enviando}>
          Cancelar
        </button>
        <button type="submit" className="boton" disabled={enviando}>
          {enviando ? 'Guardando…' : 'Guardar borrador'}
        </button>
      </div>
    </form>
  );
}
