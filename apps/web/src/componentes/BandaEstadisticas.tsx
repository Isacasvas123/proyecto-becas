/**
 * Banda de cifras del programa.
 *
 * Tomada de becas.segeplan.gob.gt, que abre con "17 convocatorias · 10 países ·
 * 12 áreas de estudio". Funciona porque responde de un vistazo la primera
 * pregunta de cualquier aspirante: *¿hay algo para mí ahora mismo?*
 *
 * IMPORTANTE — todas las cifras se calculan de los datos reales que devolvió la
 * API. Ninguna está escrita a mano. Un número inventado en un portal público es
 * una mentira institucional, y además dejaría de cuadrar en cuanto cambien los
 * datos.
 */
import type { ReactElement } from 'react';

import type { Convocatoria } from '../api/cliente';
import { diasRestantes } from '../formato';

export function BandaEstadisticas({
  convocatorias,
}: {
  convocatorias: Convocatoria[];
}): ReactElement {
  const vigentes = convocatorias.length;
  const cupos = convocatorias.reduce((suma, c) => suma + c.cupos, 0);
  const tipos = new Set(convocatorias.map((c) => c.tipo)).size;

  // Días que faltan para el cierre más próximo: es el dato accionable, el que
  // le dice al aspirante si tiene que moverse hoy o puede esperar.
  const proximos = convocatorias
    .map((c) => diasRestantes(c.fechaCierre))
    .filter((d) => d >= 0)
    .sort((a, b) => a - b);
  const proximoCierre = proximos.length > 0 ? proximos[0] : null;

  return (
    <section className="banda-datos" aria-label="Resumen del programa">
      <div className="interior">
        <div className="dato">
          <div className="cifra">{vigentes}</div>
          <div className="rotulo">Convocatorias vigentes</div>
        </div>

        <div className="dato">
          <div className="cifra">{cupos.toLocaleString('es-GT')}</div>
          <div className="rotulo">Cupos disponibles</div>
        </div>

        <div className="dato">
          <div className="cifra">{tipos}</div>
          <div className="rotulo">Tipos de beca</div>
        </div>

        <div className="dato">
          <div className="cifra">
            {proximoCierre === null ? '—' : proximoCierre}
            {proximoCierre !== null && (
              <span style={{ fontSize: 'var(--txt-base)', fontWeight: 600 }}> días</span>
            )}
          </div>
          <div className="rotulo">Para el próximo cierre</div>
        </div>
      </div>
    </section>
  );
}
