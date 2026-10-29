/**
 * Pruebas del adaptador de bcrypt, con la biblioteca real (DEF-02).
 *
 * El adaptador es una de las piezas del patrón Adapter y estaba a 0 % de cobertura: las pruebas
 * del caso de uso y las de integración le inyectan un doble, así que `bcryptjs` real nunca se
 * ejecutaba. Aquí no hay doble, porque lo que se comprueba es el contrato con la biblioteca: que
 * el hash se verifique, que dos hashes del mismo texto sean distintos y que un hash corrupto no
 * reviente la API.
 *
 * Usa 4 rondas y no 10 porque bcrypt es lento a propósito y con 10 cada `calcular` tardaría
 * cientos de milisegundos. 4 es el mínimo que acepta la biblioteca y basta para el contrato; el
 * coste es una decisión de configuración, no de comportamiento.
 */
import { ConfigService } from '@nestjs/config';

import { BcryptHasherAdapter } from './bcrypt-hasher.adapter';

function crearAdaptador(rondas?: string): BcryptHasherAdapter {
  const config = {
    get: (clave: string): string | undefined => (clave === 'BCRYPT_ROUNDS' ? rondas : undefined),
  } as unknown as ConfigService;

  return new BcryptHasherAdapter(config);
}

describe('BcryptHasherAdapter', () => {
  describe('calcular y verificar', () => {
    it('el hash que calcula se puede verificar con la contraseña original', async () => {
      const hasher = crearAdaptador('4');

      const hash = await hasher.calcular('EC321-secreta');

      await expect(hasher.verificar('EC321-secreta', hash)).resolves.toBe(true);
    });

    it('rechaza una contraseña distinta', async () => {
      const hasher = crearAdaptador('4');

      const hash = await hasher.calcular('la-correcta');

      await expect(hasher.verificar('la-incorrecta', hash)).resolves.toBe(false);
    });

    it('distingue mayúsculas y minúsculas', async () => {
      const hasher = crearAdaptador('4');

      const hash = await hasher.calcular('Secreta');

      await expect(hasher.verificar('secreta', hash)).resolves.toBe(false);
    });

    it('el hash NUNCA contiene la contraseña en claro', async () => {
      // Es el NFR de seguridad del backlog, comprobado y no solo afirmado.
      const hasher = crearAdaptador('4');

      const hash = await hasher.calcular('contrasena-visible');

      expect(hash).not.toContain('contrasena-visible');
    });

    it('dos hashes de la misma contraseña son distintos entre sí', async () => {
      // bcrypt incorpora una sal aleatoria. Si dos hashes iguales dieran el mismo resultado,
      // una tabla precalculada podría romper todas las cuentas con la misma contraseña.
      const hasher = crearAdaptador('4');

      const primero = await hasher.calcular('misma-contrasena');
      const segundo = await hasher.calcular('misma-contrasena');

      expect(primero).not.toBe(segundo);
      // Y aun así los dos verifican: la sal viaja dentro del hash.
      await expect(hasher.verificar('misma-contrasena', primero)).resolves.toBe(true);
      await expect(hasher.verificar('misma-contrasena', segundo)).resolves.toBe(true);
    });
  });

  describe('un hash corrupto no debe reventar la API', () => {
    it('devuelve false en lugar de lanzar cuando el hash no tiene formato bcrypt', async () => {
      // Si esto lanzara, la API respondería 500 y delataría que hay algo roto en la base.
      // El comportamiento correcto es el mismo fallo genérico de autenticación.
      const hasher = crearAdaptador('4');

      await expect(hasher.verificar('cualquiera', 'esto-no-es-un-hash')).resolves.toBe(false);
    });

    it('devuelve false con un hash vacío', async () => {
      const hasher = crearAdaptador('4');

      await expect(hasher.verificar('cualquiera', '')).resolves.toBe(false);
    });
  });

  describe('rondas configuradas', () => {
    it('usa las rondas del entorno cuando son válidas', async () => {
      const hasher = crearAdaptador('5');

      const hash = await hasher.calcular('x');

      // El coste viaja en el propio hash, en el segmento `$2b$NN$`.
      expect(hash).toContain('$05$');
    });

    it.each([
      ['sin configurar', undefined],
      ['no numérico', 'diez'],
      ['por debajo del mínimo', '3'],
      ['por encima del máximo', '99'],
      ['decimal', '10.5'],
    ])('cae a 10 rondas cuando el valor es %s', async (_caso, valor) => {
      // Un valor inválido en el .env no debe degradar la seguridad en silencio: el adaptador
      // prefiere el valor seguro por defecto antes que obedecer una configuración rota.
      const hasher = crearAdaptador(valor);

      const hash = await hasher.calcular('x');

      expect(hash).toContain('$10$');
    });
  });
});
