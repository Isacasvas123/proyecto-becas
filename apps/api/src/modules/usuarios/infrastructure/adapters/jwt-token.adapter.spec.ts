/**
 * Pruebas de los dos adaptadores de JWT, con la biblioteca real (DEF-02).
 *
 * `JwtGeneradorTokenAdapter` y `JwtVerificadorTokenAdapter` estaban a 0 % de cobertura: las
 * pruebas de integración de US-003 sustituyen el verificador por un doble con tres tokens de
 * mentira, así que el JWT real (firma, caducidad, payload) no se ejercitaba.
 *
 * Se prueban juntos porque forman un contrato cerrado: lo que uno emite, el otro debe poder
 * leer. La prueba más valiosa es la de ida y vuelta; probarlos por separado con payloads a mano
 * dejaría pasar que ambos cambien de forma coherente entre sí pero incorrecta para el dominio.
 */
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { RolUsuario } from '../../domain/enums/rol-usuario.enum';
import { Usuario } from '../../domain/entities/usuario.entity';
import { NombreUsuario } from '../../domain/value-objects/nombre-usuario.vo';
import { JwtGeneradorTokenAdapter } from './jwt-generador-token.adapter';
import { JwtVerificadorTokenAdapter } from './jwt-verificador-token.adapter';

const SECRETO = 'secreto-de-prueba-largo-y-suficiente-para-hs256';

function crearJwt(secreto = SECRETO): JwtService {
  return new JwtService({ secret: secreto });
}

function crearConfig(expiracion?: string): ConfigService {
  return {
    get: (clave: string): string | undefined =>
      clave === 'JWT_EXPIRACION' ? expiracion : undefined,
  } as unknown as ConfigService;
}

function usuarioDePrueba(): Usuario {
  return new Usuario({
    id: 'id-1',
    nombreUsuario: NombreUsuario.crear('admin'),
    correo: 'admin@becas.gob.gt',
    hashPassword: '$2b$10$hashdementira',
    rol: RolUsuario.ADMINISTRADOR,
    activo: true,
  });
}

