/**
 * CAPA: application/services/
 * ────────────────────────────────────────────────────────────────────────────────
 * US-006 — Crear convocatoria.
 *
 * FÍJENSE EN LO QUE NO HAY AQUÍ
 *   Ni un `if (tipo === 'POSGRADO')`. El servicio no sabe qué requisitos lleva cada tipo de
 *   beca ni cuántos cupos admite: le pide la fábrica al registro y la fábrica lo resuelve.
 *   Es la razón de ser del Factory Method (docs/06-patrones.md §1). Si mañana el Ministerio
 *   agrega un programa de becas técnicas, este archivo no cambia.
 */
import { randomUUID } from 'node:crypto';

import { Inject, Injectable, Logger } from '@nestjs/common';

import { Requisito } from '../../domain/enums/requisito.enum';
import { TipoBeca } from '../../domain/enums/tipo-beca.enum';
import { TipoDocumento } from '../../domain/enums/tipo-documento.enum';
import { fabricaPara } from '../../domain/factories/convocatoria.factory';
import {
  CONVOCATORIA_REPOSITORIO,
  ConvocatoriaRepositorio,
} from '../../domain/ports/convocatoria.repositorio';
import { ConvocatoriaListadaDto } from '../dto/convocatoria-listada.dto';
import { aConvocatoriaListadaDto } from '../mappers/convocatoria.mapper';

export interface ComandoCrearConvocatoria {
  readonly tipo: TipoBeca;
  readonly titulo: string;
  readonly descripcion: string;
  readonly cupos: number;
  readonly montoBeca: number;
  readonly fechaApertura: Date;
  readonly fechaCierre: Date;
  readonly requisitos?: readonly Requisito[];
  readonly documentosExigidos?: readonly TipoDocumento[];
}

@Injectable()
export class CrearConvocatoriaService {
  private readonly logger = new Logger(CrearConvocatoriaService.name);

  constructor(
    @Inject(CONVOCATORIA_REPOSITORIO)
    private readonly repositorio: ConvocatoriaRepositorio,
  ) {}

  async ejecutar(comando: ComandoCrearConvocatoria): Promise<ConvocatoriaListadaDto> {
    const fabrica = fabricaPara(comando.tipo);

    // Código correlativo por tipo y año de apertura: UNIV-2027-001. Se usa el año de APERTURA
    // y no el de hoy: una beca 2027 creada en diciembre de 2026 pertenece al ciclo 2027.
    //
    // LIMITACIÓN CONOCIDA: dos creaciones simultáneas del mismo tipo podrían calcular el mismo
    // correlativo. La columna `codigo` es única, así que la base rechaza la segunda en vez de
    // duplicarla; el administrador vería un error y reintentaría. Para el volumen de un
    // ministerio —decenas de convocatorias al año— se acepta.
    const prefijo = `${fabrica.prefijoCodigo()}-${comando.fechaApertura.getUTCFullYear()}-`;
    const existentes = await this.repositorio.contarConPrefijoDeCodigo(prefijo);
    const codigo = `${prefijo}${String(existentes + 1).padStart(3, '0')}`;

    const convocatoria = fabrica.crear({
      id: randomUUID(),
      codigo,
      titulo: comando.titulo,
      descripcion: comando.descripcion,
      cupos: comando.cupos,
      montoBeca: comando.montoBeca,
      apertura: comando.fechaApertura,
      cierre: comando.fechaCierre,
      requisitos: comando.requisitos,
      documentosExigidos: comando.documentosExigidos,
    });

    await this.repositorio.guardar(convocatoria);
    this.logger.log(`Convocatoria creada en BORRADOR: ${codigo}`);

    return aConvocatoriaListadaDto(convocatoria);
  }
}
