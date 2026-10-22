/**
 * PRUEBA UNITARIA — casos de uso de EPIC-03 (US-012 a US-015).
 *
 * Los otros módulos se sustituyen por dobles de sus PUERTOS (`ConsultaConvocatorias`,
 * `ConsultaPerfiles`): así se prueba que `solicitudes` solo depende de lo que declaró necesitar.
 */
import {
  AccesoDenegadoError,
  RecursoDuplicadoError,
  RecursoNoEncontradoError,
  ReglaDeNegocioError,
  TransicionInvalidaError,
} from '../../../../shared/exceptions/errores-dominio';
import { NombreEstado } from '../../domain/enums/solicitud.enums';
import { AlmacenamientoDocumentos } from '../../domain/ports/almacenamiento-documentos';
import {
  ConsultaConvocatorias,
  ConsultaPerfiles,
  ConvocatoriaDeSolicitud,
  EstadoDePerfil,
} from '../../domain/ports/consultas-externas';
import {
  AvisoSolicitudEnviada,
  NotificadorSolicitudes,
} from '../../domain/ports/notificador-solicitudes';
import { AlmacenamientoMemoriaAdapter } from '../../infrastructure/almacenamiento/almacenamiento-memoria.adapter';
import { SolicitudEnMemoriaRepositorio } from '../../infrastructure/persistence/solicitud-en-memoria.repositorio';
import { CargarDocumentoService } from './cargar-documento.service';
import { CrearSolicitudService } from './crear-solicitud.service';
import { EnviarSolicitudService } from './enviar-solicitud.service';
import { ExpedienteService } from './expediente.service';
import { PublicadorEventosSolicitud } from './publicador-eventos.service';
import { Solicitud } from '../../domain/entities/solicitud.entity';

const AHORA = new Date('2026-09-16T15:00:00Z');
const CONVOCATORIA_ID = 'c1';
const PDF = {
  nombreOriginal: 'dpi.pdf',
  tipoContenido: 'application/pdf',
  contenido: Buffer.from('%PDF-1.7'),
};

class ConvocatoriasFalsas implements ConsultaConvocatorias {
  convocatoria: ConvocatoriaDeSolicitud | null = {
    id: CONVOCATORIA_ID,
    codigo: 'UNIV-2026-001',
    titulo: 'Beca Universitaria 2026',
    admiteSolicitudes: true,
    fechaCierre: new Date('2026-12-31T00:00:00Z'),
    montoBeca: 5000,
    documentosExigidos: [
      { codigo: 'DPI', descripcion: 'Documento Personal de Identificación' },
      { codigo: 'CERTIFICADO_NOTAS', descripcion: 'Certificado de notas' },
    ],
  };
  buscar(id: string) {
    return Promise.resolve(id === CONVOCATORIA_ID ? this.convocatoria : null);
  }
}

class PerfilesFalsos implements ConsultaPerfiles {
  estadoActual: EstadoDePerfil = { completo: true, camposFaltantes: [] };
  estado() {
    return Promise.resolve(this.estadoActual);
  }
}

class NotificadorEspia implements NotificadorSolicitudes {
  avisos: AvisoSolicitudEnviada[] = [];
  falla = false;
  solicitudEnviada(aviso: AvisoSolicitudEnviada) {
    if (this.falla) return Promise.reject(new Error('SMTP caído'));
    this.avisos.push(aviso);
    return Promise.resolve();
  }
}

/**
 * Doble del publicador de eventos (patrón Observer, PO 17 Oct 2026). Guarda lo que se publicó
 * para que las pruebas comprueben QUÉ se anunció, sin observadores reales de por medio.
 */
class EventosFalsos extends PublicadorEventosSolicitud {
  readonly publicados: { numero: string; hacia: string }[] = [];

  constructor() {
    super([]);
  }

  async publicarDe(solicitud: Solicitud): Promise<void> {
    for (const e of solicitud.drenarEventos()) {
      this.publicados.push({ numero: e.numero, hacia: e.hacia });
    }
    return Promise.resolve();
  }
}

