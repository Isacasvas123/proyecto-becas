# Justificación de Patrones de Diseño

| | |
|---|---|
| **Proyecto** | Plataforma Nacional para la Gestión Integral de Becas |
| **Responsable** | Stuard (con revisión de todo el equipo) |
| **Fecha** | 3 de septiembre de 2026 · **Versión** 1.0 |

> El objetivo del curso **no es usar patrones por obligación, sino resolver problemas de
> diseño**. Cada patrón de este documento se seleccionó porque existía un problema concreto en
> el dominio de becas, y cada uno responde las cuatro preguntas exigidas: qué problema resuelve,
> qué alternativas existían, por qué se eligió y qué ventajas aporta.

**Cumplimiento del mínimo requerido:** 2 creacionales · 2 estructurales · 2 de comportamiento.

| Tipo | Patrón | Dónde vive | Sprint | Estado |
|---|---|---|---|---|
| Creacional | **Factory Method** | `modules/convocatorias/domain/factories/` | **3** | ✅ **Implementado** (adelantado al 12 Sep) |
| Creacional | **Builder** | `modules/reportes/application/builders/` | **7** | ✅ **Implementado** (adelantado al 16 Sep) |
| Estructural | **Adapter** | `modules/usuarios/infrastructure/adapters/` | **1** | ✅ **Implementado** |
| Estructural | **Facade** | `modules/resoluciones/application/facades/` | **6** | ✅ **Implementado** (adelantado al 16 Sep) |
| Comportamiento | **State** | `modules/solicitudes/domain/estados/` | **4** | ✅ **Implementado** (adelantado al 16 Sep) |
| Comportamiento | **Strategy** | `modules/evaluaciones/domain/strategies/` | **5** | ✅ **Implementado** (adelantado al 16 Sep) |
| *Extra* | Observer | `shared/patterns/observer/` | 5 (opcional) | Pendiente |
| *Extra* | Chain of Responsibility | `modules/solicitudes/domain/validaciones/` | 6 (opcional) | Pendiente |

> **Actualización del 3 de septiembre de 2026.** El patrón **Adapter se adelantó al Sprint 1**:
> el inicio de sesión (US-002) necesitaba calcular y verificar hashes de contraseña y emitir
> tokens de sesión, y ninguna de las dos cosas puede vivir en el dominio sin acoplarlo a
> `bcryptjs` y a `@nestjs/jwt`. Se resolvió con dos puertos y sus adaptadores, exactamente el
> mismo mecanismo previsto para el almacenamiento de documentos en el Sprint 4.
>
> No fue una decisión de calendario sino de diseño: el patrón apareció porque el problema
> apareció, que es justamente el criterio del curso —*"el objetivo no es utilizar patrones por
> obligación, es resolver problemas de diseño"*. Ver la sección **Adapter** más abajo, donde se
> documentan las tres implementaciones actuales.

---

# PATRONES CREACIONALES

## 1. Factory Method — `ConvocatoriaFactory`

**Ubicación:** `modules/convocatorias/domain/factories/convocatoria.factory.ts`

### ¿Qué problema resuelve?

El Ministerio administra tres programas de becas —nivel medio, universitario y posgrado— y cada
uno se crea con reglas distintas: distintos documentos exigidos, distintos requisitos de
elegibilidad, distintos rangos de cupos y distinto criterio de evaluación por defecto. Sin un
patrón, la creación de una convocatoria terminaría en un condicional gigante dentro del servicio
de aplicación, que habría que modificar cada vez que el Product Owner introduzca un programa
nuevo.

### ¿Qué otras alternativas existían?

1. **Un constructor único con un `switch` sobre el tipo.** Descartada: cada nuevo tipo de beca
   obliga a modificar una clase ya probada y en producción, violando el principio Open/Closed.
   Con un PO que anunció que cambiará los requerimientos, es la peor opción posible.
2. **Un constructor con todos los parámetros opcionales.** Descartada: traslada al llamador la
   responsabilidad de conocer las reglas de cada tipo de beca, y nada impide construir una
   convocatoria inválida.
3. **Abstract Factory.** Descartada por sobreingeniería: solo se produce **una** familia de
   objetos (convocatorias). Abstract Factory se justificaría si además hubiera que crear
   formularios y validadores emparejados por tipo, que no es el caso.

### ¿Por qué se seleccionó Factory Method?

Porque el problema es exactamente el que el patrón resuelve: **diferir a subclases la decisión de
qué objeto concreto instanciar**, manteniendo un punto de creación único y consistente. Agregar
un programa nuevo de becas se convierte en crear una subclase y registrarla, sin tocar una línea
del código existente.

### ¿Qué ventajas aporta al proyecto?

