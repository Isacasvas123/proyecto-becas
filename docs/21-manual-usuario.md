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

### 2.2 Crear su cuenta

Si todavía no tiene cuenta, use **"Crear cuenta"** en la parte de arriba. Le pedirá:

| Dato                 | Qué escribir                                                              |
| -------------------- | ------------------------------------------------------------------------- |
| **Nombre completo**  | Tal como aparece en su documento de identificación                        |
| **CUI**              | Los 13 dígitos de su DPI o, si es menor de edad, de su certificado de nacimiento del RENAP. Puede escribirlos con espacios |
| **Correo**           | Uno que revise: por ahí le llegarán los avisos de su solicitud            |
| **Nombre de usuario**| El que usará para entrar. Letras, números, punto o guion                  |
| **Contraseña**       | Al menos 8 caracteres, con una mayúscula y un número                      |

Mientras escribe la contraseña, la lista de abajo le marca qué condiciones ya cumple. Al terminar,
**queda dentro de la plataforma** sin tener que volver a escribir sus datos.

| Si ve este mensaje                                   | Qué significa                                                     |
| ---------------------------------------------------- | ----------------------------------------------------------------- |
| *"Ya existe una cuenta con ese CUI"*                 | Usted ya se registró antes. Inicie sesión en vez de crear otra cuenta |
| *"Ya existe una cuenta con ese correo"*              | Ese correo ya se usó. Use otro, o inicie sesión si es suyo        |
| *"El CUI debe tener exactamente 13 dígitos"*         | Revise el número: le sobra o le falta alguno                      |
| *"La contraseña debe tener…"*                        | El mensaje dice exactamente qué le falta                          |

> 💡 **Una persona, una cuenta.** El CUI es único: no se pueden tener dos cuentas con el mismo.

### 2.3 Iniciar sesión

Verá la pantalla **"Ingrese a su cuenta"** con dos campos:

| Campo          | Qué escribir                                                    |
| -------------- | --------------------------------------------------------------- |
| **Usuario**    | El nombre de usuario con el que se registró en el programa       |
| **Contraseña** | Su contraseña                                                    |

Presione el botón para entrar.

> 💡 **Su contraseña está protegida.** No se guarda tal como usted la escribe: se guarda cifrada, y
> ni siquiera el personal del Ministerio puede verla. Por eso, si la olvida, nadie se la puede
> decir — habrá que restablecerla.

### 2.4 Si no puede entrar

| Lo que ve                                          | Qué significa y qué hacer                                                                 |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| *"Usuario o contraseña incorrectos"*               | Uno de los dos está mal. **El mensaje no dice cuál a propósito**, por seguridad: si dijera "ese usuario no existe", cualquiera podría averiguar qué usuarios hay. Revise los dos |
| *"El usuario es obligatorio"*                      | Dejó el campo vacío                                                                        |
| La página no carga                                 | Revise su conexión. Si persiste, avise al Ministerio                                        |

### 2.5 Si se equivoca cinco veces seguidas

**Tras 5 intentos fallidos seguidos, su cuenta se bloquea durante 15 minutos.** Es una protección
contra quien intente adivinar su contraseña probando muchas.

Lo que conviene saber:

- **Durante esos 15 minutos no podrá entrar ni siquiera con la contraseña correcta.** Verá el
  mismo mensaje de siempre, *"Usuario o contraseña incorrectos"*. No es que la haya olvidado: es
  el bloqueo.
- **Se desbloquea sola.** No tiene que llamar a nadie; espere 15 minutos y vuelva a intentar.
- **Si entra bien, el contador vuelve a cero.** Equivocarse de vez en cuando no la bloquea: solo
  cinco errores seguidos.

> 💡 **¿Por qué el mensaje no dice "cuenta bloqueada"?** Porque le diría a quien está intentando
> entrar sin permiso que ese usuario existe. Es preferible que un usuario legítimo espere unos
> minutos a regalarle esa información a un intruso.

> ⚠️ **Si se bloquea sin haber sido usted**, alguien intentó entrar a su cuenta. Cuando recupere el
> acceso, avise al Ministerio.

### 2.6 Su sesión dura 8 horas

Pasado ese tiempo se cierra sola y hay que volver a entrar. Es una medida de seguridad: si deja la
sesión abierta en una computadora compartida, no queda abierta indefinidamente.

> ⚠️ **Si usa una computadora prestada o de un café internet**, cierre sesión al terminar en lugar
> de solo cerrar la ventana.

## 3. Ver las convocatorias

**No necesita cuenta para ver las convocatorias.** Entre a la plataforma y llegará directamente al
listado, **"Convocatorias vigentes"**.

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
| Ver y editar sus datos personales            | 🔴 No disponible | Sprint 4      |
| Recuperar una contraseña olvidada            | 🔴 No disponible | Sprint 4      |
| Postular a una convocatoria                  | 🔴 No disponible | Sprint 4      |
| Subir documentos de respaldo                 | 🔴 No disponible | Sprint 4      |
| Consultar el estado de su solicitud          | 🔴 No disponible | Sprint 4      |
| Evaluar solicitudes (evaluadores)            | 🔴 No disponible | Sprint 5      |
| Consulta pública sin cuenta                  | 🔴 No disponible | Sprint 6      |
| Reportes y estadísticas                      | 🔴 No disponible | Sprint 7      |



### 5.1 Un defecto que ya está corregido

Hasta el 12 de septiembre de 2026 había que iniciar sesión para ver las convocatorias, y eso estaba
mal: consultarlas debe poder hacerlo cualquier persona, por transparencia. **Ya no hace falta
cuenta.**

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
