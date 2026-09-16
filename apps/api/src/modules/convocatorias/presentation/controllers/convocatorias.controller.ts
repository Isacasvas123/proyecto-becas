import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';

import {
  CatalogoConvocatoriasDto,
  ObtenerCatalogoConvocatoriasService,
} from '../../application/services/obtener-catalogo-convocatorias.service';
import { CrearConvocatoriaService } from '../../application/services/crear-convocatoria.service';
import { ListarConvocatoriasGestionService } from '../../application/services/listar-convocatorias-gestion.service';
import { ListarConvocatoriasPublicadasService } from '../../application/services/listar-convocatorias-publicadas.service';
import { PublicarConvocatoriaService } from '../../application/services/publicar-convocatoria.service';
import { ConvocatoriaResponseDto } from '../dto/convocatoria-response.dto';
import { CrearConvocatoriaRequestDto } from '../dto/crear-convocatoria-request.dto';
import { RolUsuario } from '../../../usuarios/domain/enums/rol-usuario.enum';
import { Publico, Roles } from '../../../usuarios/presentation/guards/decoradores';

@Controller('convocatorias')
export class ConvocatoriasController {
  // El controlador depende de los CASOS DE USO, nunca del repositorio ni de Prisma. Uno por
  // operación: si se juntaran en un `ConvocatoriasService`, sería la clase-Dios que
  // docs/06-patrones.md descarta.
  constructor(
    private readonly listarPublicadas: ListarConvocatoriasPublicadasService,
    private readonly listarGestion: ListarConvocatoriasGestionService,
    private readonly crearConvocatoria: CrearConvocatoriaService,
    private readonly publicarConvocatoria: PublicarConvocatoriaService,
    private readonly obtenerCatalogo: ObtenerCatalogoConvocatoriasService,
  ) {}

  /**
   * GET /convocatorias — listado público de convocatorias vigentes (US-008).
   *
   * ⚠️ PÚBLICA A PROPÓSITO. US-008 dice textualmente: "Como VISITANTE, quiero ver las
   * convocatorias vigentes... SIN NECESIDAD DE TENER CUENTA". Es la necesidad de Ana, la
   * aspirante de provincia (docs/03-vision-producto.md), y un requisito de transparencia del
   * enunciado. Es la ÚNICA ruta de este controlador sin rol.
   */
  @Publico()
  @Get()
  @HttpCode(HttpStatus.OK)
  async listar(): Promise<ConvocatoriaResponseDto[]> {
    return this.listarPublicadas.ejecutar();
  }

  /** GET /convocatorias/gestion — todas, incluidos borradores. Solo administración. */
  @Roles(RolUsuario.ADMINISTRADOR)
  @Get('gestion')
  async listarParaGestion(): Promise<ConvocatoriaResponseDto[]> {
    return this.listarGestion.ejecutar();
  }

  /**
   * GET /convocatorias/catalogo — requisitos, documentos y valores por defecto de cada tipo.
   * Lo consume el formulario de creación. Solo administración.
   */
  @Roles(RolUsuario.ADMINISTRADOR)
  @Get('catalogo')
  catalogo(): CatalogoConvocatoriasDto {
    return this.obtenerCatalogo.ejecutar();
  }

  /** POST /convocatorias — US-006. Nace siempre en BORRADOR. */
  @Roles(RolUsuario.ADMINISTRADOR)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async crear(@Body() peticion: CrearConvocatoriaRequestDto): Promise<ConvocatoriaResponseDto> {
    return this.crearConvocatoria.ejecutar(peticion);
  }

  /**
   * POST /convocatorias/:id/publicar — US-007.
   *
   * POST y no PATCH con `{ estado: 'PUBLICADA' }`: publicar no es "cambiar un campo", es una
   * operación del negocio con reglas propias. Exponer el estado como campo editable invitaría
   * a saltarse esas reglas mandando cualquier otro valor.
   *
   * `ParseUUIDPipe` rechaza con 400 un id mal formado antes de consultar la base.
   */
  @Roles(RolUsuario.ADMINISTRADOR)
  @Post(':id/publicar')
  @HttpCode(HttpStatus.OK)
  async publicar(@Param('id', ParseUUIDPipe) id: string): Promise<ConvocatoriaResponseDto> {
    return this.publicarConvocatoria.ejecutar(id);
  }
}