describe('Adaptadores de JWT', () => {
  describe('ida y vuelta: lo que emite el generador lo lee el verificador', () => {
    it('el portador recuperado corresponde al usuario que firmó el token', async () => {
      const jwt = crearJwt();
      const generador = new JwtGeneradorTokenAdapter(jwt, crearConfig('8h'));
      const verificador = new JwtVerificadorTokenAdapter(jwt);

      const { valor } = await generador.emitir(usuarioDePrueba());
      const portador = await verificador.verificar(valor);

      expect(portador).toEqual({
        usuarioId: 'id-1',
        nombreUsuario: 'admin',
        rol: 'ADMINISTRADOR',
      });
    });

    it('el token NO contiene la contraseña ni su hash', async () => {
      // Un JWT va firmado, no cifrado: cualquiera puede leer su contenido. Meter ahí el hash
      // sería regalarlo.
      const jwt = crearJwt();
      const generador = new JwtGeneradorTokenAdapter(jwt, crearConfig('8h'));

      const { valor } = await generador.emitir(usuarioDePrueba());
      const payload = JSON.parse(Buffer.from(valor.split('.')[1], 'base64').toString());

      expect(JSON.stringify(payload)).not.toContain('hashdementira');
      expect(payload).not.toHaveProperty('hashPassword');
      expect(payload).not.toHaveProperty('correo');
    });
  });

  describe('vigencia', () => {
    it('el exp interno del token y el expiraEn devuelto salen del mismo cálculo', async () => {
      // Es la razón por la que el adaptador pasa `expiresIn` a mano en lugar de dejar que lo
      // fije el módulo: si discreparan, el cliente creería tener sesión y la API la rechazaría.
      const jwt = crearJwt();
      const generador = new JwtGeneradorTokenAdapter(jwt, crearConfig('8h'));

      const { valor, expiraEn } = await generador.emitir(usuarioDePrueba());
      const payload = JSON.parse(Buffer.from(valor.split('.')[1], 'base64').toString());

      // Se comparan en segundos: el `exp` del JWT no tiene milisegundos.
      expect(payload.exp).toBe(Math.floor(expiraEn.getTime() / 1000));
    });

    it('respeta las horas configuradas en JWT_EXPIRACION', async () => {
      const jwt = crearJwt();
      const generador = new JwtGeneradorTokenAdapter(jwt, crearConfig('2h'));

      const antes = Date.now();
      const { expiraEn } = await generador.emitir(usuarioDePrueba());

      const horas = (expiraEn.getTime() - antes) / (60 * 60 * 1000);
      expect(horas).toBeCloseTo(2, 1);
    });

    it.each([
      ['sin configurar', undefined],
      ['no numérico', 'ocho horas'],
      ['cero', '0h'],
      ['negativo', '-3h'],
    ])('cae a 8 horas cuando el valor es %s', async (_caso, valor) => {
      const jwt = crearJwt();
      const generador = new JwtGeneradorTokenAdapter(jwt, crearConfig(valor));

      const antes = Date.now();
      const { expiraEn } = await generador.emitir(usuarioDePrueba());

      const horas = (expiraEn.getTime() - antes) / (60 * 60 * 1000);
      expect(horas).toBeCloseTo(8, 1);
    });

    it('un token ya caducado se rechaza', async () => {
      const jwt = crearJwt();
      const verificador = new JwtVerificadorTokenAdapter(jwt);

      // Se firma directamente con vigencia negativa: nació vencido.
      const vencido = await jwt.signAsync(
        { sub: 'id-1', nombreUsuario: 'admin', rol: 'ADMINISTRADOR' },
        { expiresIn: -10 },
      );

      await expect(verificador.verificar(vencido)).resolves.toBeNull();
    });
  });

  describe('el verificador rechaza lo que debe rechazar', () => {
    it('un token firmado con OTRO secreto', async () => {
      // Es la prueba que demuestra que la firma sirve de algo: sin ella, cualquiera podría
      // fabricarse un token de administrador.
      const impostor = new JwtGeneradorTokenAdapter(
        crearJwt('otro-secreto-completamente-distinto'),
        crearConfig('8h'),
      );
      const verificador = new JwtVerificadorTokenAdapter(crearJwt());

      const { valor } = await impostor.emitir(usuarioDePrueba());

      await expect(verificador.verificar(valor)).resolves.toBeNull();
    });

    it.each([
      ['basura', 'no-es-un-token'],
      ['vacío', ''],
      ['con estructura de JWT pero inventado', 'aaa.bbb.ccc'],
    ])('un token %s', async (_caso, token) => {
      const verificador = new JwtVerificadorTokenAdapter(crearJwt());

      await expect(verificador.verificar(token)).resolves.toBeNull();
    });

    it.each([
      ['sin sub', { nombreUsuario: 'admin', rol: 'ADMINISTRADOR' }],
      ['sin nombreUsuario', { sub: 'id-1', rol: 'ADMINISTRADOR' }],
      ['sin rol', { sub: 'id-1', nombreUsuario: 'admin' }],
      ['con sub numérico', { sub: 7, nombreUsuario: 'admin', rol: 'ADMINISTRADOR' }],
      ['con rol nulo', { sub: 'id-1', nombreUsuario: 'admin', rol: null }],
    ])('un token con firma VÁLIDA pero payload %s', async (_caso, payload) => {
      // Un token puede estar bien firmado y traer un payload de otra versión del sistema.
      // Confiar en su forma sin comprobarla sería el camino a un `undefined` corriendo como rol.
      const jwt = crearJwt();
      const verificador = new JwtVerificadorTokenAdapter(jwt);

      const token = await jwt.signAsync(payload);

      await expect(verificador.verificar(token)).resolves.toBeNull();
    });
  });
});
