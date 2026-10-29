/**
 * Crea o actualiza una cuenta de administrador, y nada más.
 *
 * La aplicación no tiene pantalla para crear administradores, a propósito: quien administra el
 * sistema de becas no se da de alta desde un formulario web. `seed.ts` tampoco sirve, porque
 * siembra convocatorias de prueba y está marcado como solo-desarrollo.
 *
 * Hacía falta porque US-033 exige que la segunda aprobación de una beca de más de Q10,000 la dé
 * una persona distinta de la primera, y con un solo administrador ese flujo no se puede recorrer
 * en un entorno desplegado.
 *
 * Escribe una fila en `Usuario` con rol ADMINISTRADOR y la contraseña con bcrypt. No crea
 * convocatorias ni toca otras cuentas; si el usuario ya existe, actualiza su contraseña y lo deja
 * activo.
 *
 * Las tres variables son obligatorias y la contraseña nunca queda en el repositorio. Desde la
 * raíz del proyecto:
 *
 *     DATABASE_URL="<cadena de conexión>" \
 *     NUEVO_ADMIN_USUARIO="admin.revisor" \
 *     NUEVO_ADMIN_CORREO="revisor@becas.gob.gt" \
 *     NUEVO_ADMIN_PASSWORD="<la contraseña>" \
 *     npm run admin:crear --workspace apps/api
 *
 * En Staging, `DATABASE_URL` es la External Database URL del panel de Render; la interna solo
 * funciona dentro de su red. Una contraseña escrita en la línea de comandos queda en el historial
 * de la terminal, así que conviene limpiarlo después.
 */
import { PrismaClient, RolUsuario } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

/** Mínimos de la política de contraseñas del proyecto (`docs/04-product-backlog.md` §5). */
const LARGO_MINIMO = 8;

async function main(): Promise<void> {
  const nombreUsuario = (process.env.NUEVO_ADMIN_USUARIO ?? '').trim().toLowerCase();
  const correo = (process.env.NUEVO_ADMIN_CORREO ?? '').trim().toLowerCase();
  const password = process.env.NUEVO_ADMIN_PASSWORD ?? '';

  const faltan = [
    nombreUsuario === '' ? 'NUEVO_ADMIN_USUARIO' : null,
    correo === '' ? 'NUEVO_ADMIN_CORREO' : null,
    password === '' ? 'NUEVO_ADMIN_PASSWORD' : null,
  ].filter((v): v is string => v !== null);

  if (faltan.length > 0) {
    throw new Error(
      `Faltan variables de entorno: ${faltan.join(', ')}. Vea la cabecera de este archivo.`,
    );
  }

  if (password.length < LARGO_MINIMO) {
    throw new Error(`La contraseña debe tener al menos ${LARGO_MINIMO} caracteres.`);
  }

  // El mismo coste que usa la aplicación: una cuenta creada aquí tiene que poder entrar por la
  // puerta normal, sin que nadie recuerde que se creó por otro camino.
  const rondas = Number(process.env.BCRYPT_ROUNDS ?? 12);
  const hashPassword = await hash(password, Number.isInteger(rondas) ? rondas : 12);

  const usuario = await prisma.usuario.upsert({
    where: { nombreUsuario },
    update: { hashPassword, correo, rol: RolUsuario.ADMINISTRADOR, activo: true },
    create: {
      nombreUsuario,
      correo,
      hashPassword,
      rol: RolUsuario.ADMINISTRADOR,
      activo: true,
    },
  });

  // Se imprime el usuario, nunca la contraseña: la salida de este comando suele acabar pegada
  // en un chat o en un ticket.
  console.log(`Administrador listo: ${usuario.nombreUsuario} (${usuario.correo})`);
  console.log('La contraseña no se muestra. Guárdela en el gestor de contraseñas del equipo.');
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => void prisma.$disconnect());
