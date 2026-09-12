# Manual de Usuario

### Plataforma Nacional para la Gestión Integral de Becas

|                        |                                              |
| ---------------------- | -------------------------------------------- |
| **Versión del sistema** | 0.1.0                                       |
| **Versión del manual** | 1.0                                          |
| **Fecha**              | 12 de septiembre de 2026                     |
| **Responsable**        | Stuard Estrada                               |
| **Dirigido a**         | Estudiantes, evaluadores y personal del Ministerio |

> ### Lea esto antes de seguir
>
> **La plataforma está en construcción.** Este manual describe **únicamente lo que ya funciona** al
> 12 de septiembre de 2026. La sección 5 lista lo que todavía no existe, con la fecha prevista.
>
> Se escribe así a propósito: un manual que describa pantallas que no existen hace perder el
> tiempo a quien lo lee y no sirve para nada.

---

## 1. Qué es esta plataforma

Es el sistema del **Ministerio de Educación de Guatemala** para administrar las becas nacionales,
de principio a fin: desde que se publica una convocatoria hasta que se adjudica la beca.

Reemplaza el proceso actual de formularios, hojas de cálculo y correos, que provoca retrasos,
documentos extraviados y falta de transparencia.

**Quiénes la usan:**

| Usted es...                     | Y la plataforma le sirve para...                             |
| ------------------------------- | ------------------------------------------------------------ |
| **Estudiante aspirante**        | Ver convocatorias, postular y seguir su solicitud            |
| **Evaluador**                   | Revisar y calificar las solicitudes que le asignen           |
| **Administrador** del Ministerio | Crear convocatorias, formar comités y resolver solicitudes  |
| **Visitante** sin cuenta        | Consultar convocatorias abiertas y el estado de una solicitud |

## 2. Cómo entrar

### 2.1 Abrir la plataforma

Escriba la dirección de la plataforma en su navegador. Funciona en **Chrome, Firefox y Edge**
actualizados, en computadora y en teléfono.

### 2.2 Iniciar sesión

Verá la pantalla **"Ingrese a su cuenta"** con dos campos:

| Campo          | Qué escribir                                                    |
| -------------- | --------------------------------------------------------------- |
| **Usuario**    | El nombre de usuario con el que se registró en el programa       |
| **Contraseña** | Su contraseña                                                    |

Presione el botón para entrar.

> 💡 **Su contraseña está protegida.** No se guarda tal como usted la escribe: se guarda cifrada, y
> ni siquiera el personal del Ministerio puede verla. Por eso, si la olvida, nadie se la puede
> decir — habrá que restablecerla.

### 2.3 Si no puede entrar

| Lo que ve                                          | Qué significa y qué hacer                                                                 |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| *"Correo o contraseña incorrectos"*                | Uno de los dos está mal. **El mensaje no dice cuál a propósito**, por seguridad: si dijera "ese usuario no existe", cualquiera podría averiguar qué usuarios hay. Revise los dos |
| *"El usuario es obligatorio"*                      | Dejó el campo vacío                                                                        |
| La página no carga                                 | Revise su conexión. Si persiste, avise al Ministerio                                        |

### 2.4 Su sesión dura 8 horas

Pasado ese tiempo se cierra sola y hay que volver a entrar. Es una medida de seguridad: si deja la
sesión abierta en una computadora compartida, no queda abierta indefinidamente.

> ⚠️ **Si usa una computadora prestada o de un café internet**, cierre sesión al terminar en lugar
> de solo cerrar la ventana.

## 3. Ver las convocatorias

Al entrar llega a **"Convocatorias abiertas"**, la pantalla principal.

### 3.1 Qué muestra

Arriba, un resumen con:

- **Convocatorias vigentes** — cuántas están abiertas ahora
- **Cupos disponibles** — cuántas becas se van a otorgar en total
- **Tipos de beca** — cuántas modalidades hay abiertas
- **Para el próximo cierre** — cuántos días quedan para la que vence primero

Debajo, una tarjeta por convocatoria con su título, descripción, tipo de beca, cupos y fechas.

> 💡 **Las convocatorias que cierran antes aparecen primero.** No es casualidad: el orden está
> pensado para que no se le pase la que está por vencer.

### 3.2 Filtrar por tipo de beca

El panel de filtros le permite ver solo el tipo que le interesa:

| Filtro             | Para quién                                          |
| ------------------ | --------------------------------------------------- |
| **Todas**          | Ver todo lo abierto                                 |
| **Nivel medio**    | Estudiantes de básicos y diversificado              |
| **Universitaria**  | Estudiantes de carrera universitaria                |
| **Posgrado**       | Maestrías y doctorados                              |

