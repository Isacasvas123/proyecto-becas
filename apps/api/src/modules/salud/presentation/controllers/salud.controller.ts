/**
 * Endpoints de diagnóstico.
 *
 * Este módulo no tiene las cuatro capas porque no tiene negocio: "¿está viva la API?" es una
 * pregunta técnica, y inventarle una entidad y un puerto sería ceremonia vacía. La plantilla de
 * capas es el módulo `convocatorias`.
 *
 * Son dos rutas porque responden preguntas distintas (S1-12). La versión anterior contestaba
 * siempre `ok`, aunque PostgreSQL estuviera caído:
 *
 *   GET /health   ¿el proceso está vivo?       si falla, hay que reiniciarlo
 *   GET /ready    ¿puede atender peticiones?   si falla, hay que dejar de enviarle tráfico
 *
 * Reiniciar no arreglaría un problema que está fuera del proceso.
 */
import { Controller, Get, HttpCode, HttpException, HttpStatus, Logger } from '@nestjs/common';

import { PrismaService } from '../../../../shared/persistence/prisma.service';
import { Publico } from '../../../usuarios/presentation/guards/decoradores';

export interface RespuestaSalud {
  status: 'ok';
  timestamp: string;
}

export interface RespuestaListo {
  status: 'listo';
  timestamp: string;
  dependencias: { baseDatos: 'arriba' };
}

/**
 * 503 con el detalle de qué dependencia falló.
 *
 * No hereda de `ErrorDeDominio` a propósito: no viola ninguna regla de negocio, es un fallo
 * de infraestructura. Por eso tampoco pasa por `DominioExceptionFilter`.
 */
class ServicioNoDisponibleError extends HttpException {
  constructor() {
    super(
      {
        status: 'no_listo',
        timestamp: new Date().toISOString(),
        dependencias: { baseDatos: 'abajo' },
      },
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}

// Los dos diagnósticos son públicos por necesidad operativa: el orquestador y el pipeline
// de CI los consultan sin credenciales. No exponen ningún dato del negocio.
@Publico()
@Controller()
export class SaludController {
  private readonly logger = new Logger(SaludController.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Liveness — ¿el proceso responde?
   *
   * No consulta nada externo, a propósito. Si esto falla es que el proceso está colgado o
   * muerto, y la única solución es reiniciarlo. Consultar la base de datos aquí haría que un
   * fallo de PostgreSQL reiniciara la API en bucle sin arreglar nada.
   */
  @Get('health')
  @HttpCode(HttpStatus.OK)
  verificar(): RespuestaSalud {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Readiness: consulta la base con `SELECT 1`. Si falla responde 503 y no un 200 con "no_listo",
   * porque los orquestadores se guían por el código HTTP y no por el cuerpo.
   */
  @Get('ready')
  async estaListo(): Promise<RespuestaListo> {
    if (!(await this.baseDatosResponde())) {
      throw new ServicioNoDisponibleError();
    }

    return {
      status: 'listo',
      timestamp: new Date().toISOString(),
      dependencias: { baseDatos: 'arriba' },
    };
  }

  private async baseDatosResponde(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      this.logger.error(`La base de datos no responde: ${String(error)}`);
      return false;
    }
  }
}
