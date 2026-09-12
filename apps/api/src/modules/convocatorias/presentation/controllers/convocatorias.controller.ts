/**
 * CAPA: presentation/controllers/  ·  PLANTILLA DE REFERENCIA DEL PROYECTO
 * ────────────────────────────────────────────────────────────────────────────────
 * QUÉ VA AQUÍ
 *   La traducción entre HTTP y el caso de uso: leer la petición, validar la entrada,
 *   llamar al servicio de aplicación y devolver la respuesta.
 *
 * QUÉ NO VA AQUÍ
 *   Lógica de negocio. Ni un `if` sobre estados, ni un cálculo de fechas, ni una consulta.
 *   La prueba de fuego: si este método tuviera que reutilizarse desde una tarea programada
 *   —sin HTTP de por medio—, ¿habría que copiar algo de aquí? La respuesta debe ser no.
 *
 * FÍJENSE EN LO CORTO QUE ES
 *   Un controlador de este proyecto debe ser aburrido. Cuando alguno crezca, casi siempre
 *   significa que se le está filtrando lógica que pertenece a application/ o a domain/.
 *
 * ALCANCE (Sprint 1 · US-S1-08)
 *   Un solo endpoint de LECTURA. `POST`, `PATCH` y `DELETE` sobre convocatorias son
 *   SPRINT 3 (US-006, US-007, US-009, US-010) y llegarán con sus DTOs de entrada
 *   validados con `class-validator`.
 */
import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';

import { ListarConvocatoriasPublicadasService } from '../../application/services/listar-convocatorias-publicadas.service';
import { ConvocatoriaResponseDto } from '../dto/convocatoria-response.dto';
import { Publico } from '../../../usuarios/presentation/guards/decoradores';

@Controller('convocatorias')
export class ConvocatoriasController {
  // El controlador depende del CASO DE USO, nunca del repositorio ni de Prisma.
  constructor(private readonly listarPublicadas: ListarConvocatoriasPublicadasService) {}

  /**
   * GET /convocatorias — listado público de convocatorias vigentes.
   *
   * Sin autenticación: un visitante sin cuenta debe poder consultarlo (US-008).
   */
  // ⚠️ PÚBLICA A PROPÓSITO. US-008 dice textualmente: "Como VISITANTE, quiero ver las
  // convocatorias vigentes... SIN NECESIDAD DE TENER CUENTA". Es la necesidad de Ana, la
  // aspirante de provincia (docs/03-vision-producto.md), y un requisito de transparencia
  // del enunciado.
  //
  // En el Sprint 3, cuando exista el panel de administración (US-006, US-007, US-009), esas
  // rutas SÍ llevarán @Roles(ADMINISTRADOR). Lo que queda abierto es solo la consulta.
  @Publico()
  @Get()
  @HttpCode(HttpStatus.OK)
  async listar(): Promise<ConvocatoriaResponseDto[]> {
    return this.listarPublicadas.ejecutar();
  }
}
