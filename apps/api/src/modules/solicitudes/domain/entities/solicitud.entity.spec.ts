import {
  ReglaDeNegocioError,
  TransicionInvalidaError,
} from '../../../../shared/exceptions/errores-dominio';
import { Decision, NombreEstado } from '../enums/solicitud.enums';
import { ArchivoDocumento } from '../value-objects/archivo-documento.vo';
import { Solicitud } from './solicitud.entity';

const AHORA = new Date('2026-09-16T15:00:00Z');
const PDF = ArchivoDocumento.crear({
  nombreOriginal: 'dpi.pdf',
  tipoContenido: 'application/pdf',
  contenido: Buffer.from('%PDF-1.7 contenido'),
});

function nueva(documentosExigidos = ['DPI', 'CERTIFICADO_NOTAS'], montoBeca = 5000): Solicitud {
  return Solicitud.nueva({
    id: 's1',
    numero: 'SOL-2026-000001',
    estudianteId: 'e1',
    convocatoriaId: 'c1',
    documentosExigidos,
    montoBeca,
    ahora: AHORA,
  });
}

function completa(): Solicitud {
  const s = nueva();
  s.cargarDocumento('DPI', PDF, 'ref/dpi', AHORA);
  s.cargarDocumento('CERTIFICADO_NOTAS', PDF, 'ref/notas', AHORA);
  return s;
}

