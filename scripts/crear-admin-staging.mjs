/**
 * Genera la sentencia SQL que crea el administrador de Staging.
 *
 * POR QUÉ ESTE SCRIPT EXISTE
 *   El seed NO se ejecuta en Staging a propósito (docs/17-staging.md §1): sembraría el
 *   administrador con las credenciales de `.env.example`, que están en el repositorio.
 *   En un entorno accesible por red eso es regalar una cuenta de administrador conocida.
 *
 * QUÉ HACE Y QUÉ NO HACE
 *   Pide la contraseña por teclado, sin mostrarla y sin guardarla en ningún archivo, calcula
 *   su hash bcrypt e imprime un INSERT listo para pegar en la consola de PostgreSQL de
 *   Render. La contraseña en claro no viaja a ningún lado: solo sale el hash, que es lo
 *   único que la aplicación necesita.
 *
 * CÓMO SE USA
 *   node scripts/crear-admin-staging.mjs
 *   y después, en Render: becas-staging-db → Connect → PSQL Command → pegar el SQL.
 */
import { createInterface } from 'node:readline';
import { stdin, stdout } from 'node:process';
// bcryptjs vive en el node_modules de la raíz: es un monorepo con workspaces. Se publica como
// CommonJS, así que según cómo lo cargue Node la función puede venir en la raíz o en `default`.
const bcrypt = await import('bcryptjs');
const hash = bcrypt.hash ?? bcrypt.default.hash;

const RONDAS = 12; // El mismo BCRYPT_ROUNDS que usa la API en Staging (render.yaml).

const EN_TERMINAL = stdout.isTTY === true;

/**
 * Con el teclado se pregunta de una en una. Con la entrada canalizada —las pruebas— se leen
 * todas las líneas de golpe: readline las emite en cuanto llegan y las que no tienen una
 * pregunta esperando se pierden.
 */
const rl = EN_TERMINAL ? createInterface({ input: stdin, output: stdout, terminal: true }) : null;
const canalizadas = EN_TERMINAL
  ? []
  : await new Promise((resolver) => {
      let texto = '';
      stdin.setEncoding('utf8');
      stdin.on('data', (trozo) => (texto += trozo));
      stdin.on('end', () => resolver(texto.split(/\r?\n/)));
    });

/** Pregunta normal, para datos que no son secretos. */
const preguntar = (etiqueta) => {
  if (!EN_TERMINAL) {
    const respuesta = canalizadas.shift() ?? '';
    stdout.write(`${etiqueta}${respuesta}\n`);
    return Promise.resolve(respuesta);
  }
  return new Promise((resolver) => rl.question(etiqueta, resolver));
};

/**
 * Pregunta tapando lo que se escribe. El tapado necesita una terminal de verdad; si la
 * entrada viene canalizada (una prueba, por ejemplo), pregunta sin tapar.
 */
function preguntarOculto(etiqueta) {
  if (!EN_TERMINAL) return preguntar(etiqueta);
  return new Promise((resolver) => {
    const alEscribir = (dato) => {
      const texto = dato.toString();
      if (texto === '\r' || texto === '\n') return;
      stdout.clearLine(0);
      stdout.cursorTo(0);
      stdout.write(etiqueta);
    };
    stdin.on('data', alEscribir);
    rl.question(etiqueta, (respuesta) => {
      stdin.off('data', alEscribir);
      stdout.write('\n');
      resolver(respuesta);
    });
  });
}

const problemas = (clave) => {
  const faltas = [];
  if (clave.length < 12) faltas.push('al menos 12 caracteres');
  if (!/[A-Z]/.test(clave)) faltas.push('una mayúscula');
  if (!/[a-z]/.test(clave)) faltas.push('una minúscula');
  if (!/[0-9]/.test(clave)) faltas.push('un número');
  if (/^EC321$/i.test(clave)) faltas.push('una contraseña distinta a la de desarrollo');
  return faltas;
};

console.log('\n── Administrador de Staging ───────────────────────────────────────');
console.log('La contraseña no se muestra, no se guarda y no sale de esta máquina.');
console.log('Solo se imprime su hash bcrypt.\n');

