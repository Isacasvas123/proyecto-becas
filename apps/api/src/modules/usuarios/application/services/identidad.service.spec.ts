import { Usuario } from '../../domain/entities/usuario.entity';
import { Cui } from '../../domain/value-objects/cui.vo';
import { NombreUsuario } from '../../domain/value-objects/nombre-usuario.vo';
import { UsuarioEnMemoriaRepositorio } from '../../infrastructure/persistence/usuario-en-memoria.repositorio';
import { IdentidadService } from './identidad.service';

describe('IdentidadService (US-025)', () => {
  const servicio = new IdentidadService(
    new UsuarioEnMemoriaRepositorio([
      Usuario.nuevoEstudiante({
        id: 'u1',
        nombreUsuario: NombreUsuario.crear('ana.lopez'),
        correo: 'ana@correo.gt',
        hashPassword: 'x',
        nombreCompleto: 'Ana López',
        cui: Cui.crear('2456 78901 0101'),
      }),
    ]),
  );

  it('acepta el CUI con o sin espacios', async () => {
    await expect(servicio.cuiCoincide('u1', '2456789010101')).resolves.toBe(true);
    await expect(servicio.cuiCoincide('u1', '2456 78901 0101')).resolves.toBe(true);
  });

  it.each([
    ['otro CUI', 'u1', '1111111110101'],
    ['un CUI mal formado, sin lanzar', 'u1', 'abc'],
    ['una cuenta que no existe', 'nadie', '2456789010101'],
  ])('responde que no con %s', async (_caso, id, cui) => {
    await expect(servicio.cuiCoincide(id, cui)).resolves.toBe(false);
  });
});
