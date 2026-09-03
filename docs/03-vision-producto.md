# Visión del Producto
### Anexo 4, secciones 2 y 3 — Proyecto Final, Análisis de Sistemas II

| | |
|---|---|
| **Nombre del Proyecto** | Plataforma Nacional para la Gestión Integral de Becas |
| **Product Owner** | Ing. Mario Fuentes (catedrático) |
| **Equipo de Desarrollo** | Isaac, Ivan, Fernando, Stuard |
| **Fecha de Creación** | 3 de septiembre de 2026 |
| **Versión** | 1.0 |

---

## 1. Declaración de Visión del Producto

> **Para** los estudiantes guatemaltecos de nivel medio, universitario y de posgrado que aspiran
> a una beca del Ministerio de Educación, y para el personal ministerial que administra esos
> programas,
>
> **quienes** hoy dependen de formularios dispersos, hojas de cálculo y cadenas de correo que
> provocan retrasos en la evaluación, duplicidad de información, pérdida de documentos y una
> nula trazabilidad del proceso,
>
> **BecaGT** *(nombre tentativo — confirmar en la reunión de arranque)*
>
> **es** una plataforma web centralizada para la gestión del ciclo de vida completo de las becas,
>
> **que** permite publicar convocatorias, recibir solicitudes con su documentación, evaluarlas
> mediante comités con criterios explícitos, resolverlas y consultar el estado de cualquier
> solicitud en línea, dejando registro auditable de cada paso.
>
> **A diferencia de** el proceso manual actual, donde un expediente puede perderse y nadie sabe
> en qué etapa está su solicitud,
>
> **nuestro producto** ofrece trazabilidad completa del expediente, transparencia para el
> aspirante mediante consulta pública del estado, y estadísticas en tiempo real para la toma de
> decisiones del Ministerio.

### El problema en una frase

*Hoy nadie —ni el estudiante, ni el evaluador, ni el Ministerio— puede responder con certeza en
qué estado está una solicitud de beca ni por qué se decidió lo que se decidió.*

---

## 2. Stakeholders Identificados

| Stakeholder | Interés en el sistema |
|---|---|
| **Ministerio de Educación** (cliente) | Reducir tiempos de asignación, eliminar duplicidad y disponer de estadísticas confiables para justificar el uso del presupuesto |
| **Dirección de Becas** | Administrar convocatorias, cupos y presupuesto asignado por programa |
| **Comités evaluadores** | Evaluar solicitudes con criterios uniformes y dejar constancia de sus dictámenes |
| **Estudiantes aspirantes** | Postular sin trasladarse, saber qué documentos faltan y conocer el estado de su solicitud |
| **Centros educativos** | Verificar el rendimiento académico de sus estudiantes postulantes |
| **Entes fiscalizadores** (Contraloría) | Auditar la trazabilidad y transparencia del proceso de adjudicación |
| **Ciudadanía** | Consultar públicamente los resultados de las convocatorias |

---

## 3. User Personas

### Persona 1 — "Ana, la aspirante de provincia"

| | |
|---|---|
| **Rol** | Estudiante de último año de diversificado en Quetzaltenango, aspirante a beca universitaria |
| **Datos demográficos** | 18 años, vive a 3 horas de la capital, su único dispositivo es un smartphone de gama media con datos móviles limitados |
| **Necesidades y metas** | Postular a una beca sin viajar a la capital · Saber exactamente qué documentos debe presentar antes de gastar en fotocopias y trámites · Enterarse de las convocatorias mientras siguen abiertas |
| **Frustraciones** | *"Me enteré de la convocatoria cuando ya había cerrado."* · *"Entregué mis papeles hace tres meses y nadie me dice nada."* · *"Fui hasta la capital y me dijeron que faltaba un documento que nadie me había mencionado."* |
| **Implicación de diseño** | La plataforma **debe funcionar bien en móvil y con conexión lenta**. La lista de requisitos debe verse *antes* de iniciar la solicitud, y el estado debe consultarse sin necesidad de iniciar sesión. |

