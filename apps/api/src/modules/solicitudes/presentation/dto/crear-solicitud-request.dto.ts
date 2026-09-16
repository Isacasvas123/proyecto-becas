import { IsUUID } from 'class-validator';

export class CrearSolicitudRequestDto {
  @IsUUID('4', { message: 'La convocatoria indicada no es válida' })
  convocatoriaId!: string;
}
