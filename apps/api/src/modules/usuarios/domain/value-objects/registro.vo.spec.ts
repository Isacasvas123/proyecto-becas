/**
 * Pruebas de las reglas de registro (US-001), sin HTTP ni base de datos.
 *
 * Cada `describe` corresponde a un criterio de aceptación, escrito tal como está en el backlog.
 */
import { ReglaDeNegocioError } from '../../../../shared/exceptions/errores-dominio';
import { Usuario } from '../entities/usuario.entity';
import { RolUsuario } from '../enums/rol-usuario.enum';
import { Cui } from './cui.vo';
import { NombreUsuario } from './nombre-usuario.vo';
import { validarPoliticaContrasena } from './politica-contrasena';

describe('Criterio 1 — "El CUI debe tener 13 dígitos"', () => {
  it('acepta 13 dígitos', () => {
    expect(Cui.crear('2456789010101').valor).toBe('2456789010101');
  });

  it.each([
    ['con espacios, como viene impreso en el DPI', '2456 78901 0101'],
    ['con guiones', '2456-78901-0101'],
    ['con espacios alrededor', '  2456789010101 '],
  ])('normaliza el CUI escrito %s', (_caso, entrada) => {
    // Dos formas de escribir el mismo CUI tienen que chocar contra la misma unicidad.
    expect(Cui.crear(entrada).valor).toBe('2456789010101');
  });

  it.each([
    ['12 dígitos', '245678901010'],
    ['14 dígitos', '24567890101011'],
    ['con letras', '24567890101AB'],
    ['vacío', ''],
  ])('rechaza un CUI con %s', (_caso, entrada) => {
    expect(() => Cui.crear(entrada)).toThrow(ReglaDeNegocioError);
  });

  it('dos CUI con el mismo número son iguales aunque se escribieran distinto', () => {
    expect(Cui.crear('2456 78901 0101').equals(Cui.crear('2456789010101'))).toBe(true);
  });
});

describe('Criterio 2 — "mínimo 8 caracteres, al menos una mayúscula y un número"', () => {
  it.each(['Becas2026', 'Guatemala1', 'ÑANDÚ2026', 'Aaaaaaa1'])('acepta "%s"', (clave) => {
    expect(() => validarPoliticaContrasena(clave)).not.toThrow();
  });

  it.each([
    ['7 caracteres', 'Becas26', /8 caracteres/],
    ['sin mayúscula', 'becas2026', /mayúscula/],
    ['sin número', 'BecasGuate', /número/],
  ])('rechaza una contraseña %s y dice exactamente qué falta', (_caso, clave, mensaje) => {
    expect(() => validarPoliticaContrasena(clave)).toThrow(mensaje);
  });

  it('si fallan varias condiciones, las nombra todas en un solo mensaje', () => {
    // Así la persona corrige todo de una vez en vez de descubrir los errores uno por uno.
    expect(() => validarPoliticaContrasena('abc')).toThrow(
      'La contraseña debe tener al menos 8 caracteres, al menos una letra mayúscula, al menos un número.',
    );
  });

  it('rechaza lo que bcrypt truncaría en silencio: más de 72 bytes', () => {
    // 36 letras con tilde = 72 bytes; con la mayúscula y el número ya se pasa del límite.
    const larga = `A1${'á'.repeat(36)}`;

    expect(() => validarPoliticaContrasena(larga)).toThrow(/72 bytes/);
  });
});

describe('Usuario.nuevoEstudiante', () => {
  const datos = {
    id: 'id-nuevo',
    nombreUsuario: NombreUsuario.crear('ana.lopez'),
    correo: '  Ana.Lopez@Correo.GT ',
    hashPassword: '$2b$10$hash',
    nombreCompleto: '  Ana   María  López ',
    cui: Cui.crear('2456789010101'),
  };

  it('crea SIEMPRE una cuenta de ESTUDIANTE activa: el rol no viene de fuera', () => {
    const usuario = Usuario.nuevoEstudiante(datos);

    expect(usuario.rol).toBe(RolUsuario.ESTUDIANTE);
    expect(usuario.activo).toBe(true);
    expect(usuario.esAdministrador()).toBe(false);
  });

  it('normaliza el correo y los espacios del nombre', () => {
    const usuario = Usuario.nuevoEstudiante(datos);

    expect(usuario.correo).toBe('ana.lopez@correo.gt');
    expect(usuario.nombreCompleto).toBe('Ana María López');
  });

  it('conserva el CUI y guarda solo el hash, nunca la contraseña', () => {
    const usuario = Usuario.nuevoEstudiante(datos);

    expect(usuario.cui?.valor).toBe('2456789010101');
    expect(usuario.hashAlmacenado()).toBe('$2b$10$hash');
    expect(JSON.stringify(usuario)).not.toContain('$2b$');
  });

  it('exige un nombre completo', () => {
    expect(() => Usuario.nuevoEstudiante({ ...datos, nombreCompleto: '  ' })).toThrow(
      ReglaDeNegocioError,
    );
  });

  it('el nombre y el CUI sobreviven a las copias que hace el bloqueo por intentos', () => {
    // `conIntentoFallido` crea un usuario nuevo. Si olvidara copiar la identidad, un estudiante
    // perdería su CUI con su primer error de contraseña.
    const copia = Usuario.nuevoEstudiante(datos).conIntentoFallido(new Date());

    expect(copia.nombreCompleto).toBe('Ana María López');
    expect(copia.cui?.valor).toBe('2456789010101');
  });
});
