/**
 * Tarjeta de una convocatoria, con el patrón de las bolsas de empleo locales (computrabajo,
 * tecoloco): sello a la izquierda, título y categoría arriba, resumen y una fila de metadatos con
 * los datos que se comparan entre ofertas.
 *
 * El plazo va destacado a la derecha del pie porque un aspirante no compara por código ni por
 * descripción sino por cuánto tiempo le queda: es el único dato con color y forma de píldora.
 *
 * Los requisitos y documentos (US-008) van en un `<details>` plegado: con cuatro de cada uno por
 * tarjeta, la lista dejaría de compararse de un vistazo. Es un elemento nativo, así que funciona
 * con teclado y lector de pantalla.
 */
import type { ReactElement, ReactNode } from 'react';

import { IconoCalendario, IconoCodigo, IconoCupos, IconoReloj } from './Iconos';
import type { Convocatoria } from '../api/cliente';
import {
  cantidad,
  claseTipo,
  estadoPlazo,
  formatearFecha,
  formatearQuetzales,
  inicialTipo,
  nombreTipo,
} from '../formato';

/**
 * `accion` es lo que va al pie de la tarjeta: «Postular» para un estudiante, un enlace al login
 * para un visitante. La tarjeta no decide cuál: no sabe nada de sesiones.
 */
export function TarjetaConvocatoria({
  convocatoria,
  accion,
  disponibles,
}: {
  convocatoria: Convocatoria;
  accion?: ReactNode;
  /** Cupos que quedan. `undefined` si el dato no llegó: entonces se muestra solo el total. */
  disponibles?: number;
}): ReactElement {
  const plazo = estadoPlazo(convocatoria.fechaCierre, convocatoria.fechaApertura);

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
            {/* Lo que le importa a quien va a postular no es cuántas becas se ofrecieron, sino
                cuántas quedan: una convocatoria sin cupos libres sigue aceptando solicitudes, y
                sin este dato alguien reúne sus papeles para nada. El total se queda al lado
                para que el número no pierda contexto. */}
            {disponibles === undefined ? (
              <span>{cantidad(convocatoria.cupos, 'cupo', 'cupos')}</span>
            ) : disponibles === 0 ? (
              <span>
                <b>Sin cupos libres</b> de {cantidad(convocatoria.cupos, 'cupo', 'cupos')}
              </span>
            ) : (
              <span>
                <b>{disponibles.toLocaleString('es-GT')}</b> de{' '}
                {cantidad(convocatoria.cupos, 'cupo', 'cupos')}
              </span>
            )}
          </span>

          {convocatoria.montoBeca > 0 && (
            <span className="item">
              <IconoCupos />
              <span>
                <b>{formatearQuetzales(convocatoria.montoBeca)}</b> por beca
              </span>
            </span>
          )}

          {/* Mientras la convocatoria no abre, la fecha que le sirve al aspirante es la de
              apertura: la de cierre no le dice cuándo puede hacer algo. Después de abrir se
              invierte, y vuelve a importar solo el cierre. */}
          <span className="item">
            <IconoCalendario />
            {plazo.clase === 'proximo' ? (
              <span>
                Abre el <b>{formatearFecha(convocatoria.fechaApertura)}</b>
              </span>
            ) : (
              <span>
                Cierra el <b>{formatearFecha(convocatoria.fechaCierre)}</b>
              </span>
            )}
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
