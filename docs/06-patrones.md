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
| Creacional | Builder | `modules/reportes/application/builders/` | 7 | Pendiente |
| Estructural | **Adapter** | `modules/usuarios/infrastructure/adapters/` | **1** | ✅ **Implementado** |
| Estructural | Facade | `modules/solicitudes/application/facades/` | 6 | Pendiente |
| Comportamiento | State | `modules/solicitudes/domain/estados/` | 4 | Pendiente |
| Comportamiento | Strategy | `modules/evaluaciones/domain/strategies/` | 5 | Pendiente |
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

**Ubicación:** `modules/reportes/application/builders/reporte.builder.ts`

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

### Esquema

```ts
const reporte = new ReporteBuilder()
  .deConvocatoria(convocatoriaId)
  .conEstado(EstadoSolicitud.APROBADA)
  .entreFechas(inicio, fin)
  .porDepartamento('Quetzaltenango')
  .agrupadoPor(Agrupacion.CENTRO_EDUCATIVO)
  .enFormato(FormatoSalida.CSV)
  .build();   // valida coherencia y devuelve el Reporte listo
```

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

**Ubicación prevista para el Sprint 4:** puerto en `modules/solicitudes/domain/ports/`,
adaptadores en `modules/solicitudes/infrastructure/adapters/` (almacenamiento de documentos).

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

### Esquema previsto para el Sprint 4 — almacenamiento de documentos

```ts
// domain/ports/almacenamiento-documentos.port.ts
export interface AlmacenamientoDocumentosPort {
  guardar(archivo: ArchivoDocumento): Promise<ReferenciaDocumento>;
  obtener(ref: ReferenciaDocumento): Promise<ArchivoDocumento>;
  eliminar(ref: ReferenciaDocumento): Promise<void>;
}

// infrastructure/adapters/
export class AlmacenamientoLocalAdapter implements AlmacenamientoDocumentosPort { /* fs */ }
export class AlmacenamientoNubeAdapter  implements AlmacenamientoDocumentosPort { /* SDK */ }
export class AlmacenamientoMemoriaAdapter implements AlmacenamientoDocumentosPort { /* tests */ }
```

---

## 4. Facade — `SolicitudFacade`

**Ubicación:** `modules/solicitudes/application/facades/solicitud.facade.ts`

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

### Esquema

```ts
export class SolicitudFacade {
  constructor(
    private readonly solicitudes: SolicitudRepositorio,
    private readonly cupos: VerificadorCuposService,
    private readonly auditoria: AuditoriaService,
    private readonly actas: GeneradorActaService,
    private readonly notificador: NotificacionPort,
  ) {}

  async resolver(id: SolicitudId, decision: Decision, motivo: string): Promise<Resolucion> {
    const solicitud = await this.solicitudes.obtener(id);
    if (decision === Decision.APROBAR) await this.cupos.verificarDisponibilidad(solicitud);

    solicitud.resolver(decision, motivo);        // el patrón State valida la transición
    await this.solicitudes.guardar(solicitud);

    await this.auditoria.registrar(solicitud, motivo);
    const acta = await this.actas.generar(solicitud);
    await this.notificador.enviar(solicitud.estudiante, PlantillaNotificacion.RESOLUCION);
    return new Resolucion(solicitud, acta);
  }
}
```

---

# PATRONES DE COMPORTAMIENTO

## 5. State — `EstadoSolicitud`

**Ubicación:** `modules/solicitudes/domain/estados/`

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

### Esquema

```ts
export abstract class EstadoSolicitud {
  abstract get nombre(): NombreEstado;
  cargarDocumento(_: Solicitud, __: Documento): void { this.rechazar('cargar documentos'); }
  enviar(_: Solicitud): void                        { this.rechazar('enviar'); }
  evaluar(_: Solicitud, __: Evaluacion): void       { this.rechazar('evaluar'); }
  resolver(_: Solicitud, __: Decision): void        { this.rechazar('resolver'); }

  protected rechazar(accion: string): never {
    throw new TransicionInvalidaError(
      `No se puede ${accion} una solicitud en estado ${this.nombre}`);
  }
}

export class EstadoBorrador extends EstadoSolicitud {
  get nombre() { return NombreEstado.BORRADOR; }
  cargarDocumento(solicitud: Solicitud, doc: Documento) { solicitud.agregarDocumento(doc); }
  enviar(solicitud: Solicitud) {
    if (!solicitud.tieneTodosLosDocumentos())
      throw new ReglaDeNegocioError('Faltan documentos exigidos por la convocatoria');
    solicitud.cambiarEstado(new EstadoEnviada());
  }
  // evaluar() y resolver() heredan el rechazo: son imposibles desde BORRADOR.
}
```

---

## 6. Strategy — `CriterioEvaluacionStrategy`

**Ubicación:** `modules/evaluaciones/domain/strategies/`

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

### Esquema

```ts
export interface CriterioEvaluacionStrategy {
  readonly nombre: string;
  calcular(solicitud: Solicitud): Puntaje;   // 0..100
  desglose(solicitud: Solicitud): DesglosePuntaje;  // para justificar el dictamen
}

export class CriterioMeritoAcademico implements CriterioEvaluacionStrategy {
  readonly nombre = 'Mérito académico';
  calcular(s: Solicitud): Puntaje {
    return Puntaje.de(
      s.estudiante.promedio * 0.7 + s.estudiante.reconocimientos.length * 5,
    );
  }
  desglose(s: Solicitud) { /* ... */ }
}

export class CriterioNecesidadSocioeconomica implements CriterioEvaluacionStrategy { /* ... */ }

export class CriterioMixto implements CriterioEvaluacionStrategy {
  constructor(
    private readonly academico: CriterioEvaluacionStrategy,
    private readonly social: CriterioEvaluacionStrategy,
    private readonly pesoAcademico = 0.5,
  ) {}
  calcular(s: Solicitud): Puntaje {
    return Puntaje.de(
      this.academico.calcular(s).valor * this.pesoAcademico +
      this.social.calcular(s).valor * (1 - this.pesoAcademico),
    );
  }
}
```

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
