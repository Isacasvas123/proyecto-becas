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
 */
import type { ReactElement } from 'react';

import { IconoCalendario, IconoCodigo, IconoCupos, IconoReloj } from './Iconos';
import type { Convocatoria } from '../api/cliente';
import { claseTipo, estadoPlazo, formatearFecha, inicialTipo, nombreTipo } from '../formato';

export function TarjetaConvocatoria({
  convocatoria,
}: {
  convocatoria: Convocatoria;
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
      </div>
    </li>
  );
}
