/**
 * CAPA: application/services/
 * ────────────────────────────────────────────────────────────────────────────────
 * US-001 — Registro de estudiante. Criterios de aceptación, y dónde se cumple cada uno:
 *
 *   1. CUI de 13 dígitos y único ...................... `Cui.crear` + `buscarDuplicados`
 *   2. Contraseña de 8+, con mayúscula y número ....... `validarPoliticaContrasena`
 *   3. Guardada con hash bcrypt, nunca en claro ...... `HasherPassword` (patrón Adapter)
 *   4. Error claro y específico si correo o CUI existen `RecursoDuplicadoError` → 409
 *   5. Queda autenticado y va a su panel .............. devuelve la sesión ya iniciada
 *
 * SOBRE EL CRITERIO 4 Y LA ENUMERACIÓN DE CUENTAS
 *   Decir "ya existe una cuenta con ese correo" permite averiguar si alguien está registrado,
 *   que es justo lo que el inicio de sesión evita con su mensaje genérico. Aquí se hace igual
 *   porque el criterio lo pide textualmente, y la persona necesita saber qué corregir. La
 *   diferencia está razonada en el detalle de CU-03 (docs/diagramas/01-casos-de-uso.md). La
 *   mitigación estándar —limitar intentos por dirección IP— queda anotada como mejora.
 */
import { randomUUID } from 'node:crypto';

import { Inject, Injectable, Logger } from '@nestjs/common';

import { RecursoDuplicadoError } from '../../../../shared/exceptions/errores-dominio';
import { normalizarCorreo, Usuario } from '../../domain/entities/usuario.entity';
import { GENERADOR_TOKEN, GeneradorToken } from '../../domain/ports/generador-token';
import { HASHER_PASSWORD, HasherPassword } from '../../domain/ports/hasher-password';
import { USUARIO_REPOSITORIO, UsuarioRepositorio } from '../../domain/ports/usuario.repositorio';
import { Cui } from '../../domain/value-objects/cui.vo';
import { NombreUsuario } from '../../domain/value-objects/nombre-usuario.vo';
import { validarPoliticaContrasena } from '../../domain/value-objects/politica-contrasena';
import { SesionIniciadaDto } from '../dto/sesion-iniciada.dto';
import { aSesionIniciada } from '../mappers/sesion.mapper';

export interface ComandoRegistrarEstudiante {
  readonly nombreCompleto: string;
  readonly cui: string;
  readonly correo: string;
  readonly nombreUsuario: string;
  readonly password: string;
}

@Injectable()
export class RegistrarEstudianteService {
  private readonly logger = new Logger(RegistrarEstudianteService.name);

  constructor(
    @Inject(USUARIO_REPOSITORIO)
    private readonly repositorio: UsuarioRepositorio,
    @Inject(HASHER_PASSWORD)
    private readonly hasher: HasherPassword,
    @Inject(GENERADOR_TOKEN)
    private readonly generadorToken: GeneradorToken,
  ) {}

  async ejecutar(comando: ComandoRegistrarEstudiante): Promise<SesionIniciadaDto> {
    // Primero todo lo que se puede validar sin tocar la base: formato del CUI, del nombre de
    // usuario y política de contraseña. Un error aquí no cuesta ninguna consulta.
    const cui = Cui.crear(comando.cui);
    const nombreUsuario = NombreUsuario.crear(comando.nombreUsuario);
    const correo = normalizarCorreo(comando.correo);
    validarPoliticaContrasena(comando.password);

    const duplicados = await this.repositorio.buscarDuplicados({ correo, cui, nombreUsuario });
    const problemas = [
      duplicados.cui && 'ese CUI',
      duplicados.correo && 'ese correo',
      duplicados.nombreUsuario && 'ese nombre de usuario',
    ].filter((p): p is string => typeof p === 'string');

    if (problemas.length > 0) {
      throw new RecursoDuplicadoError(`Ya existe una cuenta con ${enumerar(problemas)}.`);
    }

    // El hash se calcula DESPUÉS de comprobar duplicados: bcrypt es lento a propósito y no
    // tiene sentido gastarlo en un registro que se va a rechazar.
    const usuario = Usuario.nuevoEstudiante({
      id: randomUUID(),
      nombreUsuario,
      correo,
      hashPassword: await this.hasher.calcular(comando.password),
      nombreCompleto: comando.nombreCompleto,
      cui,
    });

    await this.repositorio.crear(usuario);
    this.logger.log(`Estudiante registrado: ${usuario.nombreUsuario.valor}`);

    // Criterio 5: la persona queda autenticada sin tener que volver a escribir su contraseña.
    return aSesionIniciada(usuario, await this.generadorToken.emitir(usuario));
  }
}

/** "a", "a y b", "a, b y c". */
function enumerar(partes: string[]): string {
  return partes.length <= 1
    ? partes.join('')
    : `${partes.slice(0, -1).join(', ')} y ${partes[partes.length - 1]}`;
}
