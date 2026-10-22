/**
 * Tarjeta de una convocatoria.
 *
 * El patrón viene de las bolsas de empleo locales (computrabajo, tecoloco):
 * sello a la izquierda, título y categoría arriba, resumen breve, y una fila de
 * metadatos separada por una línea con los datos que se comparan entre ofertas.
 *
 * DECISIÓN DE DISEÑO — el plazo va a la derecha del pie, destacado.
 *   Un aspirante no compara convocatorias por su código ni por su descripción:
 *   compara por *cuánto tiempo le queda*. Por eso el plazo es el único dato con
 *   color y forma de píldora, y todo lo demás es texto tranquilo.
 *
 * REQUISITOS Y DOCUMENTOS (US-008)
 *   La historia pide que el visitante vea las convocatorias "con sus requisitos". Van en un
 *   `<details>` plegado y no a la vista: con cuatro requisitos y cuatro documentos por
 *   tarjeta, la lista dejaría de poder compararse de un vistazo. Es un elemento nativo del
 *   navegador, así que funciona con teclado y lector de pantalla sin código extra.
 */
import type { ReactElement, ReactNode } from 'react';

import { IconoCalendario, IconoCodigo, IconoCupos, IconoReloj } from './Iconos';
import type { Convocatoria } from '../api/cliente';
import {
  claseTipo,
  estadoPlazo,
  formatearFecha,
  formatearQuetzales,
  inicialTipo,
  nombreTipo,
} from '../formato';

const cantidad = (n: number, singular: string, plural: string): string =>
  `${n} ${n === 1 ? singular : plural}`;

/**
 * `accion` es lo que va al pie de la tarjeta: «Postular» para un estudiante, un enlace al login
 * para un visitante. La tarjeta no decide cuál: no sabe nada de sesiones.
 */
export function TarjetaConvocatoria({
  convocatoria,
  accion,
}: {
  convocatoria: Convocatoria;
  accion?: ReactNode;
}): ReactElement {
  const plazo = estadoPlazo(convocatoria.fechaCierre);

  return (
    <li className={`convocatoria ${claseTipo(convocatoria.tipo)}`}>
      <span className="sello" aria-hidden="true">
        {inicialTipo(convocatoria.tipo)}
      </span>

      <div>
        <div className="cabecera">
          <h3>{convocatoria.titulo}</h3>
          <span className="etiqueta-tipo">{nombreTipo(convocatoria.tipo)}</span>
        </div>

        <p className="resumen">{convocatoria.descripcion}</p>

        <div className="meta">
          <span className="item">
            <IconoCodigo />
            <b>{convocatoria.codigo}</b>
          </span>

          {/* El texto de cada dato va en un solo hijo: el `gap` del contenedor
              separa a los hermanos, y si el número y su unidad fueran nodos
              distintos quedarían despegados ("500    cupos"). */}
          <span className="item">
            <IconoCupos />
            <span>
              <b>{convocatoria.cupos.toLocaleString('es-GT')}</b> cupos
            </span>
          </span>

          {convocatoria.montoBeca > 0 && (
            <span className="item">
              <IconoCupos />
              <span>
                <b>{formatearQuetzales(convocatoria.montoBeca)}</b> por beca
              </span>
            </span>
          )}

          <span className="item">
            <IconoCalendario />
            <span>
              Cierra el <b>{formatearFecha(convocatoria.fechaCierre)}</b>
            </span>
          </span>

          <span className={`plazo ${plazo.clase}`}>
            <IconoReloj />
            {plazo.texto}
          </span>
        </div>

        {(convocatoria.requisitos.length > 0 || convocatoria.documentosExigidos.length > 0) && (
          <details className="requisitos">
            <summary>
              Requisitos y documentos
              <span className="cuenta">
                {cantidad(convocatoria.requisitos.length, 'requisito', 'requisitos')} ·{' '}
                {cantidad(convocatoria.documentosExigidos.length, 'documento', 'documentos')}
              </span>
            </summary>
            <div className="requisitos-cuerpo">
              <div>
                <h4>Quién puede postular</h4>
                <ul>
                  {convocatoria.requisitos.map((r) => (
                    <li key={r.codigo}>{r.descripcion}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4>Qué documentos preparar</h4>
                <ul>
                  {convocatoria.documentosExigidos.map((d) => (
                    <li key={d.codigo}>{d.descripcion}</li>
                  ))}
                </ul>
              </div>
            </div>
          </details>
        )}

        {accion !== undefined && <div className="accion-tarjeta">{accion}</div>}
      </div>
    </li>
  );
}
