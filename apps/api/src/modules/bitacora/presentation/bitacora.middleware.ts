/**
 * Escribe la bitácora (pedida por el Product Owner el 17 de octubre).
 *
 * Va aquí y no en cada caso de uso porque auditar es transversal: repetirlo en treinta servicios
 * lo mezclaría con las reglas de negocio, y bastaría olvidarlo en un endpoint nuevo para perder
 * el registro sin que nadie lo note.
 *
 * Es middleware y no interceptor porque en NestJS los guards corren antes que los interceptores,
 * y los 403 del control de acceso nunca se registraban. El middleware se engancha al evento
 * `finish` de la respuesta, cuando el código de estado ya es el definitivo.
 *
 * Registra lo que cambia algo (POST, PUT, PATCH, DELETE) y las consultas a la propia bitácora.
 * Las demás lecturas llenarían la tabla de ruido. Nunca guarda el cuerpo de la petición, donde
 * viajan contraseñas, CUI y datos de los aspirantes: solo qué se hizo y sobre qué identificador.
 */
import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

import { RolUsuario } from '../../usuarios/domain/enums/rol-usuario.enum';
import { BitacoraService } from '../application/services/bitacora.service';
import { RegistroBitacora } from '../domain/entities/registro-bitacora.entity';

const METODOS_QUE_CAMBIAN = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/** Lecturas que sí se auditan, por lo que revelan. */
const RUTAS_SENSIBLES = [/^\/bitacora/];

/** Identificadores dentro de la ruta: se reemplazan para que `accion` agrupe en vez de dispersar. */
const IDENTIFICADOR = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

interface PeticionConPortador extends Request {
  portador?: { usuarioId: string; nombreUsuario: string; rol: RolUsuario };
}

@Injectable()
export class BitacoraMiddleware implements NestMiddleware {
  constructor(private readonly bitacora: BitacoraService) {}

  use(peticion: PeticionConPortador, respuesta: Response, siguiente: NextFunction): void {
    const ruta = (peticion.originalUrl ?? peticion.url ?? '').split('?')[0];

    if (this.seAudita(peticion.method, ruta)) {
      // `finish`: la respuesta ya se envió, así que el código es el definitivo y el guard ya
      // dejó el portador. Se lee aquí y no antes, cuando todavía no existe.
      respuesta.once('finish', () => {
        void this.bitacora.registrar(
          new RegistroBitacora({
            actor: {
              id: peticion.portador?.usuarioId ?? null,
              nombreUsuario: peticion.portador?.nombreUsuario ?? null,
              rol: peticion.portador?.rol ?? null,
            },
            accion: `${peticion.method} ${ruta.replace(IDENTIFICADOR, ':id')}`,
            entidad: ruta.split('/').filter(Boolean)[0] ?? null,
            entidadId: ruta.match(IDENTIFICADOR)?.[0] ?? null,
            resultado: respuesta.statusCode,
            origen: peticion.ip ?? null,
            ocurridoEn: new Date(),
          }),
        );
      });
    }

    siguiente();
  }

  private seAudita(metodo: string, ruta: string): boolean {
    if (METODOS_QUE_CAMBIAN.has(metodo)) return true;
    return RUTAS_SENSIBLES.some((patron) => patron.test(ruta));
  }
}
