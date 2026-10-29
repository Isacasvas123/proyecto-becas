/**
 * US-013: cargar documentación (CU-07).
 *
 * Orden del flujo de excepción 3a: no puede quedar un requisito cumplido sin archivo detrás.
 * Se valida el archivo, se guarda con un nombre único (nunca sobre el anterior), se actualiza la
 * solicitud y solo entonces se borra el archivo anterior. Si falla la solicitud, se borra el
 * recién subido y el expediente queda como estaba.
 */
import { randomUUID } from 'node:crypto';

import { Inject, Injectable, Logger } from '@nestjs/common';

import {
  ALMACENAMIENTO_DOCUMENTOS,
  AlmacenamientoDocumentos,
} from '../../domain/ports/almacenamiento-documentos';
import {
  SOLICITUD_REPOSITORIO,
  SolicitudRepositorio,
} from '../../domain/ports/solicitud.repositorio';
import { ArchivoDocumento, DatosArchivo } from '../../domain/value-objects/archivo-documento.vo';
import { Solicitud } from '../../domain/entities/solicitud.entity';
import { SolicitudDto } from '../dto/solicitud.dto';
import { ExpedienteService } from './expediente.service';

@Injectable()
export class CargarDocumentoService {
  private readonly logger = new Logger(CargarDocumentoService.name);

  constructor(
    @Inject(SOLICITUD_REPOSITORIO)
    private readonly repositorio: SolicitudRepositorio,
    @Inject(ALMACENAMIENTO_DOCUMENTOS)
    private readonly almacenamiento: AlmacenamientoDocumentos,
    private readonly expediente: ExpedienteService,
  ) {}

  async ejecutar(
    estudianteId: string,
    solicitudId: string,
    tipo: string,
    datos: DatosArchivo,
    ahora: Date = new Date(),
  ): Promise<SolicitudDto> {
    const archivo = ArchivoDocumento.crear(datos);
    const solicitud = await this.expediente.cargarPropia(estudianteId, solicitudId);

    // Antes de subir nada: si la solicitud ya no es editable o no exige ese documento, se falla
    // aquí y no queda un archivo huérfano.
    const referencia = await this.almacenamiento.guardar(archivo.contenido, {
      carpeta: solicitud.id,
      // El tipo solo llega aquí si pasa la validación de la ruta (catálogo cerrado); el nombre
      // real del estudiante no se usa en la ruta del disco.
      nombre: `${tipo.toLowerCase()}-${randomUUID()}.${archivo.extension}`,
    });

    let reemplazado: { referencia: string } | null;
    try {
      reemplazado = solicitud.cargarDocumento(tipo, archivo, referencia, ahora).reemplazado;
      await this.repositorio.guardar(solicitud);
    } catch (error) {
      await this.almacenamiento.eliminar(referencia);
      throw error;
    }

    if (reemplazado !== null) {
      // Si falla el borrado queda un archivo huérfano, pero el expediente está correcto. Se
      // registra para limpiarlo; no se le devuelve un error al estudiante por algo que no es suyo.
      await this.almacenamiento.eliminar(reemplazado.referencia).catch((error: unknown) => {
        this.logger.warn(
          `No se pudo borrar el archivo reemplazado ${reemplazado?.referencia}: ${String(error)}`,
        );
      });
    }

    this.logger.log(`Documento ${tipo} cargado en ${solicitud.numero}`);
    return this.expediente.presentar(solicitud);
  }

  /** Descarga del propio documento, para que el estudiante verifique lo que subió. */
  async descargar(estudianteId: string, solicitudId: string, tipo: string) {
    const solicitud = await this.expediente.cargarPropia(estudianteId, solicitudId);
    return leerDocumento(this.almacenamiento, solicitud, tipo);
  }
}

export interface ArchivoDescargable {
  readonly contenido: Buffer;
  readonly nombreArchivo: string;
  readonly tipoContenido: string;
}

/** Lee un documento cargado. Quién puede pedirlo lo decide quien llama. */
export async function leerDocumento(
  almacenamiento: AlmacenamientoDocumentos,
  solicitud: Solicitud,
  tipo: string,
): Promise<ArchivoDescargable | null> {
  const documento = solicitud.documento(tipo);
  if (documento === null) {
    return null;
  }
  return {
    contenido: await almacenamiento.obtener(documento.referencia),
    nombreArchivo: documento.nombreArchivo,
    tipoContenido: documento.tipoContenido,
  };
}
