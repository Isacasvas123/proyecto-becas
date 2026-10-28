/**
 * PRUEBAS DE INTEGRACIÓN — US-002, criterio 2: el mensaje de error no revela nada.
 *
 * POR QUÉ ESTA PRUEBA EXISTE
 *   Señalado por Fernando en la revisión del PR #13. Leyendo `AutenticarUsuarioService` se
 *   ven `throw` con textos específicos —"El usuario no existe", "La cuenta está bloqueada
 *   temporalmente"— y parece que la API los devuelve. No los devuelve: son el motivo REAL,
 *   que solo va al log del servidor, y `DominioExceptionFilter` los sustituye por un
 *   mensaje genérico antes de responder.
 *
 *   Pero esa garantía vivía únicamente en el filtro, y ninguna prueba la fijaba por HTTP.
 *   Si alguien cambiara el filtro —o lanzara un `UnauthorizedException` de NestJS en vez
 *   del error de dominio— el motivo interno saldría al cliente y nada fallaría. Ahora sí.
 *
 * QUÉ SE COMPRUEBA
 *   Los tres caminos que terminan en 401 responden **byte por byte lo mismo**: usuario
 *   inexistente, contraseña incorrecta y cuenta bloqueada. Desde fuera son indistinguibles,
 *   que es justamente lo que pide el criterio.
 *
 * La petición recorre el controlador, el caso de uso y el filtro reales. Solo se sustituyen
 * los tres puertos (repositorio, hasher y generador de token), igual que en la prueba
 * unitaria del servicio.
 */
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';

import { ConfigService } from '@nestjs/config';

import { RecuperacionPasswordService } from '../src/modules/usuarios/application/services/recuperacion-password.service';
import { ENVIADOR_CORREO } from '../src/modules/usuarios/domain/ports/enviador-correo';
import { TOKEN_RECUPERACION_REPOSITORIO } from '../src/modules/usuarios/domain/ports/token-recuperacion.repositorio';
import { TokenRecuperacionEnMemoriaRepositorio } from '../src/modules/usuarios/infrastructure/persistence/token-recuperacion-en-memoria.repositorio';
import { DominioExceptionFilter } from '../src/shared/exceptions/dominio-exception.filter';
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
import { USUARIO_REPOSITORIO } from '../src/modules/usuarios/domain/ports/usuario.repositorio';
import { NombreUsuario } from '../src/modules/usuarios/domain/value-objects/nombre-usuario.vo';
import { UsuarioEnMemoriaRepositorio } from '../src/modules/usuarios/infrastructure/persistence/usuario-en-memoria.repositorio';
import { AuthController } from '../src/modules/usuarios/presentation/controllers/auth.controller';

const HASH_CORRECTO = 'hash-de-la-password-correcta';
const PASSWORD_CORRECTA = 'correcta';
const MAX_INTENTOS_FALLIDOS = 5;

/** Considera correcta una sola contraseña, sin ejecutar bcrypt. */
class HasherFalso implements HasherPassword {
  verificar(passwordEnClaro: string, hashAlmacenado: string): Promise<boolean> {
    return Promise.resolve(
      passwordEnClaro === PASSWORD_CORRECTA && hashAlmacenado === HASH_CORRECTO,
    );
  }

  calcular(passwordEnClaro: string): Promise<string> {
    return Promise.resolve(`hash-de-${passwordEnClaro}`);
  }
}

class GeneradorTokenFalso implements GeneradorToken {
  emitir(usuario: Usuario): Promise<TokenSesion> {
    return Promise.resolve({
      valor: `token-de-${usuario.nombreUsuario.valor}`,
      expiraEn: new Date('2026-12-31T00:00:00.000Z'),
    });
  }
}

