/**
 * Endpoint de diagnóstico: `GET /health`.
 *
 * POR QUÉ ESTE MÓDULO NO TIENE LAS CUATRO CAPAS
 *   Porque no tiene negocio. "¿Está viva la API?" no es una regla del Ministerio: es una
 *   pregunta técnica sobre el proceso. Inventarle una entidad `Salud` y un puerto sería
 *   ceremonia vacía, y la arquitectura no se aplica por ritual sino donde resuelve algo.
 *
 *   La plantilla de las cuatro capas que deben copiar es el módulo `convocatorias`.
 *
 * Lo consumen: el `docker-compose`/orquestador, el pipeline de CI y la pantalla de inicio
 * del frontend, para comprobar de un vistazo que la API responde.
 */
import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';

export interface RespuestaSalud {
  status: 'ok';
  timestamp: string;
}

@Controller('health')
export class SaludController {
  @Get()
  @HttpCode(HttpStatus.OK)
  verificar(): RespuestaSalud {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
