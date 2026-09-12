/**
 * CAPA: application/services/  ·  PLANTILLA DE REFERENCIA DEL PROYECTO
 * ────────────────────────────────────────────────────────────────────────────────
 * QUÉ VA AQUÍ
 *   UN caso de uso, UN servicio (SOLID · S). Este servicio orquesta: pide datos por el
 *   puerto, aplica la regla del dominio y traduce el resultado al DTO de salida.
 *
 * QUÉ NO VA AQUÍ
 *   Nada de SQL ni de Prisma (eso es infrastructure/) y nada de HTTP: ni códigos de
 *   estado, ni `Request`, ni `Response` (eso es presentation/). Este servicio se debe
 *   poder invocar igual desde un controlador REST, desde una tarea programada o desde un
 *   generador de reportes, sin cambiarle una línea.
 *
 * LA PIEZA IMPORTANTE — INVERSIÓN DE DEPENDENCIAS (SOLID · D)
 *   El constructor NO recibe `ConvocatoriaRepositorioPrisma`. Recibe la INTERFAZ
 *   `ConvocatoriaRepositorio`, declarada en domain/ports/. NestJS resuelve cuál
 *   implementación inyectar gracias al token `CONVOCATORIA_REPOSITORIO`, que se enlaza en
 *   `convocatorias.module.ts`.
 *
 *   Consecuencia práctica y verificable: la prueba unitaria de este servicio le inyecta un
 *   repositorio en memoria y corre en milisegundos, sin Docker y sin Postgres.
 *   Ver `listar-convocatorias-publicadas.service.spec.ts`.
 *
 * ALCANCE (Sprint 1 · US-S1-08)
 *   Solo lectura. Crear, publicar, cerrar y editar convocatorias son SPRINT 3
 *   (US-006 a US-010), y cada una será SU PROPIO servicio en esta misma carpeta:
 *   `CrearConvocatoriaService`, `PublicarConvocatoriaService`, etc.
 *   No conviertan este archivo en un `ConvocatoriasService` que lo haga todo: eso es
 *   exactamente la clase-Dios que docs/06-patrones.md descarta.
 */
import { Inject, Injectable, Logger } from '@nestjs/common';

import {
  CONVOCATORIA_REPOSITORIO,
  ConvocatoriaRepositorio,
} from '../../domain/ports/convocatoria.repositorio';
import { ConvocatoriaListadaDto } from '../dto/convocatoria-listada.dto';
import { aConvocatoriaListadaDto } from '../mappers/convocatoria.mapper';

@Injectable()
export class ListarConvocatoriasPublicadasService {
  private readonly logger = new Logger(ListarConvocatoriasPublicadasService.name);

  constructor(
    @Inject(CONVOCATORIA_REPOSITORIO)
    private readonly repositorio: ConvocatoriaRepositorio,
  ) {}

  /**
   * Caso de uso: listar las convocatorias visibles para el público (US-008).
   *
   * `ahora` es un parámetro con valor por defecto en lugar de una llamada a `new Date()`
   * enterrada en la lógica: así el caso de uso es determinista y se puede probar en
   * cualquier fecha sin trucos con relojes falsos.
   */
  async ejecutar(ahora: Date = new Date()): Promise<ConvocatoriaListadaDto[]> {
    const convocatorias = await this.repositorio.buscarPublicadasVigentes(ahora);

    // Doble comprobación deliberada: el repositorio filtra en la base de datos por
    // rendimiento (NFR: menos de 1 segundo), pero la definición de "visible al público"
    // es del DOMINIO. Si un adaptador nuevo se equivoca en su consulta, la entidad lo
    // corrige aquí. La regla vive en un solo sitio; el filtro en SQL es una optimización.
    const visibles = convocatorias.filter((convocatoria) =>
      convocatoria.esVisiblePublicamente(ahora),
    );

    if (visibles.length !== convocatorias.length) {
      this.logger.warn(
        `El repositorio devolvió ${convocatorias.length - visibles.length} convocatoria(s) ` +
          'que no son visibles públicamente. Revisar el adaptador de persistencia.',
      );
    }

    // Mismo criterio que el filtro de arriba, por la misma razón. El orden por cierre más
    // próximo es parte del CONTRATO del caso de uso —el estudiante debe ver primero lo que
    // se le vence antes—, así que lo garantiza el caso de uso. Que los dos adaptadores
    // actuales ya ordenen (`ORDER BY fechaCierre` en Prisma, `.sort()` en el de memoria) es
    // una optimización suya, no la garantía: un tercer adaptador que no ordenara rompería
    // el contrato sin que ninguna prueba del servicio lo notara.
    //
    // Señalado por Fernando en la revisión del PR #1: la prueba de ordenamiento estaba
    // verificando el doble de prueba, no el servicio.
    const ordenadas = [...visibles].sort(
      (a, b) => a.periodo.cierre.getTime() - b.periodo.cierre.getTime(),
    );

    return ordenadas.map(aConvocatoriaListadaDto);
  }
}
