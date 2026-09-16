/**
 * PRUEBA UNITARIA — casos de uso de EPIC-04 (US-017 a US-021), con dobles de los puertos.
 */
import {
  AccesoDenegadoError,
  RecursoDuplicadoError,
  RecursoNoEncontradoError,
  ReglaDeNegocioError,
} from '../../../../shared/exceptions/errores-dominio';
import { Recomendacion } from '../../domain/enums/recomendacion.enum';
import {
  ArchivoVisible,
  ConsultaConvocatoriasEvaluacion,
  ConsultaCuentas,
  ConsultaPerfilesEvaluacion,
  ConsultaSolicitudes,
  ConvocatoriaEvaluable,
  ExpedienteVisible,
  PerfilEvaluable,
  Persona,
  SolicitudResumida,
} from '../../domain/ports/consultas-externas';
import {
  ComiteEnMemoriaRepositorio,
  DictamenEnMemoriaRepositorio,
} from '../../infrastructure/persistence/evaluaciones-en-memoria.repositorio';
import { ComitesService } from './comites.service';
import { ConsolidadoService } from './consolidado.service';
import { EvaluacionService } from './evaluacion.service';

const CONV = 'conv-1';
const OBSERVACION = 'Cumple el promedio y la documentación está completa.';

class SolicitudesFalsas implements ConsultaSolicitudes {
  readonly datos = new Map<string, SolicitudResumida>();
  iniciadas: string[] = [];
  fallaAlIniciar = false;

  agregar(id: string, estado = 'ENVIADA', estudianteId = `est-${id}`) {
    this.datos.set(id, {
      id,
      numero: `SOL-2026-00000${this.datos.size + 1}`,
      estado,
      estudianteId,
      convocatoriaId: CONV,
      enviadaEn: '2026-09-20T10:00:00.000Z',
    });
  }
  enviadasDe(convocatoriaId: string) {
    return Promise.resolve(
      [...this.datos.values()].filter(
        (s) => s.convocatoriaId === convocatoriaId && s.estado === 'ENVIADA',
      ),
    );
  }
  resumenes(ids: readonly string[]) {
    return Promise.resolve([...this.datos.values()].filter((s) => ids.includes(s.id)));
  }
  iniciarEvaluacion(ids: readonly string[]) {
    if (this.fallaAlIniciar) return Promise.reject(new Error('BD caída'));
    for (const id of ids) {
      this.datos.set(id, { ...this.datos.get(id)!, estado: 'EN_EVALUACION' });
      this.iniciadas.push(id);
    }
    return Promise.resolve();
  }
  expediente(id: string): Promise<ExpedienteVisible | null> {
    const resumen = this.datos.get(id);
    return Promise.resolve(
      resumen === undefined
        ? null
        : {
            resumen,
            convocatoriaTitulo: 'Beca Universitaria 2026',
            documentos: [
              {
                tipo: 'DPI',
                descripcion: 'DPI',
                cargado: true,
                nombreArchivo: 'dpi.pdf',
                tamanoBytes: 10,
              },
            ],
          },
    );
  }
  documento(): Promise<ArchivoVisible | null> {
    return Promise.resolve({
      contenido: Buffer.from('%PDF'),
      nombreArchivo: 'dpi.pdf',
      tipoContenido: 'application/pdf',
    });
  }
}

class ConvocatoriasFalsas implements ConsultaConvocatoriasEvaluacion {
  tipo = 'UNIVERSITARIA';
  cupos = 1;
  buscar(id: string): Promise<ConvocatoriaEvaluable | null> {
    return Promise.resolve(
      id === CONV
        ? {
            id,
            codigo: 'UNIV-2026-001',
            titulo: 'Beca Universitaria 2026',
            tipo: this.tipo,
            cupos: this.cupos,
          }
        : null,
    );
  }
}

class PerfilesFalsos implements ConsultaPerfilesEvaluacion {
  readonly perfiles = new Map<string, Partial<PerfilEvaluable>>();
  perfil(estudianteId: string): Promise<PerfilEvaluable> {
    return Promise.resolve({
      centroEducativo: 'UMG',
      nivel: 'UNIVERSITARIO',
      promedio: 80,
      ingresoFamiliarMensual: 2750,
      dependientes: 1,
      departamento: 'PETEN',
      municipio: 'Flores',
      ...this.perfiles.get(estudianteId),
    });
  }
}

