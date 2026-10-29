/**
 * US-025: ¿el CUI que escribió alguien corresponde a esta cuenta?
 *
 * Solo responde sí o no. Nunca devuelve el CUI ni dice por qué no coincide: la consulta pública
 * la usa quien no tiene sesión y cualquier detalle extra ayudaría a adivinar datos ajenos.
 */
import { Inject, Injectable } from '@nestjs/common';

import { ReglaDeNegocioError } from '../../../../shared/exceptions/errores-dominio';
import { USUARIO_REPOSITORIO, UsuarioRepositorio } from '../../domain/ports/usuario.repositorio';
import { Cui } from '../../domain/value-objects/cui.vo';

@Injectable()
export class IdentidadService {
  constructor(
    @Inject(USUARIO_REPOSITORIO)
    private readonly repositorio: UsuarioRepositorio,
  ) {}

  async cuiCoincide(usuarioId: string, cuiEscrito: string): Promise<boolean> {
    let cui: Cui;
    try {
      cui = Cui.crear(cuiEscrito);
    } catch (error) {
      if (error instanceof ReglaDeNegocioError) return false;
      throw error;
    }
    const [usuario] = await this.repositorio.buscarPorIds([usuarioId]);
    return usuario?.cui?.equals(cui) ?? false;
  }
}