function montar() {
  const repositorio = new SolicitudEnMemoriaRepositorio();
  const convocatorias = new ConvocatoriasFalsas();
  const perfiles = new PerfilesFalsos();
  const notificador = new NotificadorEspia();
  const almacenamiento = new AlmacenamientoMemoriaAdapter();
  const expediente = new ExpedienteService(repositorio, convocatorias);

  const eventos = new EventosFalsos();
  return {
    repositorio,
    convocatorias,
    perfiles,
    notificador,
    almacenamiento,
    eventos,
    crear: new CrearSolicitudService(repositorio, convocatorias, perfiles, expediente, eventos),
    cargar: new CargarDocumentoService(repositorio, almacenamiento, expediente),
    enviar: new EnviarSolicitudService(
      repositorio,
      convocatorias,
      perfiles,
      notificador,
      expediente,
      eventos,
    ),
    expediente,
  };
}

describe('Casos de uso de solicitudes', () => {
  describe('CrearSolicitudService (US-012)', () => {
    it('crea en BORRADOR con número correlativo y lista lo que falta con nombre legible', async () => {
      const { crear } = montar();
      const dto = await crear.ejecutar('e1', CONVOCATORIA_ID, AHORA);

      expect(dto).toMatchObject({
        numero: 'SOL-2026-000001',
        estado: NombreEstado.BORRADOR,
        editable: true,
        convocatoria: { codigo: 'UNIV-2026-001', titulo: 'Beca Universitaria 2026' },
        documentosFaltantes: ['Documento Personal de Identificación', 'Certificado de notas'],
      });
      expect(dto.documentos).toHaveLength(2);
      expect(dto.historial).toHaveLength(1);
    });

    it('el número sigue la secuencia del año', async () => {
      const { crear } = montar();
      await crear.ejecutar('e1', CONVOCATORIA_ID, AHORA);
      const segunda = await crear.ejecutar('e2', CONVOCATORIA_ID, AHORA);

      expect(segunda.numero).toBe('SOL-2026-000002');
    });

    it('404 si la convocatoria no existe', async () => {
      await expect(montar().crear.ejecutar('e1', 'otra', AHORA)).rejects.toThrow(
        RecursoNoEncontradoError,
      );
    });

    it('rechaza una convocatoria que no admite postulaciones (criterio 1)', async () => {
      const { crear, convocatorias } = montar();
      convocatorias.convocatoria = { ...convocatorias.convocatoria!, admiteSolicitudes: false };

      await expect(crear.ejecutar('e1', CONVOCATORIA_ID, AHORA)).rejects.toThrow(
        /no está recibiendo postulaciones/,
      );
    });

    it('rechaza si el perfil está incompleto, diciendo qué falta (CU-06, 2a)', async () => {
      const { crear, perfiles, repositorio } = montar();
      perfiles.estadoActual = { completo: false, camposFaltantes: ['promedio', 'municipio'] };

      await expect(crear.ejecutar('e1', CONVOCATORIA_ID, AHORA)).rejects.toThrow(
        'Complete su perfil antes de postular. Falta: promedio, municipio.',
      );
      expect(await repositorio.buscarPorEstudiante('e1')).toHaveLength(0);
    });

    it('rechaza una segunda solicitud activa, citando la existente (criterio 2)', async () => {
      const { crear } = montar();
      await crear.ejecutar('e1', CONVOCATORIA_ID, AHORA);

      await expect(crear.ejecutar('e1', CONVOCATORIA_ID, AHORA)).rejects.toThrow(
        new RecursoDuplicadoError(
          'Ya tiene una solicitud activa para esta convocatoria: SOL-2026-000001.',
        ),
      );
    });
  });

  describe('ExpedienteService (US-015 y control de acceso)', () => {
    it('otro estudiante recibe acceso denegado, no el recurso (US-003)', async () => {
      const { crear, expediente } = montar();
      const { id } = await crear.ejecutar('e1', CONVOCATORIA_ID, AHORA);

      await expect(expediente.detalle('intruso', id)).rejects.toThrow(AccesoDenegadoError);
    });

    it('404 si no existe', async () => {
      await expect(montar().expediente.detalle('e1', 'nada')).rejects.toThrow(
        RecursoNoEncontradoError,
      );
    });

    it('lista solo las del estudiante', async () => {
      const { crear, expediente } = montar();
      await crear.ejecutar('e1', CONVOCATORIA_ID, AHORA);
      await crear.ejecutar('e2', CONVOCATORIA_ID, AHORA);

      const propias = await expediente.deEstudiante('e1');
      expect(propias.map((s) => s.numero)).toEqual(['SOL-2026-000001']);
    });

    it('sigue mostrando la solicitud si la convocatoria ya no se encuentra', async () => {
      const { crear, expediente, convocatorias } = montar();
      const { id } = await crear.ejecutar('e1', CONVOCATORIA_ID, AHORA);
      convocatorias.convocatoria = null;

      const dto = await expediente.detalle('e1', id);
      expect(dto.convocatoria.titulo).toBe('Convocatoria no disponible');
      expect(dto.documentosFaltantes).toEqual(['DPI', 'CERTIFICADO_NOTAS']);
    });
  });

  describe('CargarDocumentoService (US-013)', () => {
    it('guarda el archivo y lo asocia al tipo', async () => {
      const { crear, cargar, almacenamiento } = montar();
      const { id } = await crear.ejecutar('e1', CONVOCATORIA_ID, AHORA);

      const dto = await cargar.ejecutar('e1', id, 'DPI', PDF, AHORA);

      expect(dto.documentos[0]).toMatchObject({
        tipo: 'DPI',
        cargado: true,
        nombreArchivo: 'dpi.pdf',
      });
      expect(almacenamiento.archivos.size).toBe(1);
      // La ruta en disco no usa el nombre que mandó el estudiante.
      expect([...almacenamiento.archivos.keys()][0]).toMatch(
        new RegExp(`^${id}/dpi-[0-9a-f-]+\\.pdf$`),
      );
    });

    it('al reemplazar, borra el archivo anterior (criterio 3)', async () => {
      const { crear, cargar, almacenamiento } = montar();
      const { id } = await crear.ejecutar('e1', CONVOCATORIA_ID, AHORA);
      await cargar.ejecutar('e1', id, 'DPI', PDF, AHORA);
      await cargar.ejecutar('e1', id, 'DPI', { ...PDF, nombreOriginal: 'nuevo.pdf' }, AHORA);

      expect(almacenamiento.archivos.size).toBe(1);
      const descarga = await cargar.descargar('e1', id, 'DPI');
      expect(descarga?.nombreArchivo).toBe('nuevo.pdf');
    });

    it('un archivo inválido no llega al almacenamiento', async () => {
      const { crear, cargar, almacenamiento } = montar();
      const { id } = await crear.ejecutar('e1', CONVOCATORIA_ID, AHORA);

      await expect(
        cargar.ejecutar('e1', id, 'DPI', { ...PDF, contenido: Buffer.from('no soy pdf') }, AHORA),
      ).rejects.toThrow(ReglaDeNegocioError);
      expect(almacenamiento.archivos.size).toBe(0);
    });

    it('si la solicitud rechaza el documento, borra el archivo recién subido (CU-07, 3a)', async () => {
      const { crear, cargar, almacenamiento } = montar();
      const { id } = await crear.ejecutar('e1', CONVOCATORIA_ID, AHORA);

      await expect(cargar.ejecutar('e1', id, 'PASAPORTE', PDF, AHORA)).rejects.toThrow(
        'La convocatoria no exige ese documento.',
      );
      expect(almacenamiento.archivos.size).toBe(0);
    });

    it('si falla el guardado, borra el archivo nuevo y conserva el anterior', async () => {
      const { crear, cargar, almacenamiento, repositorio } = montar();
      const { id } = await crear.ejecutar('e1', CONVOCATORIA_ID, AHORA);
      await cargar.ejecutar('e1', id, 'DPI', PDF, AHORA);
      const [anterior] = almacenamiento.archivos.keys();

      jest.spyOn(repositorio, 'guardar').mockRejectedValueOnce(new Error('BD caída'));
      await expect(cargar.ejecutar('e1', id, 'DPI', PDF, AHORA)).rejects.toThrow('BD caída');

      expect([...almacenamiento.archivos.keys()]).toEqual([anterior]);
    });

    it('otro estudiante no puede cargar en una solicitud ajena, ni se sube nada', async () => {
      const { crear, cargar, almacenamiento } = montar();
      const { id } = await crear.ejecutar('e1', CONVOCATORIA_ID, AHORA);

      await expect(cargar.ejecutar('intruso', id, 'DPI', PDF, AHORA)).rejects.toThrow(
        AccesoDenegadoError,
      );
      expect(almacenamiento.archivos.size).toBe(0);
    });

    it('si falla el borrado del reemplazado, la carga igual se completa', async () => {
      const almacenamiento: AlmacenamientoDocumentos = new AlmacenamientoMemoriaAdapter();
      const partes = montar();
      const cargar = new CargarDocumentoService(
        partes.repositorio,
        almacenamiento,
        partes.expediente,
      );
      const { id } = await partes.crear.ejecutar('e1', CONVOCATORIA_ID, AHORA);
      await cargar.ejecutar('e1', id, 'DPI', PDF, AHORA);

      jest.spyOn(almacenamiento, 'eliminar').mockRejectedValueOnce(new Error('disco'));
      const dto = await cargar.ejecutar('e1', id, 'DPI', PDF, AHORA);
      expect(dto.documentos[0].cargado).toBe(true);
    });
  });

  describe('EnviarSolicitudService (US-014)', () => {
    async function conTodoCargado() {
      const partes = montar();
      const { id } = await partes.crear.ejecutar('e1', CONVOCATORIA_ID, AHORA);
      await partes.cargar.ejecutar('e1', id, 'DPI', PDF, AHORA);
      await partes.cargar.ejecutar('e1', id, 'CERTIFICADO_NOTAS', PDF, AHORA);
      return { ...partes, id };
    }

    it('envía, registra la hora y notifica (criterios 1, 3 y 4)', async () => {
      const { enviar, notificador, id } = await conTodoCargado();
      const envio = new Date('2026-09-20T12:00:00Z');

      const dto = await enviar.ejecutar('e1', id, envio);

      expect(dto).toMatchObject({
        estado: NombreEstado.ENVIADA,
        editable: false,
        enviadaEn: envio.toISOString(),
      });
      expect(notificador.avisos).toEqual([
        {
          estudianteId: 'e1',
          numero: 'SOL-2026-000001',
          convocatoria: 'Beca Universitaria 2026',
          enviadaEn: envio,
        },
      ]);
    });

    it('dice TODO lo que falta en un solo mensaje (criterio 2)', async () => {
      const { crear, enviar, perfiles, notificador } = montar();
      const { id } = await crear.ejecutar('e1', CONVOCATORIA_ID, AHORA);
      perfiles.estadoActual = { completo: false, camposFaltantes: ['promedio'] };

      await expect(enviar.ejecutar('e1', id, AHORA)).rejects.toThrow(
        'No se puede enviar todavía. Falta: datos del perfil (promedio) y documentos ' +
          '(Documento Personal de Identificación; Certificado de notas).',
      );
      expect(notificador.avisos).toHaveLength(0);
    });

    it('solo documentos faltantes', async () => {
      const { crear, cargar, enviar } = montar();
      const { id } = await crear.ejecutar('e1', CONVOCATORIA_ID, AHORA);
      await cargar.ejecutar('e1', id, 'DPI', PDF, AHORA);

      await expect(enviar.ejecutar('e1', id, AHORA)).rejects.toThrow(
        'No se puede enviar todavía. Falta: documentos (Certificado de notas).',
      );
    });

    it('rechaza si el plazo de la convocatoria ya cerró', async () => {
      const { enviar, convocatorias, id } = await conTodoCargado();
      convocatorias.convocatoria = { ...convocatorias.convocatoria!, admiteSolicitudes: false };

      await expect(enviar.ejecutar('e1', id, AHORA)).rejects.toThrow(/plazo cerró el 2026-12-31/);
    });

    it('una solicitud ya enviada responde con transición inválida', async () => {
      const { enviar, id } = await conTodoCargado();
      await enviar.ejecutar('e1', id, AHORA);

      await expect(enviar.ejecutar('e1', id, AHORA)).rejects.toThrow(TransicionInvalidaError);
    });

    it('si falla el aviso, la solicitud queda enviada igual', async () => {
      const { enviar, notificador, repositorio, id } = await conTodoCargado();
      notificador.falla = true;

      await expect(enviar.ejecutar('e1', id, AHORA)).resolves.toMatchObject({
        estado: NombreEstado.ENVIADA,
      });
      expect((await repositorio.buscarPorId(id))?.nombreEstado).toBe(NombreEstado.ENVIADA);
    });

    it('después de enviada ya no admite documentos (US-013, criterio 3)', async () => {
      const { enviar, cargar, id } = await conTodoCargado();
      await enviar.ejecutar('e1', id, AHORA);

      await expect(cargar.ejecutar('e1', id, 'DPI', PDF, AHORA)).rejects.toThrow(
        TransicionInvalidaError,
      );
    });
  });
});
