/**
 * Prueba del caso de uso de inicio de sesión (US-002).
 *
 * Corre sin PostgreSQL, sin bcrypt real y sin firmar JWT: los tres puertos se sustituyen
 * por dobles de prueba. Es la demostración práctica de para qué sirve la inversión de
 * dependencias (docs/05-arquitectura.md §2.4).
 */
import { AutenticacionFallidaError } from '../../../../shared/exceptions/errores-dominio';
import { Usuario } from '../../domain/entities/usuario.entity';
import { RolUsuario } from '../../domain/enums/rol-usuario.enum';
import { GeneradorToken, TokenSesion } from '../../domain/ports/generador-token';
import { HasherPassword } from '../../domain/ports/hasher-password';
import { NombreUsuario } from '../../domain/value-objects/nombre-usuario.vo';
import { UsuarioEnMemoriaRepositorio } from '../../infrastructure/persistence/usuario-en-memoria.repositorio';
import { AutenticarUsuarioService } from './autenticar-usuario.service';

const HASH_CORRECTO = 'hash-de-la-password-correcta';

/** Hasher falso: considera correcta la contraseña "correcta" y ninguna otra. */
class HasherFalso implements HasherPassword {
  llamadas = 0;

  verificar(passwordEnClaro: string, hashAlmacenado: string): Promise<boolean> {
    this.llamadas += 1;
    return Promise.resolve(passwordEnClaro === 'correcta' && hashAlmacenado === HASH_CORRECTO);
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

function crearUsuario(overrides: Partial<{ activo: boolean; rol: RolUsuario }> = {}): Usuario {
  return new Usuario({
    id: 'id-1',
    nombreUsuario: NombreUsuario.crear('admin'),
    correo: 'admin@becas.gob.gt',
    hashPassword: HASH_CORRECTO,
    rol: overrides.rol ?? RolUsuario.ADMINISTRADOR,
    activo: overrides.activo ?? true,
  });
}

describe('AutenticarUsuarioService', () => {
  let hasher: HasherFalso;

  function crearServicio(usuarios: Usuario[]): AutenticarUsuarioService {
    hasher = new HasherFalso();
    return new AutenticarUsuarioService(
      new UsuarioEnMemoriaRepositorio(usuarios),
      hasher,
      new GeneradorTokenFalso(),
    );
  }

  it('devuelve token y datos del usuario cuando las credenciales son correctas', async () => {
    const servicio = crearServicio([crearUsuario()]);

    const sesion = await servicio.ejecutar('admin', 'correcta');

    expect(sesion.token).toBe('token-de-admin');
    expect(sesion.usuario).toEqual({
      id: 'id-1',
      nombreUsuario: 'admin',
      correo: 'admin@becas.gob.gt',
      rol: RolUsuario.ADMINISTRADOR,
    });
  });

  it('nunca expone el hash de la contraseña en el resultado', async () => {
    const servicio = crearServicio([crearUsuario()]);

    const sesion = await servicio.ejecutar('admin', 'correcta');

    expect(JSON.stringify(sesion)).not.toContain(HASH_CORRECTO);
  });

  it('normaliza el nombre de usuario: " ADMIN " encuentra a "admin"', async () => {
    const servicio = crearServicio([crearUsuario()]);

    const sesion = await servicio.ejecutar('  ADMIN  ', 'correcta');

    expect(sesion.usuario.nombreUsuario).toBe('admin');
  });

  it('rechaza una contraseña incorrecta', async () => {
    const servicio = crearServicio([crearUsuario()]);

    await expect(servicio.ejecutar('admin', 'incorrecta')).rejects.toBeInstanceOf(
      AutenticacionFallidaError,
    );
  });

  it('rechaza un usuario inexistente', async () => {
    const servicio = crearServicio([]);

    await expect(servicio.ejecutar('fantasma', 'correcta')).rejects.toBeInstanceOf(
      AutenticacionFallidaError,
    );
  });

  it('verifica el hash aunque el usuario no exista, para no filtrar cuentas por tiempo', async () => {
    const servicio = crearServicio([]);

    await expect(servicio.ejecutar('fantasma', 'correcta')).rejects.toThrow();

    // Si esta comprobación fallara, un atacante podría distinguir "usuario inexistente"
    // de "contraseña incorrecta" midiendo el tiempo de respuesta.
    expect(hasher.llamadas).toBe(1);
  });

  it('rechaza a un usuario desactivado aunque la contraseña sea correcta', async () => {
    const servicio = crearServicio([crearUsuario({ activo: false })]);

    await expect(servicio.ejecutar('admin', 'correcta')).rejects.toBeInstanceOf(
      AutenticacionFallidaError,
    );
  });

  it('rechaza un nombre de usuario con formato inválido antes de tocar el repositorio', async () => {
    const servicio = crearServicio([crearUsuario()]);

    await expect(servicio.ejecutar('a', 'correcta')).rejects.toThrow(/entre 3 y 30 caracteres/);
    expect(hasher.llamadas).toBe(0);
  });

  describe('bloqueo tras 5 intentos fallidos (US-002, criterio 3)', () => {
    const AHORA = new Date('2026-09-12T15:00:00.000Z');
    const minutos = (m: number) => new Date(AHORA.getTime() + m * 60 * 1000);

    async function fallarVeces(servicio: AutenticarUsuarioService, veces: number, cuando = AHORA) {
      for (let i = 0; i < veces; i++) {
        await expect(servicio.ejecutar('admin', 'incorrecta', cuando)).rejects.toThrow(
          AutenticacionFallidaError,
        );
      }
    }

    it('tras 5 intentos fallidos rechaza incluso la contraseña CORRECTA', async () => {
      // Esta es la prueba que demuestra que el bloqueo protege algo. Si la contraseña correcta
      // entrara durante el bloqueo, un atacante seguiría probando y sabría cuándo acertó.
      const servicio = crearServicio([crearUsuario()]);

      await fallarVeces(servicio, 5);

      await expect(servicio.ejecutar('admin', 'correcta', minutos(1))).rejects.toThrow(
        AutenticacionFallidaError,
      );
    });

    it('con 4 intentos fallidos la contraseña correcta todavía entra', async () => {
      const servicio = crearServicio([crearUsuario()]);

      await fallarVeces(servicio, 4);

      await expect(servicio.ejecutar('admin', 'correcta', AHORA)).resolves.toHaveProperty('token');
    });

    it('pasados 15 minutos la cuenta se desbloquea sola', async () => {
      const servicio = crearServicio([crearUsuario()]);

      await fallarVeces(servicio, 5);

      await expect(servicio.ejecutar('admin', 'correcta', minutos(14))).rejects.toThrow();
      await expect(servicio.ejecutar('admin', 'correcta', minutos(15))).resolves.toHaveProperty(
        'token',
      );
    });

    it('los intentos deben ser CONSECUTIVOS: un acceso correcto reinicia la cuenta', async () => {
      const servicio = crearServicio([crearUsuario()]);

      await fallarVeces(servicio, 4);
      await servicio.ejecutar('admin', 'correcta', AHORA);
      await fallarVeces(servicio, 4);

      // 8 fallos en total, pero nunca 5 seguidos: la cuenta sigue abierta.
      await expect(servicio.ejecutar('admin', 'correcta', AHORA)).resolves.toHaveProperty('token');
    });

    it('durante el bloqueo NO se verifica la contraseña real', async () => {
      const servicio = crearServicio([crearUsuario()]);
      await fallarVeces(servicio, 5);
      const verificarReal = jest.spyOn(hasher, 'verificar');

      await expect(servicio.ejecutar('admin', 'correcta', minutos(1))).rejects.toThrow();

      // Se llama UNA vez, pero contra el hash señuelo, no contra el hash del usuario: gasta el
      // mismo tiempo que un intento normal sin darle al atacante un oráculo.
      expect(verificarReal).toHaveBeenCalledTimes(1);
      expect(verificarReal.mock.calls[0][1]).not.toBe(HASH_CORRECTO);
    });

    it('bloqueado o no, el error es el mismo tipo que una contraseña incorrecta', async () => {
      // El filtro de excepciones convierte cualquier AutenticacionFallidaError en el mismo
      // mensaje genérico. Así una cuenta bloqueada no se distingue de una clave mal escrita.
      const servicio = crearServicio([crearUsuario()]);
      await fallarVeces(servicio, 5);

      const error = await servicio.ejecutar('admin', 'correcta', minutos(1)).catch((e) => e);

      expect(error).toBeInstanceOf(AutenticacionFallidaError);
    });

    it('un acceso correcto sin intentos previos no escribe en el repositorio', async () => {
      // Evita una escritura a la base en cada inicio de sesión normal.
      const repositorio = new UsuarioEnMemoriaRepositorio([crearUsuario()]);
      const escribir = jest.spyOn(repositorio, 'actualizarEstadoDeAcceso');
      hasher = new HasherFalso();
      const servicio = new AutenticarUsuarioService(repositorio, hasher, new GeneradorTokenFalso());

      await servicio.ejecutar('admin', 'correcta', AHORA);

      expect(escribir).not.toHaveBeenCalled();
    });
  });
});
