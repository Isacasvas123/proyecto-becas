/**
 * Endpoints de diagnóstico.
 *
 * POR QUÉ ESTE MÓDULO NO TIENE LAS CUATRO CAPAS
 *   Porque no tiene negocio. "¿Está viva la API?" no es una regla del Ministerio: es una
 *   pregunta técnica sobre el proceso. Inventarle una entidad `Salud` y un puerto sería
 *   ceremonia vacía, y la arquitectura no se aplica por ritual sino donde resuelve algo.
 *
 *   La plantilla de las cuatro capas que deben copiar es el módulo `convocatorias`.
 *
 * ────────────────────────────────────────────────────────────────────────────────
 * DEFECTO CORREGIDO (tarea S1-12)
 *   La versión anterior respondía siempre `ok`, aunque PostgreSQL estuviera caído. Un
 *   diagnóstico que no puede fallar no diagnostica nada: en Staging el orquestador habría
 *   dado el servicio por sano mientras ninguna consulta funcionaba.
 *
 *   Se separan las dos preguntas, que son distintas y tienen consumidores distintos:
 *
 *     GET /health   ¿el proceso está vivo?       (liveness)
 *     GET /ready    ¿puede atender peticiones?   (readiness)
 *
 *   Es la distinción estándar de cualquier orquestador: si falla el primero hay que
 *   REINICIAR el proceso; si falla el segundo hay que DEJAR DE ENVIARLE tráfico, pero
 *   reiniciarlo no arreglaría nada porque el problema está fuera del proceso.
 */
import { Controller, Get, HttpCode, HttpException, HttpStatus, Logger } from '@nestjs/common';

import { PrismaService } from '../../../../shared/persistence/prisma.service';

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
   * Readiness — ¿puede atender peticiones de verdad?
   *
   * Consulta la base de datos con `SELECT 1`, la comprobación más barata posible.
   *
   * Si falla responde **503**, no un 200 con un cuerpo que diga "no_listo": el código HTTP
   * tiene que ser honesto, porque los orquestadores y el monitoreo se guían por él y no por
   * el texto de la respuesta.
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
