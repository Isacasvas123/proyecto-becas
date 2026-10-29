/**
 * Módulo `convocatorias`: aquí se atan las cuatro capas.
 *
 * Es el único punto del módulo donde dominio e infraestructura se mencionan juntos (la raíz de
 * composición). El resto no sabe qué implementación usa. La línea clave es el enlace:
 *
 *     provide:  CONVOCATORIA_REPOSITORIO       el token del puerto (domain/)
 *     useClass: ConvocatoriaPrismaRepositorio  el adaptador concreto (infrastructure/)
 *
 * Es la inversión de dependencias (SOLID · D) hecha código: cambiar PostgreSQL por otra cosa, o
 * por un doble en una prueba e2e, es cambiar esa línea. Los demás módulos siguen esta estructura.
 */
import { Module } from '@nestjs/common';

import { ConsultarConvocatoriaService } from './application/services/consultar-convocatoria.service';
import { CrearConvocatoriaService } from './application/services/crear-convocatoria.service';
import { ListarConvocatoriasGestionService } from './application/services/listar-convocatorias-gestion.service';
import { ListarConvocatoriasPublicadasService } from './application/services/listar-convocatorias-publicadas.service';
import { ObtenerCatalogoConvocatoriasService } from './application/services/obtener-catalogo-convocatorias.service';
import { PublicarConvocatoriaService } from './application/services/publicar-convocatoria.service';
import { CONVOCATORIA_REPOSITORIO } from './domain/ports/convocatoria.repositorio';
import { ConvocatoriaPrismaRepositorio } from './infrastructure/persistence/convocatoria-prisma.repositorio';
import { ConvocatoriasController } from './presentation/controllers/convocatorias.controller';

@Module({
  controllers: [ConvocatoriasController],
  providers: [
    ListarConvocatoriasPublicadasService,
    ListarConvocatoriasGestionService,
    CrearConvocatoriaService,
    PublicarConvocatoriaService,
    ObtenerCatalogoConvocatoriasService,
    ConsultarConvocatoriaService,
    {
      provide: CONVOCATORIA_REPOSITORIO,
      useClass: ConvocatoriaPrismaRepositorio,
    },
  ],
  // Se exporta el caso de uso, no el repositorio. Si otro módulo necesita convocatorias,
  // pasa por la capa de aplicación; nunca por el repositorio ni por las entidades de este
  // módulo. Es la mitigación del riesgo nº4 de docs/05-arquitectura.md §2.2
  // ("monolito distribuido interno") y se verifica en el code review.
  exports: [ListarConvocatoriasPublicadasService, ConsultarConvocatoriaService],
})
export class ConvocatoriasModule {}