class CuentasFalsas implements ConsultaCuentas {
  readonly cuentas: Persona[] = [
    {
      id: 'ev-1',
      nombreCompleto: 'Eva Uno',
      nombreUsuario: 'eva1',
      rol: 'EVALUADOR',
      activo: true,
    },
    {
      id: 'ev-2',
      nombreCompleto: 'Eva Dos',
      nombreUsuario: 'eva2',
      rol: 'EVALUADOR',
      activo: true,
    },
    {
      id: 'ev-baja',
      nombreCompleto: 'Eva Baja',
      nombreUsuario: 'eva3',
      rol: 'EVALUADOR',
      activo: false,
    },
    {
      id: 'est-1',
      nombreCompleto: 'Ana Pérez',
      nombreUsuario: 'ana',
      rol: 'ESTUDIANTE',
      activo: true,
    },
    {
      id: 'admin',
      nombreCompleto: 'Admin',
      nombreUsuario: 'admin',
      rol: 'ADMINISTRADOR',
      activo: true,
    },
  ];
  evaluadores() {
    return Promise.resolve(this.cuentas.filter((c) => c.rol === 'EVALUADOR'));
  }
  personas(ids: readonly string[]) {
    return Promise.resolve(this.cuentas.filter((c) => ids.includes(c.id)));
  }
}

function montar() {
  const comites = new ComiteEnMemoriaRepositorio();
  const dictamenes = new DictamenEnMemoriaRepositorio();
  const solicitudes = new SolicitudesFalsas();
  const convocatorias = new ConvocatoriasFalsas();
  const perfiles = new PerfilesFalsos();
  const cuentas = new CuentasFalsas();
  return {
    comites,
    dictamenes,
    solicitudes,
    convocatorias,
    perfiles,
    cuentas,
    gestion: new ComitesService(comites, dictamenes, convocatorias, cuentas, solicitudes),
    evaluacion: new EvaluacionService(
      comites,
      dictamenes,
      solicitudes,
      convocatorias,
      perfiles,
      cuentas,
    ),
    consolidado: new ConsolidadoService(comites, dictamenes, solicitudes, convocatorias, cuentas),
  };
}

const crearComite = (m: ReturnType<typeof montar>, evaluadorIds = ['ev-1', 'ev-2']) =>
  m.gestion.crear({ nombre: 'Comité 2026', convocatoriaId: CONV, evaluadorIds }, 'admin');