- **Extensibilidad sin modificación** (Open/Closed): un nuevo tipo de beca = una clase nueva.
- **Las reglas de cada tipo quedan encapsuladas** en un lugar identificable, no dispersas.
- **Imposible crear una convocatoria en estado inválido**: la fábrica garantiza las invariantes.
- **Testeable**: cada fábrica concreta se prueba de forma aislada.

### Implementación real — Sprint 3

**✅ IMPLEMENTADO** en `modules/convocatorias/domain/factories/convocatoria.factory.ts`, con 18
pruebas propias en `convocatoria.factory.spec.ts`.

```ts
export abstract class ConvocatoriaFactory {
  // EL MÉTODO PLANTILLA: igual para todos los tipos; no se sobrescribe.
  crear(datos: DatosNuevaConvocatoria): Convocatoria {
    this.validarCupos(datos.cupos);
    return Convocatoria.nuevaEnBorrador({
      ...,
      tipo: this.tipo(),
      requisitos: datos.requisitos ?? this.requisitosPorDefecto(),
      documentosExigidos: datos.documentosExigidos ?? this.documentosPorDefecto(),
    });
  }

  abstract tipo(): TipoBeca;
  abstract prefijoCodigo(): string;                      // UNIV-2026-001
  abstract requisitosPorDefecto(): readonly Requisito[];
  abstract documentosPorDefecto(): readonly TipoDocumento[];
  protected validarCupos(_cupos: number): void {}        // gancho opcional
}

export class ConvocatoriaPosgradoFactory extends ConvocatoriaFactory {
  protected validarCupos(cupos: number) {
    if (cupos > 50) throw new ReglaDeNegocioError('... como máximo 50 cupos.');
  }
  // ...
}

// El único punto que asocia tipo y fábrica. `satisfies` hace que olvidar un tipo sea
// un error de COMPILACIÓN, no un fallo en producción.
export const FABRICAS_CONVOCATORIA = {
  [TipoBeca.NIVEL_MEDIO]:   new ConvocatoriaNivelMedioFactory(),
  [TipoBeca.UNIVERSITARIA]: new ConvocatoriaUniversitariaFactory(),
  [TipoBeca.POSGRADO]:      new ConvocatoriaPosgradoFactory(),
} as const satisfies Readonly<Record<TipoBeca, ConvocatoriaFactory>>;
```

El servicio de aplicación no tiene ni un `if` por tipo: pide la fábrica y le dice "crea".

### Diferencias con el diseño original, y por qué

| Diseño original | Implementación | Motivo |
|---|---|---|
| `criterioPorDefecto()` en cada fábrica | **No está** | El criterio de evaluación es el patrón Strategy del Sprint 5. Declararlo hoy sería un método sin nadie que lo use |
| — | `prefijoCodigo()` | Apareció al implementar: el código correlativo también varía por tipo, y es exactamente la clase de regla que el patrón encapsula |
| — | Registro `FABRICAS_CONVOCATORIA` | El diseño no decía cómo elegir la fábrica. Un mapa y no un `switch`, por la misma razón que existe el patrón |
| "Un tipo nuevo sin tocar código existente" | Casi | Hay que agregar una línea al registro y el valor en `TipoBeca`. No se toca ninguna fábrica ni el servicio. Se dice tal cual en el código |

**Valores por defecto de cada tipo**, verificables en el código y en `GET /convocatorias/catalogo`:

| Tipo | Requisitos | Documentos | Regla propia |
|---|---|---|---|
| Nivel medio | Nacionalidad, inscrito en nivel medio, promedio ≥70, ingreso familiar limitado | **Certificado de nacimiento** (no DPI: la mayoría son menores de edad), inscripción, notas, ingresos | — |
| Universitaria | Nacionalidad, inscrito en universidad, promedio ≥75 | DPI, inscripción, notas, ingresos | — |
| Posgrado | Título universitario, promedio ≥80, carta de recomendación | DPI, título, notas, carta | **Máximo 50 cupos** ⚠️ pendiente de confirmar con el PO |

---

## 2. Builder — `ReporteBuilder`

**✅ IMPLEMENTADO EL 16 DE SEPTIEMBRE** (previsto para el Sprint 7; llegó con US-028). Con él, **los seis
patrones están implementados**.

**Ubicación:** `modules/reportes/application/builders/reporte.builder.ts`
**Pruebas:** `reporte.builder.spec.ts`.

### ¿Qué problema resuelve?

Los reportes de gestión se construyen combinando muchos elementos **opcionales e
independientes**: rango de fechas, convocatoria, estado de la solicitud, nivel académico,
departamento, agrupación, ordenamiento y formato de salida. Un administrador puede pedir
"solicitudes aprobadas de posgrado en Quetzaltenango durante septiembre, agrupadas por centro
educativo, en CSV" o simplemente "todas las solicitudes de la convocatoria 12". Construir eso
con un único constructor produce el anti-patrón del **constructor telescópico**.