const usuario = (await preguntar('Nombre de usuario: ')).trim() || 'admin.staging';
const correo = (await preguntar('Correo: ')).trim() || 'admin.staging@becas.gob.gt';
const clave = await preguntarOculto('Contraseña: ');
const repetida = await preguntarOculto('Repita la contraseña: ');

if (clave !== repetida) {
  console.error('\n✘ Las dos contraseñas no coinciden. No se generó nada.');
  rl?.close();
  process.exit(1);
}

const faltas = problemas(clave);
if (faltas.length > 0) {
  console.error(`\n✘ La contraseña necesita ${faltas.join(', ')}. No se generó nada.`);
  rl?.close();
  process.exit(1);
}

const hashBcrypt = await hash(clave, RONDAS);
const escapar = (valor) => valor.replace(/'/g, "''");

/**
 * Dos caminos, porque Render ya no ofrece un comando `psql` listo para pegar: o el script
 * escribe en la base (usando la *External Database URL* del panel), o imprime el SQL para
 * quien prefiera hacerlo a mano con psql o el Render CLI.
 */
/**
 * La URL puede venir de la variable de entorno STAGING_DB_URL —útil cuando pegar a ciegas en
 * la terminal da problemas— o escribirse aquí. En ninguno de los dos casos se guarda.
 */
let url = (process.env.STAGING_DB_URL ?? '').trim();
if (url !== '') {
  console.log('\nUsando la URL de la variable STAGING_DB_URL.');
} else {
  console.log('\n── Cómo quiere crearlo ────────────────────────────────────────────');
  console.log('A) Pegue la External Database URL de Render y lo inserto yo.');
  console.log('B) Deje esto vacío y le imprimo el SQL para pegarlo usted.\n');
  url = (await preguntarOculto('External Database URL (o Enter para la opción B): ')).trim();
}

rl?.close();

if (url === '') {
  console.log('\n── Pegue esto en la consola de PostgreSQL de Render ────────────────\n');
  console.log(`INSERT INTO usuarios (id, nombre_usuario, correo, hash_password, rol, activo, intentos_fallidos, creado_en, actualizado_en)
VALUES (gen_random_uuid(), '${escapar(usuario)}', '${escapar(correo)}', '${hashBcrypt}', 'ADMINISTRADOR', true, 0, now(), now());`);
  console.log('\n── Para comprobar que quedó ──────────────────────────────────────\n');
  console.log('SELECT nombre_usuario, rol, activo FROM usuarios;');
} else {
  // Render exige TLS en las conexiones externas y su URL no siempre lo declara.
  const urlSegura = url.includes('sslmode=')
    ? url
    : `${url}${url.includes('?') ? '&' : '?'}sslmode=require`;

  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient({ datasourceUrl: urlSegura });
  try {
    const creado = await prisma.usuario.create({
      data: {
        nombreUsuario: usuario,
        correo,
        hashPassword: hashBcrypt,
        rol: 'ADMINISTRADOR',
        activo: true,
      },
      select: { nombreUsuario: true, rol: true, activo: true },
    });
    console.log('\n✔ Administrador creado en Staging:', creado);
    const cuentas = await prisma.usuario.count();
    console.log(`  La base tiene ahora ${cuentas} cuenta(s).`);
  } catch (error) {
    if (error.code === 'P2002') {
      console.error(`\n✘ Ya existe una cuenta con ese usuario o ese correo. Elija otro nombre, o
  cambie la contraseña de la existente en lugar de crear una nueva.`);
    } else {
      console.error('\n✘ No se pudo crear:', error.message.split('\n')[0]);
      console.error('  Revise que la URL sea la *External* y que la base esté disponible.');
    }
    await prisma.$disconnect();
    process.exit(1);
  }
  await prisma.$disconnect();
}

console.log('\nUsuario:', usuario, '· la contraseña es la que acaba de escribir.');
console.log('Anótela en un lugar seguro: no se puede recuperar, solo reemplazar.\n');
