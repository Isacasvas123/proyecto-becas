/**
 * Prueba de integración de US-035, recuperar una contraseña olvidada.
 *
 * Probar que "funciona" no basta: el flujo puede hacer lo que pide la historia y aun así regalar
 * a quien lo mire con mala intención la lista de quién tiene cuenta y la posibilidad de reusar un
 * enlace. Ambas son invisibles desde la pantalla, por eso están como pruebas.
 *
 * La más importante es la primera: si `solicitar` respondiera distinto cuando la cuenta no
 * existe, cualquiera podría armar la lista de quién pidió una beca al Estado. Protege una
 * decisión fácil de deshacer sin querer, por ejemplo "mejorando" el mensaje de error.
 */
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';

import { DominioExceptionFilter } from '../src/shared/exceptions/dominio-exception.filter';
import { RecuperacionPasswordService } from '../src/modules/usuarios/application/services/recuperacion-password.service';
import { AutenticarUsuarioService } from '../src/modules/usuarios/application/services/autenticar-usuario.service';
import { RegistrarEstudianteService } from '../src/modules/usuarios/application/services/registrar-estudiante.service';
import { Usuario } from '../src/modules/usuarios/domain/entities/usuario.entity';
import { RolUsuario } from '../src/modules/usuarios/domain/enums/rol-usuario.enum';
import {
  GENERADOR_TOKEN,
  GeneradorToken,
  TokenSesion,
} from '../src/modules/usuarios/domain/ports/generador-token';
import {
  HASHER_PASSWORD,
  HasherPassword,
} from '../src/modules/usuarios/domain/ports/hasher-password';
import {
  Correo,
  ENVIADOR_CORREO,
  EnviadorCorreo,
} from '../src/modules/usuarios/domain/ports/enviador-correo';
import { TOKEN_RECUPERACION_REPOSITORIO } from '../src/modules/usuarios/domain/ports/token-recuperacion.repositorio';
import { USUARIO_REPOSITORIO } from '../src/modules/usuarios/domain/ports/usuario.repositorio';
import { NombreUsuario } from '../src/modules/usuarios/domain/value-objects/nombre-usuario.vo';
import { TokenRecuperacionEnMemoriaRepositorio } from '../src/modules/usuarios/infrastructure/persistence/token-recuperacion-en-memoria.repositorio';
import { UsuarioEnMemoriaRepositorio } from '../src/modules/usuarios/infrastructure/persistence/usuario-en-memoria.repositorio';
import { AuthController } from '../src/modules/usuarios/presentation/controllers/auth.controller';

const CORREO_DE_ANA = 'ana@becas.gob.gt';
const PASSWORD_VIEJA = 'ViejaClave2026';
const PASSWORD_NUEVA = 'NuevaClave2026';

/** Sin bcrypt: estas pruebas miran el flujo, no el algoritmo de hash. */
class HasherFalso implements HasherPassword {
  verificar(enClaro: string, hash: string): Promise<boolean> {
    return Promise.resolve(hash === `hash-de-${enClaro}`);
  }
  calcular(enClaro: string): Promise<string> {
    return Promise.resolve(`hash-de-${enClaro}`);
  }
}

class GeneradorTokenFalso implements GeneradorToken {
  emitir(usuario: Usuario): Promise<TokenSesion> {
    return Promise.resolve({
      valor: `token-de-${usuario.nombreUsuario.valor}`,
      expiraEn: new Date('2099-12-31T00:00:00.000Z'),
    });
  }
}

/** Guarda lo que se habría enviado, para poder leer el enlace como lo leería la persona. */
class CorreoEspia implements EnviadorCorreo {
  readonly enviados: Correo[] = [];
  enviar(correo: Correo): Promise<void> {
    this.enviados.push(correo);
    return Promise.resolve();
  }
}

