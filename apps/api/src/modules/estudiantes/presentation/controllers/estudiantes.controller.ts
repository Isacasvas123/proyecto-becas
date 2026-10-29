import { Body, Controller, Get, Put } from '@nestjs/common';

import {
  PerfilDto,
  PerfilEstudianteService,
} from '../../application/services/perfil-estudiante.service';
import { PerfilRequestDto } from '../dto/perfil-request.dto';
import { RolUsuario } from '../../../usuarios/domain/enums/rol-usuario.enum';
import { Roles, UsuarioActual } from '../../../usuarios/presentation/guards/decoradores';

/**
 * US-011. Todas las rutas son del propio estudiante: el id sale del token (`@UsuarioActual`),
 * nunca de la URL. No existe "ver el perfil del estudiante X" para un estudiante.
 */
@Roles(RolUsuario.ESTUDIANTE)
@Controller('estudiantes')
export class EstudiantesController {
  constructor(private readonly perfiles: PerfilEstudianteService) {}

  @Get('perfil')
  obtenerPerfil(@UsuarioActual() usuarioId: string): Promise<PerfilDto> {
    return this.perfiles.obtener(usuarioId);
  }

  @Put('perfil')
  guardarPerfil(
    @UsuarioActual() usuarioId: string,
    @Body() peticion: PerfilRequestDto,
  ): Promise<PerfilDto> {
    return this.perfiles.guardar(usuarioId, peticion);
  }

  /** Los 22 departamentos con su nombre, para el formulario. */
  @Get('departamentos')
  departamentos(): { codigo: string; nombre: string }[] {
    return this.perfiles.departamentos();
  }
}
