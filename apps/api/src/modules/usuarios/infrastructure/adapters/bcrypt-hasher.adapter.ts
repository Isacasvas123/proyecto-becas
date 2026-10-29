/**
 * Implementa el puerto `HasherPassword` con bcrypt (patrón Adapter, estructural). Es la única
 * clase que conoce la biblioteca; pasar a argon2 sería otro adaptador y una línea en el módulo.
 *
 * Usa `bcryptjs` y no `bcrypt` porque este es un módulo nativo que se compila al instalar, y en un
 * equipo de cuatro con máquinas distintas una compilación fallida bloquea a alguien un día. Es el
 * mismo algoritmo en JavaScript puro y cumple el NFR de hash bcrypt; es más lento, lo que aquí
 * no importa porque bcrypt es lento a propósito.
 *
 * Las rondas se leen de `BCRYPT_ROUNDS`: subirlas endurece el hash sin tocar código.
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
   * `compare` de bcrypt compara en tiempo constante, sin revelar nada por lo que tarda. Un hash
   * guardado con formato corrupto haría lanzar a la biblioteca; se captura y se devuelve `false`
   * para que sea el mismo fallo genérico de autenticación y no un 500 que delate el estado
   * interno.
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