### ¿Qué otras alternativas existían?

1. **Constructor con ocho parámetros opcionales.** Descartada: ilegible en el punto de llamada
   (`new Reporte(null, null, 'APROBADA', null, null, 'centro', null, 'CSV')`), propenso a errores
   por orden de argumentos, e imposible de validar de forma incremental.
2. **Un objeto de configuración plano** (`new Reporte({...})`). Descartada: no valida las
   combinaciones inválidas —por ejemplo, agrupar por criterio de evaluación en un reporte que no
   incluye evaluaciones— y permite construir un objeto a medio armar.
3. **Un método por cada combinación de reporte.** Descartada: explosión combinatoria; con 8
   filtros serían cientos de métodos.

### ¿Por qué se seleccionó Builder?

Porque separa la **construcción** de un objeto complejo de su **representación**, permite
construirlo paso a paso con una interfaz fluida y legible, y —lo decisivo— permite **validar en
el método `build()`** que la combinación de filtros elegida es coherente antes de producir el
reporte.

### ¿Qué ventajas aporta al proyecto?

- **Legibilidad** en el punto de uso: el código se lee como la petición del administrador.
- **Validación centralizada** de combinaciones inválidas en un único lugar.
- **Extensible**: un filtro nuevo es un método nuevo, sin romper las llamadas existentes.
- Habilita **reutilización**: el mismo builder alimenta la vista web, la exportación a CSV y la
  exportación a PDF.

### Esquema — tal como quedó implementado

```ts
const spec = new ReporteBuilder()
  .conEstados(['APROBADA', 'ADJUDICADA'])
  .deNivel('POSGRADO')
  .deDepartamento('QUETZALTENANGO')
  .entreFechas(inicio, fin)                 // por fecha de envío
  .agrupadoPor('CENTRO_EDUCATIVO')
  .ordenadoPor('ENVIO_RECIENTE')
  .enFormato('CSV')
  .build();                                 // valida y devuelve una especificación congelada

const reporte = await generarReporte.generar(spec);   // independiente del formato
const archivo = exportadores.find((e) => e.formato === spec.formato).exportar(reporte);
```

**Qué rechaza `build()`.** Fechas al revés, una lista de estados vacía y agrupar por el mismo dato
por el que se filtró (todo caería en un solo grupo). Cada paso, además, rechaza valores fuera de
catálogo: un borrador no es una solicitud recibida, `XLSX` no es un formato disponible.

**Dónde se ve la ventaja.** En el controlador, cada parámetro de la consulta es opcional y solo se
llama al paso que corresponde a los que llegaron: no hay un `if` por combinación ni un constructor de
nueve argumentos. Y el reporte de becas por región (US-031) se pide con el mismo builder —solo
adjudicadas, agrupadas por departamento— en lugar de tener su propia consulta.

**Dos diferencias con la versión 1.0.** El builder produce una **especificación**, no el reporte: los
datos los junta un servicio aparte y el formato lo aplica un exportador (CSV o PDF), de modo que un
formato nuevo sirve para todos los reportes. Y el departamento es un **código** del catálogo, no el
nombre escrito, por la misma razón que en el perfil (US-011).

---

# PATRONES ESTRUCTURALES

## 3. Adapter — puertos de infraestructura

**✅ IMPLEMENTADO EN EL SPRINT 1** (adelantado desde el Sprint 4, ver nota inicial).

**Ubicaciones actuales:**

| Puerto (domain) | Adaptador (infrastructure) | Qué aísla |
|---|---|---|
| `usuarios/domain/ports/hasher-password.ts` | `BcryptHasherAdapter` | La biblioteca de hashing (`bcryptjs`) |
| `usuarios/domain/ports/generador-token.ts` | `JwtGeneradorTokenAdapter` | El formato de sesión (JWT HS256) |
| `usuarios/domain/ports/verificador-token.ts` | `JwtVerificadorTokenAdapter` | La validación de la sesión, que consume el guard global (US-003) |
| `usuarios/domain/ports/usuario.repositorio.ts` | `UsuarioPrismaRepositorio` · `UsuarioEnMemoriaRepositorio` | La persistencia |

| `solicitudes/domain/ports/almacenamiento-documentos.ts` | `AlmacenamientoLocalAdapter` · `AlmacenamientoMemoriaAdapter` | Dónde se guardan los documentos (US-013). Se elige con `ALMACENAMIENTO_TIPO` |
| `solicitudes/domain/ports/notificador-solicitudes.ts` | `NotificadorConsolaAdapter` | El canal de avisos. El de correo llega con US-022 |
| `solicitudes/domain/ports/consultas-externas.ts` | `ConsultaConvocatoriasAdapter` · `ConsultaPerfilesAdapter` | Otros módulos: `solicitudes` no importa su dominio, solo lo que exportan |

