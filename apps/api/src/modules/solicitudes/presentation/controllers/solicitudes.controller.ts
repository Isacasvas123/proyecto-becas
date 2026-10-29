import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Res,
  UploadedFile,
  UseFilters,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';

import { SolicitudDto } from '../../application/dto/solicitud.dto';
import { CargarDocumentoService } from '../../application/services/cargar-documento.service';
import { CrearSolicitudService } from '../../application/services/crear-solicitud.service';
import { EnviarSolicitudService } from '../../application/services/enviar-solicitud.service';
import { ExpedienteService } from '../../application/services/expediente.service';
import { NotificacionesService } from '../../application/services/notificaciones.service';
import { TAMANO_MAXIMO_BYTES } from '../../domain/value-objects/archivo-documento.vo';
import { CrearSolicitudRequestDto } from '../dto/crear-solicitud-request.dto';
import { ArchivoDemasiadoGrandeFilter } from '../filtros/archivo-demasiado-grande.filter';
import { RolUsuario } from '../../../usuarios/domain/enums/rol-usuario.enum';
import { Roles, UsuarioActual } from '../../../usuarios/presentation/guards/decoradores';

/** Lo que `multer` entrega de un archivo subido. Se declara aquí para no depender de sus tipos. */
interface ArchivoSubido {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
}

/** El tipo de documento viaja en la URL: solo letras mayúsculas y guion bajo. */
const FORMATO_TIPO = /^[A-Z_]{2,40}$/;

/**
 * EPIC-03 · solicitudes del propio estudiante. El id del estudiante sale del token en cada ruta
 * (`@UsuarioActual`), así que no hay forma de pedir por las solicitudes de otra persona.
 */
/**
 * Bandeja de notificaciones del estudiante (US-022; PO, 17 Oct 2026). Cada quien ve solo las
 * suyas: el identificador sale del token, nunca de la URL.
 */
@Roles(RolUsuario.ESTUDIANTE)
@Controller('notificaciones')
export class NotificacionesController {
  constructor(private readonly notificaciones: NotificacionesService) {}

  @Get()
  mias(@UsuarioActual() estudianteId: string) {
    return this.notificaciones.mias(estudianteId);
  }

  @Put(':id/leida')
  @HttpCode(HttpStatus.NO_CONTENT)
  marcarLeida(
    @UsuarioActual() estudianteId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.notificaciones.marcarLeida(id, estudianteId);
  }

  @Put('leidas')
  @HttpCode(HttpStatus.OK)
  marcarTodas(@UsuarioActual() estudianteId: string) {
    return this.notificaciones.marcarTodasLeidas(estudianteId);
  }
}

@Roles(RolUsuario.ESTUDIANTE)
@Controller('solicitudes')
export class SolicitudesController {
  constructor(
    private readonly crear: CrearSolicitudService,
    private readonly expediente: ExpedienteService,
    private readonly documentos: CargarDocumentoService,
    private readonly envio: EnviarSolicitudService,
  ) {}

  /** US-012. */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  crearSolicitud(
    @UsuarioActual() estudianteId: string,
    @Body() peticion: CrearSolicitudRequestDto,
  ): Promise<SolicitudDto> {
    return this.crear.ejecutar(estudianteId, peticion.convocatoriaId);
  }

  /** US-015. */
  @Get()
  misSolicitudes(@UsuarioActual() estudianteId: string): Promise<SolicitudDto[]> {
    return this.expediente.deEstudiante(estudianteId);
  }

  /** US-012 (documentos faltantes) y US-016 (historial). */
  @Get(':id')
  detalle(
    @UsuarioActual() estudianteId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SolicitudDto> {
    return this.expediente.detalle(estudianteId, id);
  }

  /**
   * US-013. PUT porque carga O reemplaza el documento de ese tipo: repetir la petición deja el
   * mismo resultado. El archivo va en el campo `archivo` de un formulario multipart.
   *
   * `multer` corta en 5 MB + 1 byte: lo que pase de ahí no se termina de recibir. El dominio
   * vuelve a comprobar el tamaño exacto y el formato por contenido.
   */
  @Put(':id/documentos/:tipo')
  @UseFilters(ArchivoDemasiadoGrandeFilter)
  @UseInterceptors(FileInterceptor('archivo', { limits: { fileSize: TAMANO_MAXIMO_BYTES + 1 } }))
  cargarDocumento(
    @UsuarioActual() estudianteId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('tipo') tipo: string,
    @UploadedFile() archivo: ArchivoSubido | undefined,
  ): Promise<SolicitudDto> {
    if (!FORMATO_TIPO.test(tipo)) {
      throw new BadRequestException('Tipo de documento no válido');
    }
    if (archivo === undefined) {
      throw new BadRequestException('Adjunte el archivo en el campo "archivo"');
    }
    return this.documentos.ejecutar(estudianteId, id, tipo, {
      nombreOriginal: archivo.originalname,
      tipoContenido: archivo.mimetype,
      contenido: archivo.buffer,
    });
  }

  @Get(':id/documentos/:tipo')
  async descargarDocumento(
    @UsuarioActual() estudianteId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('tipo') tipo: string,
    @Res() respuesta: Response,
  ): Promise<void> {
    const archivo = FORMATO_TIPO.test(tipo)
      ? await this.documentos.descargar(estudianteId, id, tipo)
      : null;
    if (archivo === null) {
      throw new NotFoundException('Ese documento no está cargado');
    }
    respuesta
      .type(archivo.tipoContenido)
      // `inline` para verlo en el navegador; el nombre va codificado para no romper la cabecera.
      .setHeader(
        'Content-Disposition',
        `inline; filename*=UTF-8''${encodeURIComponent(archivo.nombreArchivo)}`,
      )
      .setHeader('X-Content-Type-Options', 'nosniff')
      .send(archivo.contenido);
  }

  /** US-014. */
  @Post(':id/enviar')
  @HttpCode(HttpStatus.OK)
  enviar(
    @UsuarioActual() estudianteId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SolicitudDto> {
    return this.envio.ejecutar(estudianteId, id);
  }
}
