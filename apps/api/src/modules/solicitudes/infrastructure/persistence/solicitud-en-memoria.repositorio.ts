import { ReglaDeNegocioError } from '../../../../shared/exceptions/errores-dominio';
import { Solicitud } from '../../domain/entities/solicitud.entity';
import { NombreEstado } from '../../domain/enums/solicitud.enums';
import {
  FiltroSolicitudesReporte,
  mensajeSinCupo,
  SolicitudRepositorio,
} from '../../domain/ports/solicitud.repositorio';

/**
 * Doble para pruebas: mismo contrato que el adaptador de Prisma.
 *
 * GUARDA Y DEVUELVE COPIAS, como una base de datos. Si guardara la misma instancia, un caso de uso
 * que modifica la solicitud y después ve rechazado el guardado (por ejemplo, por falta de cupo)
 * dejaría el cambio aplicado en la "base", y las pruebas darían por buena una conducta que en
 * PostgreSQL no existe.
 */
export class SolicitudEnMemoriaRepositorio implements SolicitudRepositorio {
  private readonly solicitudes = new Map<string, Solicitud>();

  constructor(iniciales: Solicitud[] = []) {
    iniciales.forEach((s) => this.solicitudes.set(s.id, copiar(s)));
  }

  buscarPorId(id: string): Promise<Solicitud | null> {
    return Promise.resolve(this.una((s) => s.id === id));
  }

  buscarPorEstudiante(estudianteId: string): Promise<Solicitud[]> {
    return Promise.resolve(
      this.varias((s) => s.estudianteId === estudianteId).sort(
        (a, b) => b.creadaEn.getTime() - a.creadaEn.getTime(),
      ),
    );
  }

  buscarActiva(estudianteId: string, convocatoriaId: string): Promise<Solicitud | null> {
    return Promise.resolve(
      this.una(
        (s) =>
          s.estudianteId === estudianteId && s.convocatoriaId === convocatoriaId && s.estaActiva(),
      ),
    );
  }

  contarConPrefijoDeNumero(prefijo: string): Promise<number> {
    return Promise.resolve(this.varias((s) => s.numero.startsWith(prefijo)).length);
  }

  buscarPorConvocatoriaYEstado(convocatoriaId: string, estado: NombreEstado): Promise<Solicitud[]> {
    return Promise.resolve(
      this.varias((s) => s.convocatoriaId === convocatoriaId && s.nombreEstado === estado).sort(
        (a, b) => (a.enviadaEn?.getTime() ?? 0) - (b.enviadaEn?.getTime() ?? 0),
      ),
    );
  }

  buscarPorIds(ids: readonly string[]): Promise<Solicitud[]> {
    return Promise.resolve(this.varias((s) => ids.includes(s.id)));
  }

  async guardarSiHayCupo(solicitud: Solicitud, cupos: number): Promise<void> {
    const otras = this.varias(
      (s) => s.convocatoriaId === solicitud.convocatoriaId && s.id !== solicitud.id,
    );
    const ocupados = otras.filter(
      (s) => s.nombreEstado === NombreEstado.APROBADA || s.nombreEstado === NombreEstado.ADJUDICADA,
    ).length;
    if (ocupados >= cupos) {
      throw new ReglaDeNegocioError(mensajeSinCupo(cupos));
    }
    await this.guardar(solicitud);
  }

  contarOcupacion(convocatoriaId: string): Promise<{ aprobadas: number; adjudicadas: number }> {
    const de = this.varias((s) => s.convocatoriaId === convocatoriaId);
    return Promise.resolve({
      aprobadas: de.filter((s) => s.nombreEstado === NombreEstado.APROBADA).length,
      adjudicadas: de.filter((s) => s.nombreEstado === NombreEstado.ADJUDICADA).length,
    });
  }

  buscarPorNumero(numero: string): Promise<Solicitud | null> {
    return Promise.resolve(this.una((s) => s.numero === numero));
  }

  contarBecasConPrefijo(prefijo: string): Promise<number> {
    return Promise.resolve(this.varias((s) => s.beca?.codigo.startsWith(prefijo) ?? false).length);
  }

  paraReporte(f: FiltroSolicitudesReporte): Promise<Solicitud[]> {
    return Promise.resolve(
      this.varias(
        (s) =>
          s.nombreEstado !== NombreEstado.BORRADOR &&
          s.enviadaEn !== null &&
          (f.convocatoriaId === undefined || s.convocatoriaId === f.convocatoriaId) &&
          (f.estados === undefined || f.estados.includes(s.nombreEstado)) &&
          (f.enviadasDesde === undefined || s.enviadaEn >= f.enviadasDesde) &&
          (f.enviadasHasta === undefined || s.enviadaEn <= f.enviadasHasta),
      ).sort((a, b) => a.numero.localeCompare(b.numero)),
    );
  }

  guardar(solicitud: Solicitud): Promise<void> {
    this.solicitudes.set(solicitud.id, copiar(solicitud));
    return Promise.resolve();
  }

  private varias(filtro: (s: Solicitud) => boolean): Solicitud[] {
    return [...this.solicitudes.values()].filter(filtro).map(copiar);
  }

  private una(filtro: (s: Solicitud) => boolean): Solicitud | null {
    return this.varias(filtro)[0] ?? null;
  }
}

function copiar(s: Solicitud): Solicitud {
  return Solicitud.reconstituir({
    id: s.id,
    numero: s.numero,
    estudianteId: s.estudianteId,
    convocatoriaId: s.convocatoriaId,
    estado: s.nombreEstado,
    documentosExigidos: [...s.documentosExigidos],
    montoBeca: s.montoBeca,
    documentos: s.listaDocumentos(),
    historial: s.listaHistorial(),
    enviadaEn: s.enviadaEn,
    creadaEn: s.creadaEn,
    beca: s.beca,
  });
}