> **16 de septiembre.** Se agregó el almacenamiento de documentos que aquí estaba *previsto para el
> Sprint 4*. El adaptador local guarda las rutas **relativas** y comprueba, antes de leer o borrar,
> que no salgan de su carpeta: una referencia manipulada como `../../.env` no llega al disco. El
> de la nube no existe todavía; si se configura, la API **no arranca**, para que el error se vea al
> desplegar y no con el primer documento.

### ¿Qué problema resuelve?

Los estudiantes cargan documentos de respaldo (DPI, certificados, constancias). En desarrollo
conviene guardarlos en el disco local; en producción deben ir a almacenamiento en la nube. Además,
el enunciado del proyecto anticipa explícitamente **integraciones con otras instituciones**, con
APIs que no controlamos y cuyas interfaces no coinciden con lo que nuestro dominio necesita.

Sin este patrón, la lógica de negocio quedaría acoplada a un proveedor concreto, y cambiar de
proveedor —o que el PO exija integrarse con el sistema del Ministerio— obligaría a modificar el
dominio.

### ¿Qué otras alternativas existían?

1. **Llamar directamente al SDK del proveedor desde el servicio.** Descartada: acopla el dominio
   a una dependencia externa e impide probarlo sin red ni credenciales.
2. **Una clase con un `switch` sobre el entorno.** Descartada: cada proveedor nuevo modifica una
   clase existente, y mezcla en un mismo archivo detalles de dos infraestructuras distintas.
3. **Facade sobre el proveedor.** Descartada para este caso: Facade *simplifica* un subsistema,
   pero no resuelve el problema real aquí, que es **hacer compatibles interfaces incompatibles**
   detrás de un contrato que define nuestro dominio.

### ¿Por qué se seleccionó Adapter?

Porque el problema es precisamente el de convertir la interfaz de un servicio externo en la
interfaz que nuestro dominio espera. El dominio declara el puerto —lo que **necesita**— y cada
adaptador traduce hacia lo que el proveedor concreto **ofrece**. La dirección de la dependencia
se invierte: manda el dominio, no el proveedor.

### ¿Qué ventajas aporta al proyecto?

- **El dominio queda libre de infraestructura**: se prueba con un adaptador en memoria, sin nube
  ni credenciales.
- **Cambiar de proveedor no toca el dominio**: se registra otro adaptador en el módulo.
- **Preparado para el cambio anunciado**: cuando el PO exija integrar RENAP o el sistema del
  MinEduc, se agrega un adaptador nuevo. Este es el argumento más fuerte del documento frente al
  criterio "adaptarse al cambio".
- El mismo patrón se reutiliza para el envío de notificaciones (`NotificacionPort`).

### Esquema — implementación real del Sprint 1

```ts
// domain/ports/hasher-password.ts  — lo que el dominio NECESITA
export interface HasherPassword {
  verificar(passwordEnClaro: string, hashAlmacenado: string): Promise<boolean>;
  calcular(passwordEnClaro: string): Promise<string>;
}

// infrastructure/adapters/  — lo que la biblioteca OFRECE, adaptado
export class BcryptHasherAdapter implements HasherPassword { /* bcryptjs */ }
```

El enlace entre ambos ocurre en un solo punto, `usuarios.module.ts`:

```ts
{ provide: HASHER_PASSWORD,   useClass: BcryptHasherAdapter },
{ provide: GENERADOR_TOKEN,   useClass: JwtGeneradorTokenAdapter },
{ provide: VERIFICADOR_TOKEN, useClass: JwtVerificadorTokenAdapter },
```

Migrar a argon2, o cambiar JWT por sesiones en servidor, es cambiar **una línea** de ese archivo.
Ni la entidad `Usuario`, ni el caso de uso `AutenticarUsuarioService`, ni el controlador se
enteran. Esa es la ventaja, y es verificable: la prueba unitaria del caso de uso inyecta un
hasher falso y corre en milisegundos, sin bcrypt real.

### Esquema — almacenamiento de documentos (implementado el 16 Sep)

```ts
// solicitudes/domain/ports/almacenamiento-documentos.ts
export interface AlmacenamientoDocumentos {
  guardar(contenido: Buffer, destino: { carpeta: string; nombre: string }): Promise<string>;
  obtener(referencia: string): Promise<Buffer>;
  eliminar(referencia: string): Promise<void>;
}

// solicitudes/infrastructure/almacenamiento/
export class AlmacenamientoLocalAdapter   implements AlmacenamientoDocumentos { /* node:fs */ }
export class AlmacenamientoMemoriaAdapter implements AlmacenamientoDocumentos { /* pruebas */ }
// AlmacenamientoNubeAdapter: cuando haya proveedor. Es una clase nueva y una línea en el módulo.
```

