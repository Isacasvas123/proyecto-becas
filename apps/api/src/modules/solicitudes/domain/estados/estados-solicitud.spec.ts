/**
 * Prueba unitaria — patrón State (docs/06-patrones.md §5).
 *
 * Se prueba la tabla completa de transiciones: cada estado contra cada acción. Así, si alguien
 * habilita por error una transición que no está en el diagrama de estados, una prueba falla.
 */
import {
  ReglaDeNegocioError,
  TransicionInvalidaError,
} from '../../../../shared/exceptions/errores-dominio';
import { Decision, NombreEstado } from '../enums/solicitud.enums';
import { EstadoSolicitud, VistaSolicitud, estadoDesde } from './estados-solicitud';

/** Beca pequeña: aprobar la deja APROBADA de una vez. */
const completa: VistaSolicitud = {
  documentosFaltantes: () => [],
  necesitaSegundaAprobacion: () => false,
};
const incompleta: VistaSolicitud = {
  documentosFaltantes: () => ['DPI'],
  necesitaSegundaAprobacion: () => false,
};
/** Beca de más de Q10,000: aprobar la deja esperando la segunda firma (PO, 17 Oct 2026). */
const grande: VistaSolicitud = {
  documentosFaltantes: () => [],
  necesitaSegundaAprobacion: () => true,
};

type Accion = 'enviar' | 'iniciarEvaluacion' | 'aprobar' | 'rechazar' | 'confirmar' | 'adjudicar';

function ejecutar(
  estado: EstadoSolicitud,
  accion: Accion,
  vista: VistaSolicitud = completa,
): EstadoSolicitud {
  switch (accion) {
    case 'enviar':
      return estado.enviar(vista);
    case 'iniciarEvaluacion':
      return estado.iniciarEvaluacion();
    case 'aprobar':
      return estado.resolver(Decision.APROBAR, vista);
    case 'rechazar':
      return estado.resolver(Decision.RECHAZAR, vista);
    case 'confirmar':
      return estado.confirmarAprobacion();
    case 'adjudicar':
      return estado.adjudicar();
  }
}

/** Lo que dibuja docs/diagramas/03-clases-dominio.md §2. Todo lo demás debe fallar. */
const PERMITIDAS: Record<NombreEstado, Partial<Record<Accion, NombreEstado>>> = {
  [NombreEstado.BORRADOR]: { enviar: NombreEstado.ENVIADA },
  [NombreEstado.ENVIADA]: { iniciarEvaluacion: NombreEstado.EN_EVALUACION },
  [NombreEstado.EN_EVALUACION]: {
    aprobar: NombreEstado.APROBADA,
    rechazar: NombreEstado.RECHAZADA,
  },
  // PO, 17 Oct 2026: desde aquí solo se confirma o se rechaza. Aprobar otra vez no es una vía.
  [NombreEstado.APROBACION_PENDIENTE]: {
    confirmar: NombreEstado.APROBADA,
    rechazar: NombreEstado.RECHAZADA,
  },
  [NombreEstado.APROBADA]: { adjudicar: NombreEstado.ADJUDICADA },
  [NombreEstado.RECHAZADA]: {},
  [NombreEstado.ADJUDICADA]: {},
};

const ACCIONES: Accion[] = [
  'enviar',
  'iniciarEvaluacion',
  'aprobar',
  'rechazar',
  'confirmar',
  'adjudicar',
];

describe('Estados de la solicitud (patrón State)', () => {
  const casos = Object.values(NombreEstado).flatMap((estado) =>
    ACCIONES.map((accion) => [estado, accion, PERMITIDAS[estado][accion] ?? null] as const),
  );

  it.each(casos)('%s + %s → %s', (nombre, accion, esperado) => {
    const estado = estadoDesde(nombre);

    if (esperado === null) {
      expect(() => ejecutar(estado, accion)).toThrow(TransicionInvalidaError);
    } else {
      expect(ejecutar(estado, accion).nombre).toBe(esperado);
    }
  });

  it('estadoDesde reconstruye cada estado con su nombre', () => {
    for (const nombre of Object.values(NombreEstado)) {
      expect(estadoDesde(nombre).nombre).toBe(nombre);
    }
  });

  it('solo el borrador admite cargar documentos (US-013, criterio 3)', () => {
    for (const nombre of Object.values(NombreEstado)) {
      const verificar = () => estadoDesde(nombre).verificarCargaDeDocumentos();
      if (nombre === NombreEstado.BORRADOR) {
        expect(verificar).not.toThrow();
      } else {
        expect(verificar).toThrow(TransicionInvalidaError);
      }
    }
  });

  it('un borrador con documentos faltantes no se envía (US-014, criterio 1)', () => {
    expect(() => estadoDesde(NombreEstado.BORRADOR).enviar(incompleta)).toThrow(
      ReglaDeNegocioError,
    );
  });

  it('solo la rechazada deja de estar activa (US-012, criterio 2)', () => {
    const inactivos = Object.values(NombreEstado).filter((n) => !estadoDesde(n).estaActiva());
    expect(inactivos).toEqual([NombreEstado.RECHAZADA]);
  });

  describe('segunda aprobación por monto (PO, 17 Oct 2026)', () => {
    it('una beca de más de Q10,000 no se aprueba de una vez: queda esperando la segunda firma', () => {
      const siguiente = estadoDesde(NombreEstado.EN_EVALUACION).resolver(Decision.APROBAR, grande);

      expect(siguiente.nombre).toBe(NombreEstado.APROBACION_PENDIENTE);
    });

    it('una beca por debajo del umbral se aprueba con una sola firma', () => {
      const siguiente = estadoDesde(NombreEstado.EN_EVALUACION).resolver(
        Decision.APROBAR,
        completa,
      );

      expect(siguiente.nombre).toBe(NombreEstado.APROBADA);
    });

    it('rechazar no depende del monto: termina igual en RECHAZADA', () => {
      for (const vista of [completa, grande]) {
        expect(
          estadoDesde(NombreEstado.EN_EVALUACION).resolver(Decision.RECHAZAR, vista).nombre,
        ).toBe(NombreEstado.RECHAZADA);
      }
    });

    it('aprobar otra vez una que ya espera la segunda firma dice qué hacer en su lugar', () => {
      expect(() =>
        estadoDesde(NombreEstado.APROBACION_PENDIENTE).resolver(Decision.APROBAR, grande),
      ).toThrow(/confirme la segunda/i);
    });

    it('todavía no se puede adjudicar: no está aprobada', () => {
      expect(() => estadoDesde(NombreEstado.APROBACION_PENDIENTE).adjudicar()).toThrow(
        TransicionInvalidaError,
      );
    });

    it('tampoco admite documentos nuevos', () => {
      expect(() =>
        estadoDesde(NombreEstado.APROBACION_PENDIENTE).verificarCargaDeDocumentos(),
      ).toThrow(TransicionInvalidaError);
    });

    it('sigue activa mientras espera: el estudiante no puede postular de nuevo', () => {
      expect(estadoDesde(NombreEstado.APROBACION_PENDIENTE).estaActiva()).toBe(true);
    });
  });

  it('el mensaje de una transición inválida nombra la acción y el estado', () => {
    expect(() => estadoDesde(NombreEstado.ENVIADA).enviar(completa)).toThrow(
      'No se puede enviar una solicitud en estado ENVIADA.',
    );
  });
});
