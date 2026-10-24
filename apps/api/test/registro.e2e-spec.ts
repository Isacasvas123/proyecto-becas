/**
 * PRUEBA DE INTEGRACIÓN — US-001, registro de estudiante.
 *
 * Pila HTTP de producción: guards globales reales, el `ValidationPipe` con la configuración de
 * `main.ts` y el filtro de errores del dominio. El hash es **bcrypt real**; las dos sustituciones
 * son el repositorio (en memoria) y el emisor/verificador de tokens (dobles).
 *
 * La prueba más importante del archivo es la de ida y vuelta: registrarse y después iniciar
 * sesión con esas mismas credenciales por la ruta de login. Si el registro guardara el hash de
 * forma distinta a como el login lo verifica, el estudiante quedaría registrado y sin poder entrar.
 */
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';

import { RecuperacionPasswordService } from '../src/modules/usuarios/application/services/recuperacion-password.service';
import { ENVIADOR_CORREO } from '../src/modules/usuarios/domain/ports/enviador-correo';
import { TOKEN_RECUPERACION_REPOSITORIO } from '../src/modules/usuarios/domain/ports/token-recuperacion.repositorio';
import { TokenRecuperacionEnMemoriaRepositorio } from '../src/modules/usuarios/infrastructure/persistence/token-recuperacion-en-memoria.repositorio';
import { AutenticarUsuarioService } from '../src/modules/usuarios/application/services/autenticar-usuario.service';
import { RegistrarEstudianteService } from '../src/modules/usuarios/application/services/registrar-estudiante.service';
import { Usuario } from '../src/modules/usuarios/domain/entities/usuario.entity';
import {
  GENERADOR_TOKEN,
  GeneradorToken,
  TokenSesion,
} from '../src/modules/usuarios/domain/ports/generador-token';
import { HASHER_PASSWORD } from '../src/modules/usuarios/domain/ports/hasher-password';
import { USUARIO_REPOSITORIO } from '../src/modules/usuarios/domain/ports/usuario.repositorio';
import {
  PortadorToken,
  VERIFICADOR_TOKEN,
  VerificadorToken,
} from '../src/modules/usuarios/domain/ports/verificador-token';
import { BcryptHasherAdapter } from '../src/modules/usuarios/infrastructure/adapters/bcrypt-hasher.adapter';
import { UsuarioEnMemoriaRepositorio } from '../src/modules/usuarios/infrastructure/persistence/usuario-en-memoria.repositorio';
import { AuthController } from '../src/modules/usuarios/presentation/controllers/auth.controller';
import { AutenticacionGuard } from '../src/modules/usuarios/presentation/guards/autenticacion.guard';
import { RolesGuard } from '../src/modules/usuarios/presentation/guards/roles.guard';
import { DominioExceptionFilter } from '../src/shared/exceptions/dominio-exception.filter';

class GeneradorFalso implements GeneradorToken {
  emitir(usuario: Usuario): Promise<TokenSesion> {
    return Promise.resolve({
      valor: `token-de-${usuario.nombreUsuario.valor}`,
      expiraEn: new Date(Date.now() + 8 * 3600 * 1000),
    });
  }
}

class VerificadorQueNadaAcepta implements VerificadorToken {
  verificar(): Promise<PortadorToken | null> {
    return Promise.resolve(null);
  }
}

function cuerpo(cambios: Record<string, unknown> = {}) {
  return {
    nombreCompleto: 'Ana María López',
    cui: '2456 78901 0101',
    correo: 'ana@correo.gt',
    nombreUsuario: 'ana.lopez',
    password: 'Becas2026',
    ...cambios,
  };
}