describe('US-035 · Recuperar la contraseña (e2e)', () => {
  let app: INestApplication<App>;
  let correos: CorreoEspia;
  let usuarios: UsuarioEnMemoriaRepositorio;

  beforeEach(async () => {
    correos = new CorreoEspia();
    usuarios = new UsuarioEnMemoriaRepositorio([
      new Usuario({
        id: 'id-ana',
        nombreUsuario: NombreUsuario.crear('ana'),
        correo: CORREO_DE_ANA,
        hashPassword: `hash-de-${PASSWORD_VIEJA}`,
        rol: RolUsuario.ESTUDIANTE,
        activo: true,
      }),
    ]);

    const modulo = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        RecuperacionPasswordService,
        AutenticarUsuarioService,
        RegistrarEstudianteService,
        { provide: USUARIO_REPOSITORIO, useValue: usuarios },
        {
          provide: TOKEN_RECUPERACION_REPOSITORIO,
          useValue: new TokenRecuperacionEnMemoriaRepositorio(),
        },
        { provide: HASHER_PASSWORD, useClass: HasherFalso },
        { provide: GENERADOR_TOKEN, useClass: GeneradorTokenFalso },
        { provide: ENVIADOR_CORREO, useValue: correos },
        {
          provide: ConfigService,
          useValue: { get: (clave: string) => (clave === 'JWT_SECRET' ? 'secreto' : undefined) },
        },
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
  const pedirEnlace = (correo: string) => servidor().post('/auth/recuperacion').send({ correo });
  const restablecer = (token: string, password: string) =>
    servidor().post('/auth/recuperacion/confirmar').send({ token, password });

  /** El token en claro solo existe dentro del enlace del correo, igual que para la persona. */
  const tokenDelUltimoCorreo = (): string => {
    const cuerpo = correos.enviados.at(-1)?.cuerpo ?? '';
    return /\/recuperar\/([a-f0-9]{64})/.exec(cuerpo)?.[1] ?? '';
  };

  describe('pedir el enlace', () => {
    it('responde igual exista o no la cuenta: no se puede averiguar quién está registrado', async () => {
      const conCuenta = await pedirEnlace(CORREO_DE_ANA).expect(204);
      const sinCuenta = await pedirEnlace('nadie.jamas@ejemplo.gt').expect(204);

      // Ni el código, ni el cuerpo: las dos respuestas son indistinguibles.
      expect(conCuenta.body).toEqual(sinCuenta.body);
      expect(conCuenta.text).toEqual(sinCuenta.text);
    });

    it('pero el correo solo sale si la cuenta existe', async () => {
      await pedirEnlace('nadie.jamas@ejemplo.gt').expect(204);
      expect(correos.enviados).toHaveLength(0);

      await pedirEnlace(CORREO_DE_ANA).expect(204);
      expect(correos.enviados).toHaveLength(1);
      expect(correos.enviados[0].para).toBe(CORREO_DE_ANA);
    });

    it('el correo lleva un enlace con un token largo, no algo adivinable', async () => {
      await pedirEnlace(CORREO_DE_ANA).expect(204);

      // 64 caracteres hexadecimales = 32 bytes de aleatoriedad.
      expect(tokenDelUltimoCorreo()).toMatch(/^[a-f0-9]{64}$/);
    });

    it('rechaza algo que no es un correo', async () => {
      await pedirEnlace('esto-no-es-un-correo').expect(400);
    });
  });

  describe('canjear el enlace', () => {
    const conEnlace = async (): Promise<string> => {
      await pedirEnlace(CORREO_DE_ANA).expect(204);
      return tokenDelUltimoCorreo();
    };

    it('cambia la contraseña: la nueva entra y la vieja deja de servir', async () => {
      const token = await conEnlace();

      await restablecer(token, PASSWORD_NUEVA).expect(204);

      await servidor()
        .post('/auth/login')
        .send({ nombreUsuario: 'ana', password: PASSWORD_NUEVA })
        .expect(200);
      await servidor()
        .post('/auth/login')
        .send({ nombreUsuario: 'ana', password: PASSWORD_VIEJA })
        .expect(401);
    });

    it('el mismo enlace no sirve dos veces', async () => {
      const token = await conEnlace();
      await restablecer(token, PASSWORD_NUEVA).expect(204);

      const { body } = await restablecer(token, 'OtraClave2026').expect(422);
      expect(body.mensaje).toMatch(/ya no es válido/);
    });

    /**
     * Pedir el enlace cinco veces no deja cinco llaves vivas. Sin esto, un enlace viejo de
     * un buzón al que alguien más tenga acceso seguiría abriendo la cuenta.
     */
    it('al usar uno, los demás enlaces de esa persona mueren', async () => {
      const primero = await conEnlace();
      const segundo = await conEnlace();
      expect(primero).not.toBe(segundo);

      await restablecer(segundo, PASSWORD_NUEVA).expect(204);
      await restablecer(primero, 'OtraClave2026').expect(422);
    });

    it('un token inventado da 422, no un error del servidor', async () => {
      const { body } = await restablecer('0'.repeat(64), PASSWORD_NUEVA).expect(422);
      expect(body.mensaje).toMatch(/ya no es válido/);
    });

    /** Si la contraseña no cumple, el enlace tiene que seguir sirviendo para reintentar. */
    it('una contraseña que no cumple la política NO gasta el enlace', async () => {
      const token = await conEnlace();

      await restablecer(token, 'corta').expect(422);
      await restablecer(token, PASSWORD_NUEVA).expect(204);
    });
  });
});