El caso de uso `CargarDocumentoService` usa el puerto en un orden deliberado: **guarda el archivo
nuevo con un nombre único, actualiza la solicitud, y solo entonces borra el anterior**. Si guardar
la solicitud falla, borra el archivo recién subido. Así nunca queda un documento marcado como
cargado sin archivo detrás (flujo de excepción 3a de CU-07). Las pruebas lo verifican con el
adaptador en memoria, forzando el fallo del repositorio.

---

## 4. Facade — `ResolucionFacade`

**✅ IMPLEMENTADO EL 16 DE SEPTIEMBRE** (previsto para el Sprint 6; llegó con US-023).

**Ubicación:** `modules/resoluciones/application/facades/resolucion.facade.ts`
**Pruebas:** `casos-de-uso-resoluciones.spec.ts` con dobles de cada colaborador.

> **Por qué cambió de lugar.** La versión 1.0 la ponía en `solicitudes`. Pero resolver necesita los
> dictámenes de `evaluaciones`, y `evaluaciones` ya depende de `solicitudes`: la fachada ahí habría
> creado un ciclo entre módulos. Vive en un módulo propio, `resoluciones`, del que nadie depende.
> También cambió el nombre: `SolicitudFacade` sugería una fachada de todo lo que se hace con una
> solicitud, y esta resuelve.

### ¿Qué problema resuelve?

Resolver una solicitud (aprobarla o rechazarla) no es una operación simple: hay que verificar que
tenga dictámenes registrados, comprobar que quedan cupos disponibles en la convocatoria, ejecutar
la transición de estado validando que sea legal, generar el registro de auditoría, crear el acta
de resolución y notificar al estudiante. Son seis colaboradores distintos.

Si el controlador orquestara todo eso, la lógica de negocio se filtraría a la capa de
presentación, se duplicaría en cada punto que necesite resolver una solicitud (API REST,
resolución masiva por convocatoria, tarea programada de cierre) y sería imposible de probar sin
levantar HTTP.

### ¿Qué otras alternativas existían?

1. **Que el controlador llame a los seis servicios.** Descartada: viola la separación de capas y
   duplica la orquestación en cada punto de entrada.
2. **Un servicio "Dios" que haga todo internamente.** Descartada: viola responsabilidad única y
   convierte una clase en inmantenible.
3. **Mediator.** Descartada: Mediator resuelve comunicación *bidireccional* entre muchos objetos
   que se conocen entre sí. Aquí el flujo es unidireccional y conocido de antemano; Facade es más
   simple y suficiente.

### ¿Por qué se seleccionó Facade?

Porque proporciona **una interfaz unificada y simple a un subsistema complejo**. El controlador
llama a `resolver(solicitudId, decision, motivo)` y no necesita saber nada del orden ni de los
colaboradores. La fachada no implementa la lógica: **coordina**, delegando en cada servicio
especializado. Así se preserva la responsabilidad única de cada uno.

### ¿Qué ventajas aporta al proyecto?

- **Punto de entrada único** al proceso, reutilizado por REST, resolución masiva y tareas
  programadas.
- **Menor acoplamiento**: la capa de presentación depende de una interfaz, no de seis.
- **La transaccionalidad se maneja en un solo lugar**: o se completa todo el proceso, o no se
  aplica nada.
- **Testeable de punta a punta** sin levantar el servidor HTTP.

### Esquema — tal como quedó implementado

```ts
@Injectable()
export class ResolucionFacade {
  constructor(
    private readonly solicitudes: ConsultaSolicitudesResolucion,   // → solicitudes (State)
    private readonly dictamenes: ConsultaDictamenes,               // → evaluaciones
    private readonly convocatorias: ConsultaConvocatoriasResolucion, // → convocatorias (cupos)
    private readonly notificador: NotificadorResoluciones,         // → aviso al estudiante
  ) {}

  async resolver(solicitudId, decision, motivo, adminId) {
    // 1. Validaciones que no cambian nada
    exigirMotivo(motivo);                                           // criterio 2
    const solicitud = await this.cargarSolicitud(solicitudId);
    if ((await this.dictamenes.resumen(solicitud.id)).total === 0)  // criterio 1
      throw new ReglaDeNegocioError('... no tiene ningún dictamen ...');
    const convocatoria = await this.cargarConvocatoria(solicitud.convocatoriaId);
    if (decision === 'APROBAR') (await this.ocupacion(convocatoria)).asegurarCupoParaAprobar();

    // 2. La única escritura: transición (State) + historial + comprobación ATÓMICA del cupo
    const resuelta = await this.solicitudes.resolver(solicitud.id, decision, motivo, adminId,
                                                     convocatoria.cupos);   // criterios 3 y 4

    // 3. El aviso; si falla, la resolución ya está hecha
    await this.avisar(resuelta, motivo);
    return this.resultado(resuelta, convocatoria);
  }
}

// El controlador: una línea por operación, sin saber cuántos colaboradores hay detrás.
resolver(@UsuarioActual() adminId, @Param('id') id, @Body() p) {
  return this.fachada.resolver(id, p.decision, p.motivo, adminId);
}
```

