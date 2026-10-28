/**
 * Pruebas del caso de uso de registro (US-001), con dobles: sin base de datos ni bcrypt real.
 * Lo que se prueba aquí es la orquestación —orden de las comprobaciones, mensajes de
 * duplicado, sesión al final—; las reglas ya tienen sus pruebas en el dominio.
 */
import {
  RecursoDuplicadoError,
  ReglaDeNegocioError,
} from '../../../../shared/exceptions/errores-dominio';
import { Usuario } from '../../domain/entities/usuario.entity';
import { RolUsuario } from '../../domain/enums/rol-usuario.enum';
import { GeneradorToken, TokenSesion } from '../../domain/ports/generador-token';
import { HasherPassword } from '../../domain/ports/hasher-password';
import { Cui } from '../../domain/value-objects/cui.vo';
import { NombreUsuario } from '../../domain/value-objects/nombre-usuario.vo';
import { UsuarioEnMemoriaRepositorio } from '../../infrastructure/persistence/usuario-en-memoria.repositorio';
import {
  ComandoRegistrarEstudiante,
  RegistrarEstudianteService,
} from './registrar-estudiante.service';

class HasherFalso implements HasherPassword {
  calculos = 0;
  calcular(clave: string): Promise<string> {
    this.calculos += 1;
    return Promise.resolve(`hash(${clave})`);
  }
  verificar(clave: string, hash: string): Promise<boolean> {
    return Promise.resolve(hash === `hash(${clave})`);
  }
}

class GeneradorFalso implements GeneradorToken {
  emitir(usuario: Usuario): Promise<TokenSesion> {
    return Promise.resolve({
      valor: `token-de-${usuario.nombreUsuario.valor}`,
      expiraEn: new Date('2026-12-31T00:00:00.000Z'),
    });
  }
}

const existente = new Usuario({
  id: 'id-existente',
  nombreUsuario: NombreUsuario.crear('pedro'),
  correo: 'pedro@correo.gt',
  hashPassword: 'hash',
  rol: RolUsuario.ESTUDIANTE,
  activo: true,
  nombreCompleto: 'Pedro Pérez',
  cui: Cui.crear('1111111111111'),
});

function comando(cambios: Partial<ComandoRegistrarEstudiante> = {}): ComandoRegistrarEstudiante {
  return {
    nombreCompleto: 'Ana López',
    cui: '2456 78901 0101',
    correo: 'Ana@Correo.gt',
    nombreUsuario: 'ana',
    password: 'Becas2026',
    ...cambios,
  };
}

describe('RegistrarEstudianteService (US-001)', () => {
  let repositorio: UsuarioEnMemoriaRepositorio;
  let hasher: HasherFalso;
  let servicio: RegistrarEstudianteService;

  beforeEach(() => {
    repositorio = new UsuarioEnMemoriaRepositorio([existente]);
    hasher = new HasherFalso();
    servicio = new RegistrarEstudianteService(repositorio, hasher, new GeneradorFalso());
  });

  it('registra al estudiante y devuelve la sesión ya iniciada (criterio 5)', async () => {
    const sesion = await servicio.ejecutar(comando());

    expect(sesion.token).toBe('token-de-ana');
    expect(sesion.usuario.rol).toBe(RolUsuario.ESTUDIANTE);
    expect(sesion.usuario.correo).toBe('ana@correo.gt');
  });

  it('la cuenta queda guardada con el hash y con el CUI normalizado (criterio 3)', async () => {
    await servicio.ejecutar(comando());

    const guardado = await repositorio.buscarPorNombreUsuario(NombreUsuario.crear('ana'));
    expect(guardado?.hashAlmacenado()).toBe('hash(Becas2026)');
    expect(guardado?.hashAlmacenado()).not.toBe('Becas2026');
    expect(guardado?.cui?.valor).toBe('2456789010101');
  });

  it('con la cuenta recién creada se puede iniciar sesión', async () => {
    // Cierra el ciclo: si el hash guardado no fuera el que el login sabe verificar, el
    // estudiante quedaría registrado pero sin poder entrar nunca.
    await servicio.ejecutar(comando());

    const guardado = await repositorio.buscarPorNombreUsuario(NombreUsuario.crear('ana'));
    await expect(hasher.verificar('Becas2026', guardado!.hashAlmacenado())).resolves.toBe(true);
  });

  describe('criterio 4 — mensaje claro y específico si ya existe', () => {
    it.each([
      ['el CUI', { cui: '1111111111111' }, 'Ya existe una cuenta con ese CUI.'],
      ['el correo', { correo: 'PEDRO@correo.gt' }, 'Ya existe una cuenta con ese correo.'],
      [
        'el nombre de usuario',
        { nombreUsuario: 'Pedro' },
        'Ya existe una cuenta con ese nombre de usuario.',
      ],
    ])('dice que el problema es %s', async (_caso, cambios, mensaje) => {
      await expect(servicio.ejecutar(comando(cambios))).rejects.toThrow(mensaje);
    });

    it('si chocan varios, los nombra todos', async () => {
      await expect(
        servicio.ejecutar(comando({ cui: '1111111111111', correo: 'pedro@correo.gt' })),
      ).rejects.toThrow('Ya existe una cuenta con ese CUI y ese correo.');
    });

    it('con tres choques, los enumera con comas', async () => {
      await expect(
        servicio.ejecutar(
          comando({ cui: '1111111111111', correo: 'pedro@correo.gt', nombreUsuario: 'pedro' }),
        ),
      ).rejects.toThrow('Ya existe una cuenta con ese CUI, ese correo y ese nombre de usuario.');
    });

    it('es un RecursoDuplicadoError (HTTP 409)', async () => {
      await expect(servicio.ejecutar(comando({ cui: '1111111111111' }))).rejects.toBeInstanceOf(
        RecursoDuplicadoError,
      );
    });

    it('un duplicado no gasta un cálculo de bcrypt', async () => {
      await expect(servicio.ejecutar(comando({ cui: '1111111111111' }))).rejects.toThrow();

      expect(hasher.calculos).toBe(0);
    });
  });

  it('una contraseña que no cumple la política se rechaza sin tocar el repositorio', async () => {
    const consultar = jest.spyOn(repositorio, 'buscarDuplicados');

    await expect(servicio.ejecutar(comando({ password: 'debil' }))).rejects.toBeInstanceOf(
      ReglaDeNegocioError,
    );
    expect(consultar).not.toHaveBeenCalled();
  });

  it('si el repositorio detecta el duplicado al escribir, el error llega intacto', async () => {
    // Simula la carrera: otra petición registró el mismo CUI entre la comprobación y la
    // escritura. La base de datos es la última palabra.
    jest.spyOn(repositorio, 'buscarDuplicados').mockResolvedValue({
      correo: false,
      cui: false,
      nombreUsuario: false,
    });

    await expect(servicio.ejecutar(comando({ cui: '1111111111111' }))).rejects.toBeInstanceOf(
      RecursoDuplicadoError,
    );
  });
});