describe('POST /auth/registro (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const modulo = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        // `AuthController` expone además la recuperación (US-035). Nest resuelve el
        // controlador entero, así que su servicio tiene que estar aunque estas pruebas no
        // lo usen.
        RecuperacionPasswordService,
        {
          provide: TOKEN_RECUPERACION_REPOSITORIO,
          useValue: new TokenRecuperacionEnMemoriaRepositorio(),
        },
        { provide: ENVIADOR_CORREO, useValue: { enviar: () => Promise.resolve() } },
        { provide: ConfigService, useValue: { get: () => undefined } },
        RegistrarEstudianteService,
        AutenticarUsuarioService,
        { provide: USUARIO_REPOSITORIO, useValue: new UsuarioEnMemoriaRepositorio([]) },
        // bcrypt REAL, con 4 rondas para que la prueba sea rápida.
        { provide: ConfigService, useValue: { get: () => '4' } },
        { provide: HASHER_PASSWORD, useClass: BcryptHasherAdapter },
        { provide: GENERADOR_TOKEN, useClass: GeneradorFalso },
        { provide: VERIFICADOR_TOKEN, useClass: VerificadorQueNadaAcepta },
        { provide: APP_GUARD, useClass: AutenticacionGuard },
        { provide: APP_GUARD, useClass: RolesGuard },
      ],
    }).compile();

    app = modulo.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    app.useGlobalFilters(new DominioExceptionFilter());
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  const servidor = () => request(app.getHttpServer());

  it('201: es pública, crea un ESTUDIANTE y devuelve la sesión iniciada', async () => {
    // Con el guard global activo y un verificador que no acepta nada: si la ruta no fuera
    // @Publico, esto daría 401.
    const { body } = await servidor().post('/auth/registro').send(cuerpo()).expect(201);

    expect(body.token).toBe('token-de-ana.lopez');
    expect(body.usuario).toEqual({
      id: expect.any(String),
      nombreUsuario: 'ana.lopez',
      correo: 'ana@correo.gt',
      rol: 'ESTUDIANTE',
    });
  });

  it('la respuesta no expone el hash, el CUI ni la contraseña', async () => {
    const { text } = await servidor().post('/auth/registro').send(cuerpo()).expect(201);

    expect(text).not.toContain('Becas2026');
    expect(text).not.toContain('$2');
    expect(text).not.toContain('2456789010101');
  });

  it('IDA Y VUELTA: con la cuenta recién creada se puede iniciar sesión', async () => {
    await servidor().post('/auth/registro').send(cuerpo()).expect(201);

    const { body } = await servidor()
      .post('/auth/login')
      .send({ nombreUsuario: 'ana.lopez', password: 'Becas2026' })
      .expect(200);

    expect(body.usuario.rol).toBe('ESTUDIANTE');

    await servidor()
      .post('/auth/login')
      .send({ nombreUsuario: 'ana.lopez', password: 'otraClave1' })
      .expect(401);
  });

  describe('criterio 4 — 409 con mensaje específico', () => {
    beforeEach(async () => {
      await servidor().post('/auth/registro').send(cuerpo()).expect(201);
    });

    it.each([
      [
        'el mismo CUI escrito de otra forma',
        { cui: '2456789010101', correo: 'x@correo.gt', nombreUsuario: 'otro' },
        'ese CUI',
      ],
      [
        'el mismo correo con mayúsculas',
        { cui: '9999999999999', correo: 'ANA@correo.gt', nombreUsuario: 'otro' },
        'ese correo',
      ],
    ])('rechaza %s', async (_caso, cambios, fragmento) => {
      const { body } = await servidor().post('/auth/registro').send(cuerpo(cambios)).expect(409);

      expect(body.mensaje).toContain(fragmento);
    });
  });

  it('422 con el detalle de la política si la contraseña es débil (criterio 2)', async () => {
    const { body } = await servidor()
      .post('/auth/registro')
      .send(cuerpo({ password: 'becasguate' }))
      .expect(422);

    expect(body.mensaje).toContain('mayúscula');
    expect(body.mensaje).toContain('número');
  });

  it('422 si el CUI no tiene 13 dígitos (criterio 1)', async () => {
    const { body } = await servidor()
      .post('/auth/registro')
      .send(cuerpo({ cui: '12345' }))
      .expect(422);

    expect(body.mensaje).toContain('13 dígitos');
  });

  it.each([
    ['correo con formato inválido', { correo: 'no-es-un-correo' }],
    ['sin nombre completo', { nombreCompleto: '' }],
    ['contraseña de más de 72 caracteres', { password: `A1${'x'.repeat(80)}` }],
  ])('400 con %s', async (_caso, cambios) => {
    await servidor().post('/auth/registro').send(cuerpo(cambios)).expect(400);
  });

  it('400 si se intenta mandar el ROL: nadie se registra como administrador', async () => {
    await servidor()
      .post('/auth/registro')
      .send(cuerpo({ rol: 'ADMINISTRADOR' }))
      .expect(400);
  });
});