**La comprobación del cupo ocurre dos veces, a propósito.** La de la fachada da un buen mensaje
antes de intentar. La definitiva está en el repositorio de solicitudes: bloquea la fila de la
convocatoria (`SELECT … FOR UPDATE`), cuenta y guarda en la misma transacción. Se verificó contra
PostgreSQL lanzando **tres aprobaciones simultáneas por el último cupo: pasó una, las otras dos
recibieron 422**. Sin el bloqueo, las tres habrían visto un cupo libre.

**Auditoría:** no es un colaborador aparte porque ya la da el patrón State: cada transición queda en
el historial con autor, fecha y motivo, en la misma transacción. **Acta:** es US-026; cuando exista,
será un colaborador más de la fachada y el controlador no cambiará.

---

# PATRONES DE COMPORTAMIENTO

## 5. State — `EstadoSolicitud`

**✅ IMPLEMENTADO EL 16 DE SEPTIEMBRE** (previsto para el Sprint 4; llegó con US-012).

**Ubicación:** `modules/solicitudes/domain/estados/estados-solicitud.ts`
**Pruebas:** `estados-solicitud.spec.ts` recorre **los 30 pares** estado × acción contra la tabla del
diagrama: si alguien habilita una transición que no está dibujada, una prueba falla.

### ¿Qué problema resuelve?

Una solicitud atraviesa un ciclo de vida estricto:

```
BORRADOR → ENVIADA → EN_EVALUACION → APROBADA → ADJUDICADA
                                   ↘ RECHAZADA
```

Cada estado permite operaciones distintas: en `BORRADOR` se pueden cargar y reemplazar
documentos, pero no evaluar; en `EN_EVALUACION` se puede dictaminar, pero no editar; en
`ADJUDICADA` no se puede hacer nada. Las transiciones ilegales —evaluar un borrador, adjudicar
una solicitud rechazada— deben ser **imposibles**, no solo estar desaconsejadas.

Implementado con un campo de texto y condicionales, esto se convierte en `if (estado === ...)`
repartidos por decenas de métodos: cada regla nueva obliga a encontrar y actualizar todos, y
basta olvidar uno para corromper un expediente.

### ¿Qué otras alternativas existían?

1. **Un `enum` con condicionales en cada método.** Descartada: la lógica de transición queda
   dispersa; agregar un estado obliga a revisar todo el código, y nada garantiza haberlos
   encontrado todos.
2. **Una tabla de transiciones válidas en base de datos.** Descartada: mueve reglas de negocio
   fuera del código, no se puede probar unitariamente y no permite que cada estado tenga
   comportamiento propio, solo permisos.
3. **Strategy.** Descartada: Strategy intercambia *algoritmos* elegidos desde fuera. Aquí el
   objeto **cambia su propio comportamiento al cambiar su estado interno**, y las transiciones
   las decide el propio estado. Esa es la definición de State.

### ¿Por qué se seleccionó State?

Porque el problema es literalmente el que el patrón describe: un objeto cuyo comportamiento
depende de su estado interno y que parece cambiar de clase al cambiar de estado. Cada estado se
convierte en una clase que **conoce sus propias transiciones legales**. Una transición inválida
lanza una excepción de dominio desde el propio estado, sin que ningún otro código deba
recordarlo.

### ¿Qué ventajas aporta al proyecto?

- **Elimina por completo los condicionales de estado** dispersos por el dominio.
- **Las transiciones ilegales son imposibles por construcción**, no por disciplina.
- **Agregar un estado nuevo es agregar una clase** (Open/Closed). Si el PO introduce
  `EN_SUBSANACION` —para solicitudes con documentos incompletos, un cambio muy probable— es una
  clase nueva, no una cirugía.
- **El diagrama de estados se traduce uno a uno al código**, y el código sirve de documentación.
- Cada estado se prueba unitariamente por separado.

### Esquema — tal como quedó implementado

