/**
 * PRUEBAS DEL ADAPTADOR DE BCRYPT — con la biblioteca REAL.
 *
 * POR QUÉ ESTA PRUEBA EXISTE (defecto DEF-02)
 *   Este adaptador es una de las tres piezas del patrón **Adapter**, el único patrón
 *   implementado del proyecto y el que se presenta como evidencia ante el catedrático. Y
 *   estaba a **0 % de cobertura**: las pruebas del caso de uso le inyectan un doble, y las de
 *   integración también, así que `bcryptjs` real nunca se ejecutaba en ninguna prueba.
 *
 *   Aquí NO se usa doble. Se ejercita bcrypt de verdad, porque lo que hay que comprobar es
 *   precisamente el contrato con la biblioteca: que el hash se pueda verificar, que dos
 *   hashes del mismo texto sean distintos, y que un hash corrupto no reviente la API.
 *
 * POR QUÉ USA 4 RONDAS Y NO 10
 *   bcrypt es lento a propósito. Con las 10 rondas de desarrollo cada `calcular` tardaría
 *   cientos de milisegundos y esta prueba haría lenta toda la suite. 4 es el mínimo que
 *   acepta la biblioteca y basta para verificar el contrato: la robustez del coste es una
 *   decisión de configuración, no de comportamiento.
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