### Persona 2 — "Licda. Marta, la evaluadora del comité"

| | |
|---|---|
| **Rol** | Integrante del comité evaluador de becas de posgrado; catedrática universitaria |
| **Datos demográficos** | 45 años, trabaja desde una laptop, dedica solo unas horas por semana a evaluar |
| **Necesidades y metas** | Ver solo las solicitudes que le fueron asignadas · Revisar los documentos de respaldo sin tener que descargarlos uno por uno · Aplicar la misma rúbrica a todos los casos y justificar su puntuación |
| **Frustraciones** | *"Me llegan 200 expedientes en Excel y no sé cuáles ya revisó otro compañero."* · *"Cada quien evalúa con criterios distintos y luego no podemos defender la decisión."* |
| **Implicación de diseño** | Justifica el **patrón Strategy** para los criterios de puntuación: la rúbrica debe ser explícita, uniforme por tipo de beca, y quedar registrada junto al dictamen. |

### Persona 3 — "Ing. Carlos, el administrador del Ministerio"

| | |
|---|---|
| **Rol** | Coordinador de la Dirección de Becas del MinEduc |
| **Datos demográficos** | 38 años, trabaja en oficina, rinde cuentas ante autoridades superiores y ante la Contraloría |
| **Necesidades y metas** | Publicar convocatorias con sus requisitos, cupos y fechas · Conformar comités y asignarles solicitudes · Generar reportes de solicitudes recibidas, aprobadas y becas adjudicadas por nivel y región |
| **Frustraciones** | *"Cuando me piden estadísticas tengo que consolidar a mano seis hojas de cálculo distintas."* · *"No puedo demostrar por qué se le dio la beca a un aspirante y no a otro."* |
| **Implicación de diseño** | Justifica el **módulo de reportes con patrón Builder** y el requisito de **trazabilidad auditable** de cada cambio de estado. |

### Persona 4 — "Don Julio, el padre de familia"

| | |
|---|---|
| **Rol** | Padre de un estudiante aspirante; no es usuario registrado del sistema |
| **Datos demográficos** | 52 años, manejo básico de tecnología, consulta desde el teléfono de su hijo |
| **Necesidades y metas** | Verificar que la solicitud de su hijo fue recibida y en qué etapa está |
| **Frustraciones** | *"No entiendo los sistemas del gobierno, siempre piden usuario y contraseña para todo."* |
| **Implicación de diseño** | Justifica la **consulta pública del estado de una beca sin autenticación**, usando únicamente el número de solicitud. Es un requisito de transparencia, no una comodidad. |

---

## 4. Alcance del MVP

### Dentro del alcance (primera versión)

- Administración de convocatorias (crear, publicar, cerrar; requisitos y cupos por tipo de beca)
- Registro de estudiantes y gestión de su perfil
- Creación, envío y seguimiento de solicitudes
- Carga y validación de documentación de respaldo
- Gestión de comités evaluadores y asignación de solicitudes
- Registro de evaluaciones con criterios de puntuación configurables
- Aprobación, rechazo y adjudicación de becas
- Consulta pública del estado de una solicitud
- Reportes básicos de gestión
- Autenticación y control de acceso por rol

### Fuera del alcance (documentado a propósito)

- Desembolso de fondos e integración con el sistema de tesorería del Estado
- Integración real con RENAP o con el sistema académico del MinEduc *(se simulará mediante el
  patrón Adapter, dejando la extensión preparada)*
- Aplicación móvil nativa *(la web será responsiva)*
- Firma electrónica avanzada de resoluciones
- Seguimiento del rendimiento académico del becario una vez adjudicada la beca

> El Product Owner puede mover cualquiera de estos elementos al alcance durante el semestre. La
> arquitectura está diseñada para absorberlo; cada cambio se registrará con su análisis de
> impacto.

---

*Este documento es vivo. Se revisa al final de cada Sprint Review y se versiona en el
repositorio junto con el código.*
