/**
 * CAPA: infrastructure/adapters/  ·  PATRÓN ADAPTER (estructural)
 * ────────────────────────────────────────────────────────────────────────────────
 * Implementa el puerto `HasherPassword` con bcrypt. Es la única clase del proyecto que
 * conoce la biblioteca de hashing; sustituirla por argon2 sería escribir otro adaptador
 * y cambiar una línea en `usuarios.module.ts`.
 *
 * POR QUÉ `bcryptjs` Y NO `bcrypt`
 *   `bcrypt` es un módulo nativo que se compila al instalar. En un equipo de cuatro
 *   personas con máquinas distintas, una compilación fallida bloquea a alguien un día
 *   entero. `bcryptjs` implementa el MISMO algoritmo en JavaScript puro: cumple igual el
 *   NFR de seguridad ("las contraseñas deben almacenarse con hash bcrypt") y se instala
 *   sin compilar nada. El costo es que es más lento, lo cual aquí es irrelevante: bcrypt
 *   es lento a propósito.
 *
 * LAS RONDAS SON CONFIGURABLES
 *   Se leen de `BCRYPT_ROUNDS` (.env.example). Subirlas endurece el hash sin tocar
 *   código, que es justo lo que pide una política de seguridad que puede cambiar.
 */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { compare, hash } from 'bcryptjs';

import { HasherPassword } from '../../domain/ports/hasher-password';

const RONDAS_POR_DEFECTO = 10;

@Injectable()
export class BcryptHasherAdapter implements HasherPassword {
  private readonly logger = new Logger(BcryptHasherAdapter.name);
  private readonly rondas: number;

  constructor(config: ConfigService) {
    const configuradas = Number(config.get<string>('BCRYPT_ROUNDS'));

    // Un valor inválido en el .env no debe degradar la seguridad en silencio.
    if (!Number.isInteger(configuradas) || configuradas < 4 || configuradas > 15) {
      this.rondas = RONDAS_POR_DEFECTO;
    } else {
      this.rondas = configuradas;
    }
  }

  /**
   * `compare` de bcrypt hace comparación en tiempo constante: no revela información por
   * el tiempo que tarda en responder.
   *
   * Un hash almacenado con formato corrupto haría lanzar a la biblioteca; se captura y se
   * devuelve `false` para que el resultado sea el mismo fallo genérico de autenticación
   * y no un error 500 que delate el estado interno.
   */
  async verificar(passwordEnClaro: string, hashAlmacenado: string): Promise<boolean> {
    try {
      return await compare(passwordEnClaro, hashAlmacenado);
    } catch (error) {
      this.logger.error(`Hash almacenado con formato inválido: ${String(error)}`);
      return false;
    }
  }

  async calcular(passwordEnClaro: string): Promise<string> {
    return hash(passwordEnClaro, this.rondas);
  }
}
