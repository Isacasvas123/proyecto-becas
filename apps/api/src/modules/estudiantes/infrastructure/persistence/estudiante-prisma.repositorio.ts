import { Injectable } from '@nestjs/common';
import { Estudiante as EstudiantePrisma } from '@prisma/client';

import { PrismaService } from '../../../../shared/persistence/prisma.service';
import { Estudiante } from '../../domain/entities/estudiante.entity';
import { Departamento, NivelAcademico } from '../../domain/enums/catalogos';
import { EstudianteRepositorio } from '../../domain/ports/estudiante.repositorio';

@Injectable()
export class EstudiantePrismaRepositorio implements EstudianteRepositorio {
  constructor(private readonly prisma: PrismaService) {}

  async buscarPorUsuario(usuarioId: string): Promise<Estudiante | null> {
    const fila = await this.prisma.estudiante.findUnique({ where: { usuarioId } });
    return fila === null ? null : aDominio(fila);
  }

  async buscarPorUsuarios(usuarioIds: readonly string[]): Promise<Estudiante[]> {
    if (usuarioIds.length === 0) return [];
    const filas = await this.prisma.estudiante.findMany({
      where: { usuarioId: { in: [...usuarioIds] } },
    });
    return filas.map(aDominio);
  }

  async guardar(estudiante: Estudiante): Promise<void> {
    const datos = {
      centroEducativo: estudiante.centroEducativo,
      nivel: estudiante.nivel,
      promedio: estudiante.promedio,
      ingresoFamiliarMensual: estudiante.ingresoFamiliarMensual,
      dependientes: estudiante.dependientes,
      departamento: estudiante.departamento,
      municipio: estudiante.municipio,
    };
    await this.prisma.estudiante.upsert({
      where: { usuarioId: estudiante.usuarioId },
      create: { usuarioId: estudiante.usuarioId, ...datos },
      update: datos,
    });
  }
}

export function aDominio(fila: EstudiantePrisma): Estudiante {
  return new Estudiante(fila.usuarioId, {
    centroEducativo: fila.centroEducativo,
    // Conversión explícita entre dos vocabularios: una prueba vigila que coincidan.
    nivel: fila.nivel as NivelAcademico | null,
    // El promedio se guarda como decimal exacto; en el dominio basta un número.
    promedio: fila.promedio === null ? null : Number(fila.promedio),
    ingresoFamiliarMensual:
      fila.ingresoFamiliarMensual === null ? null : Number(fila.ingresoFamiliarMensual),
    dependientes: fila.dependientes,
    departamento: fila.departamento as Departamento | null,
    municipio: fila.municipio,
  });
}
