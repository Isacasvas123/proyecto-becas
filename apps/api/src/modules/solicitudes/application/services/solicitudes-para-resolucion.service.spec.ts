/**
 * PRUEBA UNITARIA — la puerta de `solicitudes` para EPIC-05, con el repositorio en memoria: el
 * cupo, la beca con código correlativo y la búsqueda por número.
 */
import {
  RecursoNoEncontradoError,
  TransicionInvalidaError,
} from '../../../../shared/exceptions/errores-dominio';
import { Solicitud } from '../../domain/entities/solicitud.entity';
import { NombreEstado } from '../../domain/enums/solicitud.enums';
import { ArchivoDocumento } from '../../domain/value-objects/archivo-documento.vo';
import { SolicitudEnMemoriaRepositorio } from '../../infrastructure/persistence/solicitud-en-memoria.repositorio';
import { SolicitudesParaResolucionService } from './solicitudes-para-resolucion.service';

const AHORA = new Date('2026-10-05T10:00:00Z');
const PDF = ArchivoDocumento.crear({
  nombreOriginal: 'dpi.pdf',
  tipoContenido: 'application/pdf',
  contenido: Buffer.from('%PDF-1.7'),
});

function enEvaluacion(n: number): Solicitud {
  const s = Solicitud.nueva({
    id: `s${n}`,
    numero: `SOL-2026-00000${n}`,
    estudianteId: `e${n}`,
    convocatoriaId: 'conv',
    documentosExigidos: ['DPI'],
    ahora: AHORA,
  });
  s.cargarDocumento('DPI', PDF, 'ref', AHORA);
  s.enviar(AHORA, `e${n}`);
  s.iniciarEvaluacion(AHORA, 'admin');
  return s;
}

function montar() {
  const repositorio = new SolicitudEnMemoriaRepositorio([
    enEvaluacion(1),
    enEvaluacion(2),
    enEvaluacion(3),
  ]);
  return { repositorio, servicio: new SolicitudesParaResolucionService(repositorio) };
}

const MOTIVO = 'Cumple todos los requisitos de la convocatoria.';

describe('SolicitudesParaResolucionService', () => {
  it('aprueba mientras haya cupo y rechaza la que ya no cabe', async () => {
    const { servicio, repositorio } = montar();
    await servicio.resolver('s1', 'APROBAR', MOTIVO, 'admin', 2);
    await servicio.resolver('s2', 'APROBAR', MOTIVO, 'admin', 2);

    await expect(servicio.resolver('s3', 'APROBAR', MOTIVO, 'admin', 2)).rejects.toThrow(
      /ya no tiene cupos disponibles/,
    );
    expect((await repositorio.buscarPorId('s3'))?.nombreEstado).toBe(NombreEstado.EN_EVALUACION);
    await expect(servicio.ocupacion('conv')).resolves.toEqual({ aprobadas: 2, adjudicadas: 0 });
  });

  it('rechazar no consume cupo aunque no quede ninguno', async () => {
    const { servicio } = montar();
    await servicio.resolver('s1', 'APROBAR', MOTIVO, 'admin', 1);
    const r = await servicio.resolver('s2', 'RECHAZAR', MOTIVO, 'admin', 1);
    expect(r.estado).toBe('RECHAZADA');
  });

  it('la resolución queda en el historial con autor y motivo', async () => {
    const { servicio, repositorio } = montar();
    await servicio.resolver('s1', 'RECHAZAR', MOTIVO, 'admin-7', 1, AHORA);
    expect((await repositorio.buscarPorId('s1'))?.listaHistorial().at(-1)).toMatchObject({
      hacia: NombreEstado.RECHAZADA,
      autorId: 'admin-7',
      motivo: MOTIVO,
      ocurridoEn: AHORA,
    });
  });

  it('adjudicar crea becas con código correlativo por año', async () => {
    const { servicio } = montar();
    await servicio.resolver('s1', 'APROBAR', MOTIVO, 'admin', 5);
    await servicio.resolver('s2', 'APROBAR', MOTIVO, 'admin', 5);

    const a = await servicio.adjudicar('s1', 'admin', AHORA);
    const b = await servicio.adjudicar('s2', 'admin', AHORA);
    expect(a.beca).toEqual({ codigo: 'BECA-2026-000001', otorgadaEn: AHORA.toISOString() });
    expect(b.beca?.codigo).toBe('BECA-2026-000002');
    await expect(servicio.ocupacion('conv')).resolves.toEqual({ aprobadas: 0, adjudicadas: 2 });
  });

  it('no adjudica dos veces ni lo que no está aprobado', async () => {
    const { servicio } = montar();
    await expect(servicio.adjudicar('s1', 'admin')).rejects.toThrow(TransicionInvalidaError);
    await servicio.resolver('s1', 'APROBAR', MOTIVO, 'admin', 5);
    await servicio.adjudicar('s1', 'admin');
    await expect(servicio.adjudicar('s1', 'admin')).rejects.toThrow(TransicionInvalidaError);
  });

  it('busca por número y por id; 404 al resolver una inexistente', async () => {
    const { servicio } = montar();
    await expect(servicio.porNumero('SOL-2026-000002')).resolves.toMatchObject({ id: 's2' });
    await expect(servicio.porNumero('SOL-2026-000009')).resolves.toBeNull();
    await expect(servicio.resumen('nada')).resolves.toBeNull();
    await expect(servicio.resolver('nada', 'APROBAR', MOTIVO, 'a', 1)).rejects.toThrow(
      RecursoNoEncontradoError,
    );
  });
});
