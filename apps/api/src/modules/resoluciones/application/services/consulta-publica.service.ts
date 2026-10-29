/**
 * US-025: consulta pública del estado, sin sesión.
 *
 * 1. Sin autenticación: `@Publico()` en el controlador.
 * 2. Solo estado y fecha del último cambio: el DTO no tiene otro campo.
 * 3. Mensaje genérico: el mismo error para "no existe ese número" y "el CUI no es de esa
 *    solicitud".
 *
 * Los números de solicitud son correlativos y se pueden adivinar, por eso no basta el número: hace
 * falta el CUI del titular, y un intento fallido no dice cuál de los dos estaba mal. Además se
 * limita la cantidad de consultas por dirección.
 */
import { Inject, Injectable } from '@nestjs/common';

import { RecursoNoEncontradoError } from '../../../../shared/exceptions/errores-dominio';
import {
  CONSULTA_IDENTIDAD,
  CONSULTA_SOLICITUDES_RESOLUCION,
  ConsultaIdentidad,
  ConsultaSolicitudesResolucion,
} from '../../domain/ports/consultas-externas';

export const MENSAJE_CONSULTA_SIN_RESULTADO =
  'No encontramos una solicitud con ese número y ese CUI. Revise los dos datos e intente de nuevo.';

export interface EstadoPublicoDto {
  readonly numero: string;
  readonly estado: string;
  readonly ultimoCambio: string;
}

/** Un id que no existe: se usa para que un número inexistente cueste lo mismo que uno real. */
const ID_INEXISTENTE = '00000000-0000-4000-8000-000000000000';

@Injectable()
export class ConsultaPublicaService {
  constructor(
    @Inject(CONSULTA_SOLICITUDES_RESOLUCION)
    private readonly solicitudes: ConsultaSolicitudesResolucion,
    @Inject(CONSULTA_IDENTIDAD)
    private readonly identidad: ConsultaIdentidad,
  ) {}

  async consultar(numero: string, cui: string): Promise<EstadoPublicoDto> {
    const solicitud = await this.solicitudes.buscarPorNumero(numero.trim().toUpperCase());
    // Siempre se consulta la identidad, exista o no el número: así el tiempo de respuesta no delata
    // si el número existe.
    const coincide = await this.identidad.cuiCoincide(
      solicitud?.estudianteId ?? ID_INEXISTENTE,
      cui,
    );

    if (solicitud === null || !coincide) {
      throw new RecursoNoEncontradoError(MENSAJE_CONSULTA_SIN_RESULTADO);
    }

    return {
      numero: solicitud.numero,
      estado: solicitud.estado,
      ultimoCambio: solicitud.ultimoCambio,
    };
  }
}
