/**
 * PRUEBA UNITARIA — patrón State (docs/06-patrones.md §5).
 *
 * Se prueba la TABLA COMPLETA de transiciones: cada estado contra cada acción. Así, si alguien
 * habilita por error una transición que no está en el diagrama de estados, una prueba falla.
 */
import {
  ReglaDeNegocioError,
  TransicionInvalidaError,
} from '../../../../shared/exceptions/errores-dominio';
import { Decision, NombreEstado } from '../enums/solicitud.enums';
import { EstadoSolicitud, VistaSolicitud, estadoDesde } from './estados-solicitud';

const completa: VistaSolicitud = { documentosFaltantes: () => [] };
const incompleta: VistaSolicitud = { documentosFaltantes: () => ['DPI'] };

type Accion = 'enviar' | 'iniciarEvaluacion' | 'aprobar' | 'rechazar' | 'adjudicar';

function ejecutar(estado: EstadoSolicitud, accion: Accion): EstadoSolicitud {
  switch (accion) {
    case 'enviar':
      return estado.enviar(completa);
    case 'iniciarEvaluacion':
      return estado.iniciarEvaluacion();
    case 'aprobar':
      return estado.resolver(Decision.APROBAR);
    case 'rechazar':
      return estado.resolver(Decision.RECHAZAR);
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
  [NombreEstado.APROBADA]: { adjudicar: NombreEstado.ADJUDICADA },
  [NombreEstado.RECHAZADA]: {},
  [NombreEstado.ADJUDICADA]: {},
};

const ACCIONES: Accion[] = ['enviar', 'iniciarEvaluacion', 'aprobar', 'rechazar', 'adjudicar'];

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

  it('el mensaje de una transición inválida nombra la acción y el estado', () => {
    expect(() => estadoDesde(NombreEstado.ENVIADA).enviar(completa)).toThrow(
      'No se puede enviar una solicitud en estado ENVIADA.',
    );
  });
});
