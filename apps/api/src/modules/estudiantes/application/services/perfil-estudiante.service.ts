/**
 * CAPA: application/services/
 * ────────────────────────────────────────────────────────────────────────────────
 * US-011 — Completar perfil académico: consultarlo y guardarlo.
 *
 * Dos casos de uso muy pequeños en una sola clase, excepción consciente a "un caso de uso, un
 * servicio": leer y escribir el propio perfil son las dos caras de la misma pantalla, y separarlos
 * no aportaría nada que se pueda probar por separado.
 *
 * `estadoDePerfil` es lo que este módulo EXPORTA: `solicitudes` lo usa para saber si alguien
 * puede postular, sin conocer la entidad `Estudiante`.
 */
import { Inject, Injectable } from '@nestjs/common';

import { DatosPerfil, Estudiante } from '../../domain/entities/estudiante.entity';
import {
  ESTUDIANTE_REPOSITORIO,
  EstudianteRepositorio,
} from '../../domain/ports/estudiante.repositorio';

export interface PerfilDto extends DatosPerfil {
  readonly completo: boolean;
  readonly camposFaltantes: readonly string[];
}

export interface EstadoPerfilDto {
  readonly completo: boolean;
  readonly camposFaltantes: readonly string[];
}

const PERFIL_VACIO: DatosPerfil = {
  centroEducativo: null,
  nivel: null,
  promedio: null,
  ingresoFamiliarMensual: null,
  dependientes: null,
  departamento: null,
  municipio: null,
};

@Injectable()
export class PerfilEstudianteService {
  constructor(
    @Inject(ESTUDIANTE_REPOSITORIO)
    private readonly repositorio: EstudianteRepositorio,
  ) {}

  async obtener(usuarioId: string): Promise<PerfilDto> {
    const perfil =
      (await this.repositorio.buscarPorUsuario(usuarioId)) ??
      new Estudiante(usuarioId, PERFIL_VACIO);
    return aDto(perfil);
  }

  async guardar(usuarioId: string, datos: DatosPerfil): Promise<PerfilDto> {
    const perfil = new Estudiante(usuarioId, datos);
    await this.repositorio.guardar(perfil);
    return aDto(perfil);
  }

  async estadoDePerfil(usuarioId: string): Promise<EstadoPerfilDto> {
    const { completo, camposFaltantes } = await this.obtener(usuarioId);
    return { completo, camposFaltantes };
  }
}

function aDto(perfil: Estudiante): PerfilDto {
  return {
    centroEducativo: perfil.centroEducativo,
    nivel: perfil.nivel,
    promedio: perfil.promedio,
    ingresoFamiliarMensual: perfil.ingresoFamiliarMensual,
    dependientes: perfil.dependientes,
    departamento: perfil.departamento,
    municipio: perfil.municipio,
    completo: perfil.perfilCompleto(),
    camposFaltantes: perfil.camposFaltantes(),
  };
}