```ts
export abstract class EstadoSolicitud {
  abstract readonly nombre: NombreEstado;
  verificarCargaDeDocumentos(): void              { this.rechazar('cargar o reemplazar documentos de'); }
  enviar(_s: VistaSolicitud): EstadoSolicitud     { return this.rechazar('enviar'); }
  iniciarEvaluacion(): EstadoSolicitud            { return this.rechazar('pasar a evaluación'); }
  resolver(_d: Decision): EstadoSolicitud         { return this.rechazar('resolver'); }
  adjudicar(): EstadoSolicitud                    { return this.rechazar('adjudicar'); }
  estaActiva(): boolean                           { return true; }

  protected rechazar(accion: string): never {
    throw new TransicionInvalidaError(`No se puede ${accion} una solicitud en estado ${this.nombre}.`);
  }
}

export class EstadoBorrador extends EstadoSolicitud {
  readonly nombre = NombreEstado.BORRADOR;
  verificarCargaDeDocumentos(): void { /* permitido */ }
  enviar(solicitud: VistaSolicitud): EstadoSolicitud {
    const faltantes = solicitud.documentosFaltantes();
    if (faltantes.length > 0) throw new ReglaDeNegocioError(`Faltan documentos exigidos: ...`);
    return new EstadoEnviada();
  }
  // iniciarEvaluacion(), resolver() y adjudicar() heredan el rechazo.
}

// En la entidad: no hay un solo if sobre el estado.
enviar(ahora: Date, autorId: string): void {
  this.transicionar(this.estado.enviar(this), ahora, autorId, null);
  this._enviadaEn = ahora;
}
```

**Una diferencia con la versión 1.0 de este esquema, y por qué.** En la variante clásica el estado
llama a `solicitud.cambiarEstado(...)`, lo que obliga a exponer ese método a cualquiera. Aquí cada
transición **devuelve** el estado siguiente y es la `Solicitud` quien lo aplica y lo anota en el
historial (US-016). Resultado: la solicitud es la única que se modifica a sí misma, ningún código
externo puede saltarse el historial, y cada estado se prueba sin construir una solicitud completa.
`VistaSolicitud` es la interfaz mínima que un estado necesita ver: solo los documentos faltantes.

Los estados de evaluación y adjudicación ya existen y están probados porque son parte del modelo;
los **casos de uso** que los disparan llegan con sus historias (US-018, US-023, US-024).

---

## 6. Strategy — `CriterioEvaluacionStrategy`

**✅ IMPLEMENTADO EL 16 DE SEPTIEMBRE** (previsto para el Sprint 5; llegó con US-019).

**Ubicación:** `modules/evaluaciones/domain/strategies/`
**Pruebas:** `criterios.spec.ts` — cada fórmula en sus extremos, y que el mixto use lo que devuelven
los otros dos criterios en vez de repetir sus fórmulas.

### ¿Qué problema resuelve?

No todas las becas se evalúan igual. Una beca de excelencia académica pondera el promedio y los
reconocimientos; una beca de apoyo social pondera el ingreso familiar per cápita y el número de
dependientes; una beca mixta combina ambos con pesos definidos por la política vigente. Y el
enunciado advierte que habrá **cambios normativos y nuevas políticas institucionales** durante el
semestre: aparecerán criterios nuevos.

### ¿Qué otras alternativas existían?

1. **Un método `calcularPuntaje()` con condicionales por tipo de beca.** Descartada: cada cambio
   normativo modifica un método ya probado, con riesgo de romper el cálculo de las becas
   existentes. En un sistema que asigna fondos públicos, es inaceptable.
2. **Herencia: una subclase de `Evaluacion` por tipo de beca.** Descartada: amarra el criterio de
   evaluación al tipo de la entidad en tiempo de compilación, e impide reevaluar una solicitud
   con un criterio distinto o comparar resultados entre criterios.
3. **Fórmula configurable en base de datos.** Descartada: sacrifica la validación en tiempo de
   compilación y no es testeable unitariamente. Se descartó por trazabilidad: un cálculo que
   asigna fondos públicos debe estar versionado en Git y auditado por code review, no ser un
   registro editable.

### ¿Por qué se seleccionó Strategy?

Porque existe **una familia de algoritmos intercambiables** que resuelven la misma tarea —dada una
solicitud, producir un puntaje— y el algoritmo a usar se decide en tiempo de ejecución según el
tipo de beca. Strategy encapsula cada algoritmo en su propia clase y los hace intercambiables sin
que el código cliente cambie.

### ¿Qué ventajas aporta al proyecto?

- **Una política de becas nueva = una clase nueva.** Cero modificaciones al código existente. Es
  la respuesta directa al criterio de evaluación "capacidad de adaptarse al cambio".