### 3.3 Qué significa cada dato de una convocatoria

| Dato               | Qué es                                                                 |
| ------------------ | ---------------------------------------------------------------------- |
| **Código**         | El identificador oficial. **Anótelo**: es lo que le van a pedir si consulta por su solicitud |
| **Tipo de beca**   | Nivel medio, universitaria o posgrado                                  |
| **Cupos**          | Cuántas becas se otorgarán en esa convocatoria                         |
| **Fecha de apertura** | Desde cuándo se puede postular                                      |
| **Fecha de cierre**| **Hasta cuándo.** Después de esa fecha ya no se reciben solicitudes    |

> ⚠️ **La fecha de cierre no se prorroga.** Si una convocatoria cierra el 31 de octubre, el 1 de
> noviembre ya no aparece y no se puede postular. No deje la postulación para el último día.

## 4. Cerrar sesión

Use la opción de cerrar sesión del encabezado. Hágalo siempre que use una computadora que no sea
suya.

## 5. Lo que todavía no está disponible

Esta es la parte honesta del manual. Lo siguiente **aún no funciona**, con la fecha prevista:

| Funcionalidad                                | Estado           | Previsto para |
| -------------------------------------------- | ---------------- | ------------- |
| Crear una cuenta usted mismo (registro)      | 🔴 No disponible | Sprint 3      |
| Ver y editar sus datos personales            | 🔴 No disponible | Sprint 4      |
| Recuperar una contraseña olvidada            | 🔴 No disponible | Sprint 4      |
| Postular a una convocatoria                  | 🔴 No disponible | Sprint 4      |
| Subir documentos de respaldo                 | 🔴 No disponible | Sprint 4      |
| Consultar el estado de su solicitud          | 🔴 No disponible | Sprint 4      |
| Evaluar solicitudes (evaluadores)            | 🔴 No disponible | Sprint 5      |
| Crear y publicar convocatorias (administradores) | 🔴 No disponible | Sprint 3  |
| Consulta pública sin cuenta                  | 🔴 No disponible | Sprint 6      |
| Reportes y estadísticas                      | 🔴 No disponible | Sprint 7      |

**Mientras tanto**, si necesita una cuenta, la crea el personal del Ministerio.

### 5.1 Un defecto conocido que le afecta

**Hoy hay que iniciar sesión para ver las convocatorias**, y eso **está mal**: la consulta de
convocatorias abiertas debería poder hacerla cualquier persona sin cuenta, por transparencia.

El sistema por dentro ya permite consultarlas sin sesión; lo que falta es separar la pantalla
pública del panel de quien ya entró. **Está previsto para el Sprint 3.**

Se documenta en lugar de disimularlo porque afecta directamente a quien quiere informarse antes de
decidir si postula.

## 6. Preguntas frecuentes

**¿Puedo postular a más de una convocatoria?**
Cuando la postulación esté disponible, sí, siempre que cumpla los requisitos de cada una.

**Olvidé mi contraseña.**
Por ahora no hay recuperación automática (Sprint 4). Comuníquese con el Ministerio.

**¿Mis documentos están seguros?**
Su contraseña se guarda cifrada y cada persona solo puede ver lo que le corresponde: un estudiante
ve sus propias solicitudes y un evaluador solo las que le asignaron. Eso lo controla el servidor,
no la pantalla, así que no se puede rodear.

**¿Funciona en el teléfono?**
Sí. La plataforma se adapta a la pantalla.

**Veo "Entorno de desarrollo" en la pantalla.**
Está usando una versión de prueba, no la oficial. Los datos que vea ahí no son reales.

**¿Por qué se cerró mi sesión sola?**
Las sesiones duran 8 horas por seguridad. Vuelva a entrar.

## 7. A quién acudir

| Si...                                          | Acuda a                                             |
| ---------------------------------------------- | --------------------------------------------------- |
| No puede entrar o necesita una cuenta          | Dirección de Becas del Ministerio de Educación      |
| Cree que hay un error en la plataforma         | Repórtelo al Ministerio con el código de la convocatoria y lo que hizo antes del error |
| Tiene dudas sobre los requisitos de una beca   | Las bases de la convocatoria correspondiente        |

> Al reportar un problema, indique **qué hizo, qué esperaba y qué pasó en su lugar**. Con eso se
> corrige mucho más rápido que con "no me funciona".