describe('US-002 · El error de autenticación no revela nada (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
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
        AutenticarUsuarioService,
        // `AuthController` expone también el registro (US-001), así que Nest exige su
        // servicio aunque estas pruebas no lo usen. Se alimenta de los mismos tres puertos.
        RegistrarEstudianteService,
        {
          provide: USUARIO_REPOSITORIO,
          useValue: new UsuarioEnMemoriaRepositorio([
            new Usuario({
              id: 'id-1',
              nombreUsuario: NombreUsuario.crear('ana'),
              correo: 'ana@becas.gob.gt',
              hashPassword: HASH_CORRECTO,
              rol: RolUsuario.ESTUDIANTE,
              activo: true,
            }),
          ]),
        },
        { provide: HASHER_PASSWORD, useClass: HasherFalso },
        { provide: GENERADOR_TOKEN, useClass: GeneradorTokenFalso },
      ],
    }).compile();

    app = modulo.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    app.useGlobalFilters(new DominioExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const login = (nombreUsuario: string, password: string) =>
    request(app.getHttpServer()).post('/auth/login').send({ nombreUsuario, password });

  it('las credenciales correctas devuelven 200 y un token', async () => {
    // Referencia: si esto fallara, los 401 de abajo no demostrarían nada.
    const respuesta = await login('ana', PASSWORD_CORRECTA).expect(200);

    expect(respuesta.body.token).toBe('token-de-ana');
  });

  it('los tres caminos que fallan responden exactamente lo mismo', async () => {
    const inexistente = await login('nadie', 'loquesea').expect(401);
    const passwordMal = await login('ana', 'equivocada').expect(401);

    // Cinco fallos dejan la cuenta bloqueada (criterio 3). A partir de aquí ni siquiera la
    // contraseña correcta entra, y ese rechazo tampoco debe distinguirse de los otros dos.
    for (let intento = 1; intento < MAX_INTENTOS_FALLIDOS; intento += 1) {
      await login('ana', 'equivocada').expect(401);
    }
    const bloqueada = await login('ana', PASSWORD_CORRECTA).expect(401);

    const sinMarcaDeTiempo = ({ timestamp: _descartado, ...resto }: Record<string, unknown>) =>
      resto;

    expect(sinMarcaDeTiempo(passwordMal.body)).toEqual(sinMarcaDeTiempo(inexistente.body));
    expect(sinMarcaDeTiempo(bloqueada.body)).toEqual(sinMarcaDeTiempo(inexistente.body));
    expect(inexistente.body.mensaje).toBe('Usuario o contraseña incorrectos');
  });

  it('el motivo interno nunca viaja al cliente', async () => {
    // Los textos que `AutenticarUsuarioService` pasa a `AutenticacionFallidaError`. Se
    // comprueba la respuesta ENTERA, no solo el campo `mensaje`: un motivo filtrado por
    // cualquier otro campo sería igual de grave.
    const motivosInternos = ['no existe', 'bloquead', 'contraseña incorrecta'];

    const respuestas = [
      await login('nadie', 'loquesea').expect(401),
      await login('ana', 'equivocada').expect(401),
    ];

    for (const respuesta of respuestas) {
      const cuerpo = JSON.stringify(respuesta.body).toLowerCase();
      for (const motivo of motivosInternos) {
        expect(cuerpo).not.toContain(motivo);
      }
    }
  });

  it('un usuario que no existe tarda lo mismo que una contraseña incorrecta', async () => {
    // El mensaje es idéntico, pero el tiempo de respuesta también delata. Por eso el caso de
    // uso verifica contra un hash señuelo cuando el usuario no existe. Aquí solo se comprueba
    // que esa verificación OCURRE: el hasher falso no simula el costo real de bcrypt, así que
    // medir milisegundos daría una prueba inestable.
    const verificaciones: string[] = [];
    const hasherEspia: HasherPassword = {
      verificar: (_passwordEnClaro, hashAlmacenado) => {
        verificaciones.push(hashAlmacenado);
        return Promise.resolve(false);
      },
      calcular: (passwordEnClaro) => Promise.resolve(`hash-de-${passwordEnClaro}`),
    };

    const servicio = new AutenticarUsuarioService(
      new UsuarioEnMemoriaRepositorio([]),
      hasherEspia,
      new GeneradorTokenFalso(),
    );

    await expect(servicio.ejecutar('nadie', 'loquesea')).rejects.toThrow();

    expect(verificaciones).toHaveLength(1);
  });
});
