/**
 * CAPA: presentation/
 * ────────────────────────────────────────────────────────────────────────────────
 * Escribe la bitácora. Exigida por el Product Owner el 17 de octubre de 2026.
 *
 * POR QUÉ AQUÍ Y NO EN CADA CASO DE USO
 *   Auditar es un asunto TRANSVERSAL: no pertenece a "publicar una convocatoria" ni a "emitir un
 *   dictamen", le ocurre a todas las operaciones por igual. Si cada servicio escribiera su propio
 *   asiento tendríamos la regla repetida en treinta sitios, mezclada con las reglas de negocio, y
 *   bastaría olvidarla al escribir un endpoint nuevo para que esa acción quedara sin registrar.
 *   Nadie lo notaría: una bitácora incompleta se ve igual que una completa.
 *
 * POR QUÉ MIDDLEWARE Y NO INTERCEPTOR
 *   La primera versión fue un interceptor, y la prueba de integración destapó el problema: en
 *   NestJS **los guards corren antes que los interceptores**, así que un 403 del control de
 *   acceso nunca llegaba a registrarse. Y un intento rechazado de entrar donde no se debe es
 *   justamente lo que una auditoría quiere ver.
 *
 *   El middleware corre antes que todo y se engancha al evento `finish` de la respuesta, que
 *   ocurre cuando ya está decidida. Para entonces el guard ya dejó el portador en la petición
 *   —si lo hubo— y el código de estado es el definitivo, venga de donde venga.
 *
 * QUÉ SE REGISTRA
 *   Lo que CAMBIA algo (POST, PUT, PATCH, DELETE) y las consultas a la propia bitácora. Las demás
 *   lecturas no: un `GET /convocatorias` por visitante llenaría la tabla de ruido y enterraría lo
 *   que importa.
 *
 * QUÉ NO SE REGISTRA NUNCA
 *   El cuerpo de la petición. Ahí viajan contraseñas, CUI y datos de los aspirantes. Se guarda
 *   qué se hizo y sobre qué identificador, no con qué datos.
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
