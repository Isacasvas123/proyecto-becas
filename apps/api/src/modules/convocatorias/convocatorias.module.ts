/**
 * MÓDULO `convocatorias` — aquí se ATAN las cuatro capas.
 * ────────────────────────────────────────────────────────────────────────────────
 * Este archivo es el único punto del módulo donde el dominio y la infraestructura se
 * mencionan juntos, y ocurre a propósito: es la "raíz de composición". El resto del
 * código no sabe qué implementación concreta está usando.
 *
 * LA LÍNEA QUE HAY QUE ENTENDER es el `provide` / `useClass` de abajo:
 *
 *     provide:  CONVOCATORIA_REPOSITORIO   ← el token del PUERTO (domain/)
 *     useClass: ConvocatoriaPrismaRepositorio ← el ADAPTADOR concreto (infrastructure/)
 *
 * Ese enlace es la inversión de dependencias hecha código (SOLID · D). Cambiar de
 * PostgreSQL a otra cosa —o a un doble de prueba en un test e2e— es cambiar esa única
 * línea. Ningún servicio, ningún controlador y ninguna entidad se enteran.
 *
 * PLANTILLA: copien esta estructura tal cual para `usuarios`, `estudiantes`,
 * `solicitudes`, `evaluaciones` y `reportes`.
 */
import { Module } from '@nestjs/common';

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
    {
      provide: CONVOCATORIA_REPOSITORIO,
      useClass: ConvocatoriaPrismaRepositorio,
    },
  ],
  // Se exporta el CASO DE USO, no el repositorio. Si otro módulo necesita convocatorias,
  // pasa por la capa de aplicación; nunca por el repositorio ni por las entidades de este
  // módulo. Es la mitigación del riesgo nº4 de docs/05-arquitectura.md §2.2
  // ("monolito distribuido interno") y se verifica en el code review.
  exports: [ListarConvocatoriasPublicadasService],
})
export class ConvocatoriasModule {}
