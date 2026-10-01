/**
 * MÓDULO `usuarios` — raíz de composición del inicio de sesión.
 * ────────────────────────────────────────────────────────────────────────────────
 * Igual que `convocatorias.module.ts`, este es el único archivo del módulo donde el
 * dominio y la infraestructura se mencionan juntos. Aquí se atan los TRES puertos con
 * sus adaptadores concretos:
 *
 *     USUARIO_REPOSITORIO  →  UsuarioPrismaRepositorio   (PostgreSQL)
 *     HASHER_PASSWORD      →  BcryptHasherAdapter        (bcryptjs)
 *     GENERADOR_TOKEN      →  JwtGeneradorTokenAdapter   (JWT HS256)
 *
 * Cambiar bcrypt por argon2, o JWT por sesiones en servidor, es cambiar UNA línea de este
 * archivo. Ni el caso de uso ni el controlador ni la entidad se enteran: eso es la
 * inversión de dependencias haciendo su trabajo (SOLID · D).
 */
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';

import { AutenticarUsuarioService } from './application/services/autenticar-usuario.service';
import { RegistrarEstudianteService } from './application/services/registrar-estudiante.service';
import { GENERADOR_TOKEN } from './domain/ports/generador-token';
import { HASHER_PASSWORD } from './domain/ports/hasher-password';
import { USUARIO_REPOSITORIO } from './domain/ports/usuario.repositorio';
import { VERIFICADOR_TOKEN } from './domain/ports/verificador-token';
import { BcryptHasherAdapter } from './infrastructure/adapters/bcrypt-hasher.adapter';
import { JwtGeneradorTokenAdapter } from './infrastructure/adapters/jwt-generador-token.adapter';
import { JwtVerificadorTokenAdapter } from './infrastructure/adapters/jwt-verificador-token.adapter';
import { UsuarioPrismaRepositorio } from './infrastructure/persistence/usuario-prisma.repositorio';
import { AuthController } from './presentation/controllers/auth.controller';
import { AutenticacionGuard } from './presentation/guards/autenticacion.guard';
import { RolesGuard } from './presentation/guards/roles.guard';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secreto = config.get<string>('JWT_SECRET');

        // Sin secreto no se arranca. Un valor por defecto silencioso permitiría desplegar
        // a producción con tokens firmados por una clave conocida, que es peor que fallar.
        if (secreto === undefined || secreto.trim() === '') {
          throw new Error('Falta la variable de entorno JWT_SECRET (ver .env.example)');
        }

        // Solo el secreto. La VIGENCIA la fija `JwtGeneradorTokenAdapter` al firmar cada
        // token: si se declarara también aquí habría dos fuentes de verdad para el mismo
        // dato, y podrían discrepar entre el `expiresIn` del JWT y el `expiraEn` que se
        // le devuelve al cliente.
        return { secret: secreto };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AutenticarUsuarioService,
    RegistrarEstudianteService,
    { provide: USUARIO_REPOSITORIO, useClass: UsuarioPrismaRepositorio },
    { provide: HASHER_PASSWORD, useClass: BcryptHasherAdapter },
    { provide: GENERADOR_TOKEN, useClass: JwtGeneradorTokenAdapter },
    { provide: VERIFICADOR_TOKEN, useClass: JwtVerificadorTokenAdapter },

    // US-003 — Los guards se registran GLOBALMENTE, con `APP_GUARD`.
    //
    // SEGURO POR DEFECTO: toda ruta del sistema exige sesión salvo que se marque con
    // `@Publico()`. La alternativa —proteger solo lo que se marque— es la que causa las
    // fugas reales: alguien agrega un endpoint, olvida el decorador y queda abierto sin
    // que nadie lo note. Aquí el olvido produce un 401 visible, no una fuga silenciosa.
    //
    // El ORDEN IMPORTA: autenticación primero, roles después. `RolesGuard` necesita el
    // portador que `AutenticacionGuard` deja en la petición.
    { provide: APP_GUARD, useClass: AutenticacionGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
  // Se exporta el caso de uso y el hasher: el Sprint 2 necesitará el hasher para el
  // registro (US-001). El repositorio NO se exporta, por la misma razón que en
  // `convocatorias`: otros módulos pasan por la capa de aplicación, nunca por la
  // persistencia ajena.
  exports: [AutenticarUsuarioService, HASHER_PASSWORD],
})
export class UsuariosModule {}