describe('Casos de uso de evaluaciones', () => {
  describe('crear comité (US-017)', () => {
    it('crea con integrantes, criterio de la convocatoria y autoría', async () => {
      const dto = await crearComite(montar());
      expect(dto).toMatchObject({
        nombre: 'Comité 2026',
        convocatoria: { codigo: 'UNIV-2026-001', cupos: 1 },
        criterio: 'Mixto (60 % mérito académico · 40 % necesidad socioeconómica)',
        creadoPor: 'Admin',
      });
      expect(dto.integrantes.map((i) => i.nombreCompleto)).toEqual(['Eva Uno', 'Eva Dos']);
    });

    it('una convocatoria, un comité (3a)', async () => {
      const m = montar();
      await crearComite(m);
      await expect(crearComite(m)).rejects.toThrow(RecursoDuplicadoError);
    });

    it('404 si la convocatoria no existe', async () => {
      await expect(
        montar().gestion.crear(
          { nombre: 'X comité', convocatoriaId: 'nada', evaluadorIds: ['ev-1'] },
          'admin',
        ),
      ).rejects.toThrow(RecursoNoEncontradoError);
    });

    it('sin cuentas de evaluador, dice que primero hay que crearlas (4a)', async () => {
      const m = montar();
      m.cuentas.cuentas.splice(0, 3);
      await expect(crearComite(m, [])).rejects.toThrow(/Todavía no hay cuentas de evaluador/);
    });

    it('rechaza estudiantes, administradores y evaluadores inactivos', async () => {
      for (const id of ['est-1', 'admin', 'ev-baja', 'no-existe']) {
        await expect(crearComite(montar(), ['ev-1', id])).rejects.toThrow(
          /no es una cuenta de evaluador activa/,
        );
      }
    });

    it('agrega integrantes validados', async () => {
      const m = montar();
      const { id } = await crearComite(m, ['ev-1']);
      const dto = await m.gestion.agregarEvaluadores(id, ['ev-2']);
      expect(dto.integrantes).toHaveLength(2);
      await expect(m.gestion.agregarEvaluadores(id, ['est-1'])).rejects.toThrow(
        ReglaDeNegocioError,
      );
    });
  });

  describe('asignar (US-018)', () => {
    async function conSolicitudes() {
      const m = montar();
      m.solicitudes.agregar('s1');
      m.solicitudes.agregar('s2');
      m.solicitudes.agregar('s3');
      m.solicitudes.agregar('s-borrador', 'BORRADOR');
      const comite = await crearComite(m);
      return { ...m, comiteId: comite.id };
    }

    it('lista solo las ENVIADAS (criterio 1)', async () => {
      const m = await conSolicitudes();
      const lista = await m.gestion.porAsignar(m.comiteId);
      expect(lista.map((s) => s.id)).toEqual(['s1', 's2', 's3']);
    });

    it('automático: reparte equitativamente y las pasa a EN_EVALUACION (criterios 3 y 4)', async () => {
      const m = await conSolicitudes();
      const r = await m.gestion.asignar(
        m.comiteId,
        { modo: 'AUTOMATICO', porSolicitud: 1 },
        'admin',
      );

      expect(r).toEqual({ solicitudes: 3, asignaciones: 3 });
      expect(m.solicitudes.iniciadas).toEqual(['s1', 's2', 's3']);
      const porEvaluador = m.comites.asignaciones.map((a) => a.evaluadorId);
      expect(porEvaluador.filter((e) => e === 'ev-1')).toHaveLength(2);
      expect(porEvaluador.filter((e) => e === 'ev-2')).toHaveLength(1);
      expect(m.comites.asignaciones[0].asignadaPor).toBe('admin');
    });

    it('manual: asigna a quien se indica', async () => {
      const m = await conSolicitudes();
      await m.gestion.asignar(
        m.comiteId,
        { modo: 'MANUAL', asignaciones: [{ solicitudId: 's2', evaluadorIds: ['ev-2', 'ev-1'] }] },
        'admin',
      );
      expect(m.comites.asignaciones.map((a) => a.evaluadorId)).toEqual(['ev-2', 'ev-1']);
      expect(m.solicitudes.iniciadas).toEqual(['s2']);
    });

    it.each([
      [
        'sin evaluador (criterio 2)',
        { solicitudId: 's1', evaluadorIds: [] },
        /al menos a un evaluador/,
      ],
      [
        'a alguien ajeno al comité',
        { solicitudId: 's1', evaluadorIds: ['ev-baja'] },
        /integrantes/,
      ],
      [
        'una solicitud en borrador (criterio 1)',
        { solicitudId: 's-borrador', evaluadorIds: ['ev-1'] },
        /ENVIADAS/,
      ],
    ])('manual: rechaza asignar %s, sin guardar nada', async (_caso, asignacion, mensaje) => {
      const m = await conSolicitudes();
      await expect(
        m.gestion.asignar(m.comiteId, { modo: 'MANUAL', asignaciones: [asignacion] }, 'admin'),
      ).rejects.toThrow(mensaje);
      expect(m.comites.asignaciones).toHaveLength(0);
      expect(m.solicitudes.iniciadas).toHaveLength(0);
    });

    it('sin nada pendiente, lo dice', async () => {
      const m = await conSolicitudes();
      await m.gestion.asignar(m.comiteId, { modo: 'AUTOMATICO', porSolicitud: 1 }, 'admin');
      await expect(
        m.gestion.asignar(m.comiteId, { modo: 'AUTOMATICO', porSolicitud: 1 }, 'admin'),
      ).rejects.toThrow(/No hay solicitudes enviadas pendientes/);
    });

    it('si falla el cambio de estado, repetir es seguro: no duplica asignaciones', async () => {
      const m = await conSolicitudes();
      m.solicitudes.fallaAlIniciar = true;
      await expect(
        m.gestion.asignar(m.comiteId, { modo: 'AUTOMATICO', porSolicitud: 1 }, 'admin'),
      ).rejects.toThrow('BD caída');

      m.solicitudes.fallaAlIniciar = false;
      await m.gestion.asignar(m.comiteId, { modo: 'AUTOMATICO', porSolicitud: 1 }, 'admin');
      const pares = m.comites.asignaciones.map((a) => `${a.solicitudId}:${a.evaluadorId}`);
      expect(new Set(pares).size).toBe(pares.length);
      expect(m.solicitudes.iniciadas).toEqual(['s1', 's2', 's3']);
    });
  });

  describe('evaluar (US-019) y mis asignadas (US-020)', () => {
    async function asignada() {
      const m = montar();
      m.solicitudes.agregar('s1', 'ENVIADA', 'est-1');
      m.solicitudes.agregar('s2', 'ENVIADA', 'est-2');
      const { id } = await crearComite(m, ['ev-1']);
      await m.gestion.asignar(id, { modo: 'AUTOMATICO', porSolicitud: 1 }, 'admin');
      return { ...m, comiteId: id };
    }

    it('otro evaluador recibe 403 al ver, descargar o dictaminar (CU-10, 1a)', async () => {
      const m = await asignada();
      await expect(m.evaluacion.expediente('ev-2', 's1')).rejects.toThrow(AccesoDenegadoError);
      await expect(m.evaluacion.documento('ev-2', 's1', 'DPI')).rejects.toThrow(
        AccesoDenegadoError,
      );
      await expect(
        m.evaluacion.emitir('ev-2', 's1', {
          recomendacion: Recomendacion.FAVORABLE,
          observacion: OBSERVACION,
        }),
      ).rejects.toThrow(AccesoDenegadoError);
    });

    it('el expediente trae solicitante, documentos y el puntaje calculado (criterios 1 y 2)', async () => {
      const m = await asignada();
      const dto = await m.evaluacion.expediente('ev-1', 's1');
      expect(dto.solicitante).toMatchObject({ nombreCompleto: 'Ana Pérez', promedio: 80 });
      expect(dto.documentos).toHaveLength(1);
      // 80 × 0.6 + 50 × 0.4 (Q2,750 por persona = mitad del tramo)
      expect(dto.calculo?.puntaje).toBe(68);
      expect(dto.puedeDictaminar).toBe(true);
      expect(dto.dictamen).toBeNull();
    });

    it('si falta un dato del perfil, lo dice y no deja dictaminar', async () => {
      const m = await asignada();
      m.perfiles.perfiles.set('est-1', { dependientes: null });
      const dto = await m.evaluacion.expediente('ev-1', 's1');
      expect(dto.calculo).toBeNull();
      expect(dto.problemaCalculo).toMatch(/dependientes/);
      expect(dto.puedeDictaminar).toBe(false);
      await expect(
        m.evaluacion.emitir('ev-1', 's1', {
          recomendacion: Recomendacion.FAVORABLE,
          observacion: OBSERVACION,
        }),
      ).rejects.toThrow(/dependientes/);
    });

    it('el criterio cambia con el tipo de beca, sin tocar el servicio', async () => {
      const m = await asignada();
      m.convocatorias.tipo = 'POSGRADO';
      const dto = await m.evaluacion.expediente('ev-1', 's1');
      expect(dto.calculo).toMatchObject({ criterio: 'Mérito académico', puntaje: 80 });
    });

    it('emite una sola vez; el segundo intento es 409 (criterio 4)', async () => {
      const m = await asignada();
      const dictamen = await m.evaluacion.emitir(
        'ev-1',
        's1',
        { recomendacion: Recomendacion.FAVORABLE, observacion: OBSERVACION },
        new Date('2026-10-02T09:00:00Z'),
      );
      expect(dictamen).toMatchObject({
        puntaje: 68,
        recomendacion: 'FAVORABLE',
        emitidoEn: '2026-10-02T09:00:00.000Z',
      });
      await expect(
        m.evaluacion.emitir('ev-1', 's1', {
          recomendacion: Recomendacion.DESFAVORABLE,
          observacion: OBSERVACION,
        }),
      ).rejects.toThrow(RecursoDuplicadoError);

      const dto = await m.evaluacion.expediente('ev-1', 's1');
      expect(dto.puedeDictaminar).toBe(false);
      expect(dto.dictamen?.recomendacion).toBe('FAVORABLE');
    });

    it('sin observación suficiente no se emite (criterio 3)', async () => {
      const m = await asignada();
      await expect(
        m.evaluacion.emitir('ev-1', 's1', {
          recomendacion: Recomendacion.FAVORABLE,
          observacion: 'bien',
        }),
      ).rejects.toThrow(/Justifique su dictamen/);
    });

    it('solo se dictamina lo que está en evaluación', async () => {
      const m = await asignada();
      m.solicitudes.agregar('s9', 'ENVIADA');
      await m.comites.guardarAsignaciones([
        {
          comiteId: m.comiteId,
          solicitudId: 's9',
          evaluadorId: 'ev-1',
          asignadaPor: 'admin',
          asignadaEn: new Date(),
        },
      ]);
      await expect(
        m.evaluacion.emitir('ev-1', 's9', {
          recomendacion: Recomendacion.FAVORABLE,
          observacion: OBSERVACION,
        }),
      ).rejects.toThrow(/Solo se dictaminan solicitudes en evaluación/);
    });

    it('mis asignadas: solo las propias, pendientes primero, con su dictamen', async () => {
      const m = await asignada();
      await m.evaluacion.emitir('ev-1', 's1', {
        recomendacion: Recomendacion.DESFAVORABLE,
        observacion: OBSERVACION,
      });

      const lista = await m.evaluacion.asignadas('ev-1');
      expect(lista.map((a) => [a.solicitudId, a.dictaminada])).toEqual([
        ['s2', false],
        ['s1', true],
      ]);
      expect(lista[1]).toMatchObject({ puntaje: 68, recomendacion: 'DESFAVORABLE' });
      expect(lista[0].convocatoria).toBe('Beca Universitaria 2026 (UNIV-2026-001)');
      expect(await m.evaluacion.asignadas('ev-2')).toEqual([]);
    });
  });

  describe('consolidado (US-021)', () => {
    it('promedia, ordena y marca lo que cabe en los cupos', async () => {
      const m = montar();
      m.solicitudes.agregar('s1', 'ENVIADA', 'est-1');
      m.solicitudes.agregar('s2', 'ENVIADA', 'est-2');
      m.solicitudes.agregar('s3', 'ENVIADA', 'est-3');
      m.perfiles.perfiles.set('est-2', { promedio: 100, ingresoFamiliarMensual: 500 });
      const { id } = await crearComite(m);
      await m.gestion.asignar(id, { modo: 'AUTOMATICO', porSolicitud: 2 }, 'admin');

      const emitir = (ev: string, s: string, r: Recomendacion) =>
        m.evaluacion.emitir(ev, s, { recomendacion: r, observacion: OBSERVACION });
      await emitir('ev-1', 's1', Recomendacion.FAVORABLE);
      await emitir('ev-2', 's1', Recomendacion.DESFAVORABLE);
      await emitir('ev-1', 's2', Recomendacion.FAVORABLE);

      const c = await m.consolidado.deComite(id);
      expect(c.cupos).toBe(1);
      expect(c.completas).toBe(1);
      expect(c.filas.map((f) => [f.solicitudId, f.posicion, f.dentroDeCupos])).toEqual([
        ['s2', 1, true],
        ['s1', 2, false],
        ['s3', null, false],
      ]);
      expect(c.filas[1]).toMatchObject({
        estudiante: 'Ana Pérez',
        evaluadoresAsignados: 2,
        dictamenesEmitidos: 2,
        puntajePromedio: 68,
        favorables: 1,
        desfavorables: 1,
      });
    });

    it('404 si el comité no existe', async () => {
      await expect(montar().consolidado.deComite('nada')).rejects.toThrow(RecursoNoEncontradoError);
    });
  });
});
