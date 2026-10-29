/**
 * Prueba de integración (disco real, en una carpeta temporal) — adaptador de almacenamiento local.
 */
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { AlmacenamientoLocalAdapter } from './almacenamiento-local.adapter';

describe('AlmacenamientoLocalAdapter', () => {
  let carpeta: string;
  let adaptador: AlmacenamientoLocalAdapter;

  beforeEach(async () => {
    carpeta = await mkdtemp(join(tmpdir(), 'becas-docs-'));
    adaptador = new AlmacenamientoLocalAdapter(carpeta);
  });

  afterEach(async () => {
    await rm(carpeta, { recursive: true, force: true });
  });

  it('guarda, lee y elimina', async () => {
    const referencia = await adaptador.guardar(Buffer.from('hola'), {
      carpeta: 'sol-1',
      nombre: 'dpi.pdf',
    });

    expect(referencia).toBe('sol-1/dpi.pdf');
    expect((await adaptador.obtener(referencia)).toString()).toBe('hola');

    await adaptador.eliminar(referencia);
    await expect(adaptador.obtener(referencia)).rejects.toThrow();
  });

  it('nunca sobrescribe un archivo existente', async () => {
    const destino = { carpeta: 'sol-1', nombre: 'dpi.pdf' };
    await adaptador.guardar(Buffer.from('uno'), destino);

    await expect(adaptador.guardar(Buffer.from('dos'), destino)).rejects.toThrow();
    expect((await adaptador.obtener('sol-1/dpi.pdf')).toString()).toBe('uno');
  });

  it('eliminar algo que no existe no es un error', async () => {
    await expect(adaptador.eliminar('sol-1/nada.pdf')).resolves.toBeUndefined();
  });

  it.each(['../fuera.txt', '../../.env', 'sol-1/../../fuera.txt', '.'])(
    'no sale de su carpeta con la referencia %s',
    async (referencia) => {
      await expect(adaptador.obtener(referencia)).rejects.toThrow(/fuera de la carpeta permitida/);
      await expect(adaptador.eliminar(referencia)).rejects.toThrow(/fuera de la carpeta permitida/);
    },
  );

  it('no escribe fuera de su carpeta', async () => {
    await expect(
      adaptador.guardar(Buffer.from('x'), { carpeta: '..', nombre: 'escape.txt' }),
    ).rejects.toThrow(/fuera de la carpeta permitida/);
  });
});