describe('Solicitud', () => {
  describe('creación (US-012)', () => {
    it('nace en BORRADOR, editable, con todos los documentos pendientes', () => {
      const s = nueva();

      expect(s.nombreEstado).toBe(NombreEstado.BORRADOR);
      expect(s.esEditable()).toBe(true);
      expect(s.documentosFaltantes()).toEqual(['DPI', 'CERTIFICADO_NOTAS']);
      expect(s.enviadaEn).toBeNull();
    });

    it('su historial empieza con la creación, sin estado previo (US-016)', () => {
      expect(nueva().listaHistorial()).toEqual([
        expect.objectContaining({ desde: null, hacia: NombreEstado.BORRADOR, autorId: 'e1' }),
      ]);
    });

    it('ignora documentos exigidos repetidos', () => {
      expect(nueva(['DPI', 'DPI']).documentosExigidos).toEqual(['DPI']);
    });

    it('pertenece solo a su estudiante', () => {
      expect(nueva().perteneceA('e1')).toBe(true);
      expect(nueva().perteneceA('e2')).toBe(false);
    });
  });

  describe('carga de documentos (US-013)', () => {
    it('asocia el documento al tipo que satisface (criterio 4)', () => {
      const s = nueva();
      const { reemplazado } = s.cargarDocumento('DPI', PDF, 'ref/1', AHORA);

      expect(reemplazado).toBeNull();
      expect(s.documento('DPI')).toMatchObject({
        nombreArchivo: 'dpi.pdf',
        referencia: 'ref/1',
        tamanoBytes: PDF.tamanoBytes,
      });
      expect(s.documentosFaltantes()).toEqual(['CERTIFICADO_NOTAS']);
    });

    it('reemplazar devuelve el anterior para borrar su archivo (criterio 3)', () => {
      const s = nueva();
      s.cargarDocumento('DPI', PDF, 'ref/1', AHORA);
      const { reemplazado } = s.cargarDocumento('DPI', PDF, 'ref/2', AHORA);

      expect(reemplazado?.referencia).toBe('ref/1');
      expect(s.documento('DPI')?.referencia).toBe('ref/2');
      expect(s.listaDocumentos()).toHaveLength(1);
    });

    it('rechaza un tipo que la convocatoria no exige', () => {
      expect(() => nueva().cargarDocumento('PASAPORTE', PDF, 'r', AHORA)).toThrow(
        ReglaDeNegocioError,
      );
    });

    it('no admite cambios después de enviada (criterio 3)', () => {
      const s = completa();
      s.enviar(AHORA, 'e1');

      expect(() => s.cargarDocumento('DPI', PDF, 'r', AHORA)).toThrow(TransicionInvalidaError);
    });
  });

  describe('envío (US-014)', () => {
    it('con todo cargado pasa a ENVIADA, registra la hora y deja de ser editable', () => {
      const s = completa();
      const envio = new Date('2026-09-17T10:00:00Z');
      s.enviar(envio, 'e1');

      expect(s.nombreEstado).toBe(NombreEstado.ENVIADA);
      expect(s.enviadaEn).toEqual(envio);
      expect(s.esEditable()).toBe(false);
      expect(s.listaHistorial().at(-1)).toMatchObject({
        desde: NombreEstado.BORRADOR,
        hacia: NombreEstado.ENVIADA,
        ocurridoEn: envio,
      });
    });

    it('con documentos faltantes no cambia nada', () => {
      const s = nueva();

      expect(() => s.enviar(AHORA, 'e1')).toThrow(ReglaDeNegocioError);
      expect(s.nombreEstado).toBe(NombreEstado.BORRADOR);
      expect(s.listaHistorial()).toHaveLength(1);
      expect(s.enviadaEn).toBeNull();
    });

    it('no se envía dos veces', () => {
      const s = completa();
      s.enviar(AHORA, 'e1');

      expect(() => s.enviar(AHORA, 'e1')).toThrow(TransicionInvalidaError);
    });
  });

  describe('ciclo completo y trazabilidad (US-016)', () => {
    it('cada transición deja una entrada con autor y motivo', () => {
      const s = completa();
      s.enviar(AHORA, 'e1');
      s.iniciarEvaluacion(AHORA, 'admin');
      s.resolver(Decision.APROBAR, AHORA, 'evaluador', '  Cumple todos los requisitos  ');
      s.adjudicar(AHORA, 'admin', 'BECA-2026-000001');

      expect(s.nombreEstado).toBe(NombreEstado.ADJUDICADA);
      expect(s.beca).toEqual({ codigo: 'BECA-2026-000001', otorgadaEn: AHORA });
      expect(s.ultimoCambio).toEqual(AHORA);
      expect(s.listaHistorial().map((h) => h.hacia)).toEqual([
        NombreEstado.BORRADOR,
        NombreEstado.ENVIADA,
        NombreEstado.EN_EVALUACION,
        NombreEstado.APROBADA,
        NombreEstado.ADJUDICADA,
      ]);
      expect(s.listaHistorial()[3]).toMatchObject({
        autorId: 'evaluador',
        motivo: 'Cumple todos los requisitos',
      });
    });

    it('una resolución sin motivo se rechaza', () => {
      const s = completa();
      s.enviar(AHORA, 'e1');
      s.iniciarEvaluacion(AHORA, 'admin');

      expect(() => s.resolver(Decision.RECHAZAR, AHORA, 'ev', '   ')).toThrow(ReglaDeNegocioError);
    });

    it('rechazada deja de estar activa', () => {
      const s = completa();
      s.enviar(AHORA, 'e1');
      s.iniciarEvaluacion(AHORA, 'admin');
      s.resolver(Decision.RECHAZAR, AHORA, 'ev', 'Promedio insuficiente');

      expect(s.estaActiva()).toBe(false);
    });

    it('el historial expuesto es una copia: no se puede alterar desde fuera', () => {
      const s = nueva();
      (s.listaHistorial() as unknown[]).pop();

      expect(s.listaHistorial()).toHaveLength(1);
    });
  });

  it('reconstituir conserva estado, documentos e historial', () => {
    const original = completa();
    original.enviar(AHORA, 'e1');

    const copia = Solicitud.reconstituir({
      id: original.id,
      numero: original.numero,
      estudianteId: original.estudianteId,
      convocatoriaId: original.convocatoriaId,
      estado: original.nombreEstado,
      documentosExigidos: original.documentosExigidos,
      montoBeca: 5000,
      documentos: original.listaDocumentos(),
      historial: original.listaHistorial(),
      enviadaEn: original.enviadaEn,
      creadaEn: original.creadaEn,
    });

    expect(copia.nombreEstado).toBe(NombreEstado.ENVIADA);
    expect(copia.documentosFaltantes()).toEqual([]);
    expect(copia.listaHistorial()).toEqual(original.listaHistorial());
  });
});
