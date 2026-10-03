/**
 * CAPA: application/services/
 * ────────────────────────────────────────────────────────────────────────────────
 * Lo que tienen en común crear la cuenta de un estudiante (US-001) y la de un evaluador (US-017):
 * validar CUI, nombre de usuario y contraseña, comprobar duplicados diciendo cuál, y calcular el
 * hash. Existe para que las dos puertas apliquen EXACTAMENTE las mismas reglas: si una política
 * cambia, cambia para las dos.
 */
import { RecursoDuplicadoError } from '../../../../shared/exceptions/errores-dominio';
import { DatosNuevoEstudiante, normalizarCorreo } from '../../domain/entities/usuario.entity';
import { HasherPassword } from '../../domain/ports/hasher-password';
import { UsuarioRepositorio } from '../../domain/ports/usuario.repositorio';
import { Cui } from '../../domain/value-objects/cui.vo';
import { NombreUsuario } from '../../domain/value-objects/nombre-usuario.vo';
import { validarPoliticaContrasena } from '../../domain/value-objects/politica-contrasena';

export interface ComandoCuentaNueva {
  readonly nombreCompleto: string;
  readonly cui: string;
  readonly correo: string;
  readonly nombreUsuario: string;
  readonly password: string;
}

export async function prepararCuentaNueva(
  comando: ComandoCuentaNueva,
  id: string,
  repositorio: UsuarioRepositorio,
  hasher: HasherPassword,
): Promise<DatosNuevoEstudiante> {
  // Primero todo lo que se puede validar sin tocar la base: formato del CUI, del nombre de
  // usuario y política de contraseña. Un error aquí no cuesta ninguna consulta.
  const cui = Cui.crear(comando.cui);
  const nombreUsuario = NombreUsuario.crear(comando.nombreUsuario);
  const correo = normalizarCorreo(comando.correo);
  validarPoliticaContrasena(comando.password);

  const duplicados = await repositorio.buscarDuplicados({ correo, cui, nombreUsuario });
  const problemas = [
    duplicados.cui && 'ese CUI',
    duplicados.correo && 'ese correo',
    duplicados.nombreUsuario && 'ese nombre de usuario',
  ].filter((p): p is string => typeof p === 'string');

  if (problemas.length > 0) {
    throw new RecursoDuplicadoError(`Ya existe una cuenta con ${enumerar(problemas)}.`);
  }

  // El hash se calcula DESPUÉS de comprobar duplicados: bcrypt es lento a propósito y no tiene
  // sentido gastarlo en una cuenta que se va a rechazar.
  return {
    id,
    nombreUsuario,
    correo,
    hashPassword: await hasher.calcular(comando.password),
    nombreCompleto: comando.nombreCompleto,
    cui,
  };
}

/** "a", "a y b", "a, b y c". */
function enumerar(partes: string[]): string {
  return partes.length <= 1
    ? partes.join('')
    : `${partes.slice(0, -1).join(', ')} y ${partes[partes.length - 1]}`;
}
