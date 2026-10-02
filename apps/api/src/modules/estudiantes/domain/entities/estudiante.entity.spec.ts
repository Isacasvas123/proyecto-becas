import { ReglaDeNegocioError } from '../../../../shared/exceptions/errores-dominio';
import { Departamento, NivelAcademico } from '../enums/catalogos';
import { DatosPerfil, Estudiante } from './estudiante.entity';

const COMPLETO: DatosPerfil = {
  centroEducativo: 'Universidad Mariano Gálvez',
  nivel: NivelAcademico.UNIVERSITARIO,
  promedio: 82.5,
  ingresoFamiliarMensual: 4500,
  dependientes: 3,
  departamento: Departamento.QUETZALTENANGO,
  municipio: 'Salcajá',
};

describe('Estudiante (US-011)', () => {
  it('con todos los datos, el perfil está completo', () => {
    const perfil = new Estudiante('u1', COMPLETO);

    expect(perfil.perfilCompleto()).toBe(true);
    expect(perfil.camposFaltantes()).toEqual([]);
  });

  it('dice con nombre legible qué falta', () => {
    const perfil = new Estudiante('u1', { ...COMPLETO, promedio: null, municipio: null });

    expect(perfil.perfilCompleto()).toBe(false);
    expect(perfil.camposFaltantes()).toEqual(['promedio', 'municipio']);
  });

  it('cero es un valor válido, no un dato faltante', () => {
    const perfil = new Estudiante('u1', {
      ...COMPLETO,
      ingresoFamiliarMensual: 0,
      dependientes: 0,
    });

    expect(perfil.perfilCompleto()).toBe(true);
  });

  it('un texto en blanco cuenta como faltante', () => {
    const perfil = new Estudiante('u1', { ...COMPLETO, centroEducativo: '   ' });

    expect(perfil.perfilCompleto()).toBe(false);
  });

  it.each([
    ['promedio mayor a 100', { promedio: 100.5 }],
    ['promedio negativo', { promedio: -1 }],
    ['ingreso negativo', { ingresoFamiliarMensual: -10 }],
    ['dependientes decimales', { dependientes: 1.5 }],
    ['dependientes negativos', { dependientes: -1 }],
  ])('rechaza %s (criterio 2)', (_caso, cambios) => {
    expect(() => new Estudiante('u1', { ...COMPLETO, ...cambios })).toThrow(ReglaDeNegocioError);
  });

  it('acepta los extremos del promedio', () => {
    expect(() => new Estudiante('u1', { ...COMPLETO, promedio: 0 })).not.toThrow();
    expect(() => new Estudiante('u1', { ...COMPLETO, promedio: 100 })).not.toThrow();
  });
});