- **Cada fórmula se prueba unitariamente** con casos límite, sin tocar la base de datos.
- **Los criterios quedan explícitos y auditables**, que es exactamente lo que hoy no puede hacer
  el Ministerio.
- **Elimina los condicionales** del servicio de evaluación.
- Permite **comparar** el resultado de una misma solicitud bajo distintos criterios.

### Esquema — tal como quedó implementado

```ts
export interface CriterioEvaluacionStrategy {
  readonly nombre: string;
  calcular(datos: DatosEvaluables): ResultadoCriterio;  // { criterio, puntaje 0..100, desglose }
}

export class CriterioMeritoAcademico implements CriterioEvaluacionStrategy {
  readonly nombre = 'Mérito académico';
  calcular(d: DatosEvaluables) { /* puntaje = promedio */ }
}

export class CriterioNecesidadSocioeconomica implements CriterioEvaluacionStrategy {
  readonly nombre = 'Necesidad socioeconómica';
  calcular(d: DatosEvaluables) { /* ingreso ÷ dependientes: 100 si ≤ Q500, 0 si ≥ Q5,000, lineal */ }
}

export class CriterioMixto implements CriterioEvaluacionStrategy {
  constructor(
    private readonly academico: CriterioEvaluacionStrategy,
    private readonly social: CriterioEvaluacionStrategy,
    private readonly pesoAcademico: number,
  ) {}
  calcular(d: DatosEvaluables) {
    const a = this.academico.calcular(d);
    const s = this.social.calcular(d);
    return { puntaje: a.puntaje × peso + s.puntaje × (1 − peso), desglose: [...a, ...s] };
  }
}

// El único lugar que relaciona tipos con criterios:
const CRITERIOS = {
  NIVEL_MEDIO: merito,
  UNIVERSITARIA: new CriterioMixto(merito, necesidad, 0.6),
  POSGRADO: merito,
};

// En el caso de uso, sin un solo if sobre el tipo de beca:
criterioPara(convocatoria.tipo).calcular(perfil);
```

**Tres diferencias con la versión 1.0 de este esquema, y por qué.**

1. **Recibe los datos, no la solicitud.** `DatosEvaluables` tiene solo promedio, ingreso y
   dependientes. El criterio no necesita la solicitud entera, y así se prueba con tres números.
2. **`calcular` devuelve el desglose junto con el puntaje**, en vez de dos métodos. Se guarda con
   el dictamen: si el perfil o la fórmula cambian después, el dictamen sigue explicando su puntaje.
3. **No hay "reconocimientos".** El perfil (US-011) no pide ese dato, y no se inventó un campo para
   una fórmula.

> ⚠️ **Las fórmulas y los umbrales son una propuesta del equipo** (16 Sep) y están **pendientes de
> confirmar con el Product Owner**. Cambiarlos es editar una clase y sus pruebas; nada más.

> Nótese que `CriterioMixto` **compone** otras dos estrategias en lugar de duplicar sus fórmulas:
> composición sobre herencia.

---

# PATRONES EXTRA (opcionales, si el cronograma lo permite)

## 7. Observer — Notificaciones de cambio de estado

Cuando una solicitud cambia de estado deben ocurrir efectos secundarios: notificar al estudiante,
registrar auditoría y actualizar estadísticas. Acoplarlos al método de transición violaría
responsabilidad única y obligaría a modificarlo cada vez que se agregue un efecto nuevo. Observer
permite que la solicitud publique el evento y que los interesados se suscriban, sin conocerse
entre sí.

*Alternativa considerada:* llamadas directas dentro del método de transición — descartada por
acoplamiento y porque impide agregar efectos sin modificar el dominio.

## 8. Chain of Responsibility — Validación previa al envío

Antes de enviar una solicitud deben verificarse varias condiciones en cadena: perfil completo,
documentos exigidos cargados, convocatoria vigente, requisitos de elegibilidad cumplidos, sin
solicitud duplicada. Modelarlas como una cadena de manejadores permite agregar, quitar y reordenar
validaciones sin tocar las existentes, y reporta el primer incumplimiento con un mensaje preciso.

*Alternativa considerada:* un método con validaciones secuenciales — descartada porque cada
requisito nuevo del PO obliga a modificarlo, y no permite reutilizar validaciones entre distintos
tipos de beca.

---

## Evidencia para la evaluación

Para cada patrón, al cierre del sprint correspondiente debe existir:

- [ ] La implementación en el repositorio, en la ruta indicada en la tabla inicial
- [ ] Pruebas unitarias que ejerciten el comportamiento propio del patrón
- [ ] La sección de justificación de este documento, completa con las cuatro preguntas
- [ ] El diagrama de clases del patrón en `docs/diagramas/patrones/`
- [ ] El Pull Request donde se introdujo, con la discusión del code review
