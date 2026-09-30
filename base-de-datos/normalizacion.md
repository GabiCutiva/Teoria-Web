# Normalización del modelo de datos — Sistema de seguimiento estudiantil

Este documento toma el diagrama entidad‑relación (MER) y el listado de entidades, atributos y relaciones, y los lleva paso a paso a **Primera (1FN), Segunda (2FN) y Tercera Forma Normal (3FN)**. Al final están todas las tablas del esquema en 3FN, explicadas una por una.

El script SQL que crea el esquema final está en [`esquema_3fn.sql`](esquema_3fn.sql) (PostgreSQL). Se probó en PostgreSQL 16 y crea las 28 tablas sin errores.

---

## Índice

1. [Conceptos: qué exige cada forma normal](#1-conceptos-qué-exige-cada-forma-normal)
2. [Observaciones sobre el diagrama original](#2-observaciones-sobre-el-diagrama-original)
3. [Paso 0: del MER a relaciones (esquema de partida)](#3-paso-0-del-mer-a-relaciones-esquema-de-partida)
4. [Primera Forma Normal (1FN)](#4-primera-forma-normal-1fn)
5. [Segunda Forma Normal (2FN)](#5-segunda-forma-normal-2fn)
6. [Tercera Forma Normal (3FN)](#6-tercera-forma-normal-3fn)
7. [Esquema final en 3FN: detalle de cada tabla](#7-esquema-final-en-3fn-detalle-de-cada-tabla)
8. [Cómo quedó implementada cada relación del MER](#8-cómo-quedó-implementada-cada-relación-del-mer)
9. [Reglas que no se pueden expresar solo con llaves](#9-reglas-que-no-se-pueden-expresar-solo-con-llaves)

---

## 1. Conceptos: qué exige cada forma normal

| Forma normal | Condición | Qué problema evita |
|---|---|---|
| **1FN** | Toda tabla tiene llave primaria; cada celda guarda **un solo valor atómico**; no hay grupos repetitivos ni atributos multivaluados. | No poder consultar ni filtrar por un valor que está "enterrado" en una lista (ej. `"Soporte técnico, Redes, Informes"`). |
| **2FN** | Está en 1FN y **ningún atributo no clave depende de solo una parte** de una llave primaria compuesta (no hay dependencias parciales). | Repetir un dato cada vez que se repite una parte de la llave. |
| **3FN** | Está en 2FN y **ningún atributo no clave depende de otro atributo no clave** (no hay dependencias transitivas `PK → A → B`). | Anomalías de actualización: cambiar un dato en un sitio y dejarlo desactualizado en otro. |

Notación usada: <u>subrayado</u> o **PK** = llave primaria, **FK** = llave foránea, **UQ** = único, `A → B` = "A determina funcionalmente a B".

---

## 2. Observaciones sobre el diagrama original

Antes de normalizar conviene corregir estas inconsistencias, porque afectan el esquema:

| # | Dónde | Observación | Qué se hizo |
|---|---|---|---|
| 1 | TUTORÍA | `id_tutotia` y "Llav primaria" en SOLICITUD son errores de digitación. En el diagrama aparece `puesto_adminsion`. | Se usa `id_tutoria` y `puesto_admision`. |
| 2 | TUTORÍA / asiste | El diagrama pone `observ_registrada` en TUTORÍA, y la relación *asiste* dice que guarda `observ_estudiante`. Son dos cosas distintas: la observación general de la sesión y la de cada estudiante. | Se conservan ambas: `observ_registrada` en `tutoria` y `observ_estudiante` en `asistencia_tutoria`. |
| 3 | tutora | La relación dice que guarda `fecha_inicio` y `fecha_fin`, pero esos atributos no aparecen en el diagrama. | Se agregan a la tabla de la relación `tutor_estudiante`. |
| 4 | PATOLOGÍA | Su llave es `descripcion`, pero es entidad débil: por sí sola no identifica una fila (dos estudiantes pueden tener "Asma"). | Se resuelve en 1FN y 2FN (ver abajo). |
| 5 | SOPORTE | Igual: `nombre_archivo` no es único entre solicitudes (dos solicitudes pueden adjuntar `cedula.pdf`). | Llave compuesta `(id_solicitud, nombre_archivo)`. |
| 6 | ESTUDIANTE | `edad` es un **atributo derivado** que cambia cada año. | Se reemplaza por `fecha_nacimiento`; la edad se calcula en la consulta. |
| 7 | USUARIO | `contraseña` nunca debe guardarse en texto plano. | La columna se llama `contrasena_hash` y guarda el hash (bcrypt/argon2). |
| 8 | participa | Como está (1:N), cada actividad pertenece a un solo estudiante. Si dos estudiantes van al mismo evento, la actividad se registra dos veces. | Se respeta el 1:N del modelo. Si se quiere compartir actividades, habría que convertirla en N:N (tabla `participacion`). |

---

## 3. Paso 0: del MER a relaciones (esquema de partida)

Reglas de transformación aplicadas:

- **Entidad fuerte** → tabla con su llave.
- **Relación 1:1** (`es`, `posee`, `reporta`) → la FK va en el lado opcional, con restricción `UNIQUE`.
- **Relación 1:N** → la FK va en el lado N. Si la participación mínima del lado 1 es 0, la FK admite `NULL`.
- **Relación N:N** (`tutora`, `asiste`) → tabla nueva cuya llave es la combinación de ambas llaves.
- **Entidad débil** (`PATOLOGÍA`, `SOPORTE`) → su llave incluye la llave de la entidad dueña.

Esquema de partida (antes de normalizar), tal cual sale del diagrama:

```
USUARIO(id_usuario, login, nombres, apellidos, correo, contraseña, rol, estado)
ESTUDIANTE(id_documento, id_usuario FK, edad, pbm, telefono, direccion, prom_actual, tipo_colegio,
           estrato, acceso, sexo_legal, genero, subacceso, anio_fin_colegio, avance_carrera,
           matriculas, ciudad, papa)
PROFESOR(id_profesor, id_usuario FK, departamento)
EMPRESA(id_empresa, nit, nombre, sector, ciudad)
PRACTICA(id_practica, id_documento FK, id_empresa FK, id_profesor FK, periodo, jefe_inmediato,
         actividades, observ_jefe, observ_asesor, estado)
PATOLOGIA(descripcion, id_documento FK, fecha_registro)
PERFIL_PSICOSOCIAL(id_perfil_psico, id_documento FK, resultado_oso, salud_mental, salud_fisica,
                   discapacidad, hobby_formal, fecha_registro)
PERFIL_ACADEMICO(id_perfil_acad, id_documento FK, colegio_procedencia, puntaje_saber11,
                 puntaje_admision, puesto_admision, ciudad_origen, depto_origen,
                 fecha_saber_pro, result_saber_pro)
TRABAJO_GRADO(id_trabajo, id_documento FK, id_director FK, id_codirector FK, modalidad,
              fecha_aprobacion, titulo, estado, periodo_cursado, posgrado, periodo_admision,
              creditos_cursados)
ALERTA(id_alerta, id_documento FK, id_usuario_revisa FK, tipo, descripcion, accion_tomada,
       estado, fecha_revision, fecha_generacion)
BITACORA(id_bitacora, id_usuario FK, accion, ip, tabla_afectada, registro_afectado, fecha_hora,
         enlace_repositorio)
TUTORIA(id_tutoria, id_usuario_registra FK, modalidad, fecha, observ_registrada)
SOLICITUD(id_solicitud, id_documento FK, id_usuario_resuelve FK, descripcion, fecha_solicitud,
          estado, observaciones, fecha_acta, ref_acta, respuesta, tipo)
ACTIVIDAD_INTERD(id_actividad, id_documento FK, id_profesor FK, categoria, tipo, nombre,
                 descripcion, entidad, ciudad, alcance, rol, fecha_inicio, fecha_fin)
SOPORTE(nombre_archivo, id_solicitud FK, fecha_carga, tipo_soporte, ruta)
TUTORA(id_profesor FK, id_documento FK, fecha_inicio, fecha_fin)
ASISTE(id_tutoria FK, id_documento FK, observ_estudiante)
```

---

## 4. Primera Forma Normal (1FN)

### 4.1 Revisión tabla por tabla

| Tabla | ¿Cumple 1FN? | Motivo |
|---|---|---|
| USUARIO | Sí | Valores atómicos; `nombres` y `apellidos` ya están separados. |
| ESTUDIANTE | Sí* | *Se asume un solo `telefono` y una sola `direccion` (texto completo). Si se necesitan varios teléfonos, se crearía `estudiante_telefono`. |
| PROFESOR | Sí | — |
| EMPRESA | Sí | — |
| **PRACTICA** | **No** | `actividades` es **multivaluado**: una práctica tiene una lista de actividades. |
| **PATOLOGIA** | **No** | `descripcion` sola no es llave válida: se repite entre estudiantes. |
| PERFIL_PSICOSOCIAL | Sí* | *Se asume que `discapacidad` y `hobby_formal` guardan un único valor o una descripción. Si se registran listas, se separan igual que `actividades`. |
| PERFIL_ACADEMICO | Sí | — |
| TRABAJO_GRADO | Sí | — |
| ALERTA | Sí | — |
| BITACORA | Sí | — |
| TUTORIA | Sí | — |
| SOLICITUD | Sí | — |
| ACTIVIDAD_INTERD | Sí | — |
| **SOPORTE** | **No** | `nombre_archivo` solo no identifica la fila. |
| TUTORA | Faltaba llave | Un estudiante puede volver a tener el mismo tutor en otro periodo, así que `(id_profesor, id_documento)` no basta. |
| ASISTE | Faltaba llave | Se define `(id_tutoria, id_documento)`. |

### 4.2 Cambios aplicados

**a) `actividades` de PRACTICA → tabla nueva `PRACTICA_ACTIVIDAD`**

Antes (viola 1FN):

| id_practica | periodo | actividades |
|---|---|---|
| 1 | 2025-2 | Soporte técnico, Desarrollo de reportes, Pruebas |

Después:

| id_practica | numero | descripcion |
|---|---|---|
| 1 | 1 | Soporte técnico |
| 1 | 2 | Desarrollo de reportes |
| 1 | 3 | Pruebas |

```
PRACTICA(id_practica, id_documento, id_empresa, id_profesor, periodo, jefe_inmediato,
         observ_jefe, observ_asesor, estado)
PRACTICA_ACTIVIDAD(id_practica FK, numero, descripcion)      PK = (id_practica, numero)
```

**b) PATOLOGIA: llave compuesta con la entidad dueña**

```
PATOLOGIA(id_documento FK, descripcion, fecha_registro)      PK = (id_documento, descripcion)
```

**c) SOPORTE: llave compuesta con la entidad dueña**

```
SOPORTE(id_solicitud FK, nombre_archivo, fecha_carga, tipo_soporte, ruta)
                                                            PK = (id_solicitud, nombre_archivo)
```

**d) Tablas de relaciones N:N con llave definida**

```
TUTORA(id_profesor FK, id_documento FK, fecha_inicio, fecha_fin)
                                                PK = (id_profesor, id_documento, fecha_inicio)
ASISTE(id_tutoria FK, id_documento FK, observ_estudiante)   PK = (id_tutoria, id_documento)
```

Con esto, **todas las tablas tienen llave primaria y valores atómicos → esquema en 1FN.**

---

## 5. Segunda Forma Normal (2FN)

La 2FN solo puede fallar en tablas con **llave primaria compuesta**. Las tablas con llave simple (`id_usuario`, `id_documento`, `id_practica`, etc.) cumplen 2FN automáticamente.

### 5.1 Tablas con llave compuesta

| Tabla | Llave | Dependencias de los atributos no clave | ¿2FN? |
|---|---|---|---|
| PRACTICA_ACTIVIDAD | (id_practica, numero) | `descripcion` depende de ambos: es la actividad *n* de esa práctica. | Sí |
| SOPORTE | (id_solicitud, nombre_archivo) | `fecha_carga`, `tipo_soporte` y `ruta` describen ese archivo de esa solicitud. | Sí |
| TUTORA | (id_profesor, id_documento, fecha_inicio) | `fecha_fin` depende de esa tutoría concreta. | Sí |
| ASISTE | (id_tutoria, id_documento) | `observ_estudiante` es la observación de ese estudiante en esa sesión. | Sí |
| **PATOLOGIA** | (id_documento, descripcion) | `fecha_registro` depende de ambos. Pero la **descripción de la patología es un dato de la patología, no del estudiante**. Cualquier atributo propio de ella (código CIE‑10, tipo, si es crónica…) dependería **solo de `descripcion`** → dependencia parcial. Además, "Asma", "asma" y "ASMA" quedarían como patologías distintas. | **No** |

### 5.2 Cambio aplicado: separar la patología de la relación *padece*

```
PATOLOGIA(id_patologia, descripcion UQ)                      ← catálogo, cada patología una vez
ESTUDIANTE_PATOLOGIA(id_documento FK, id_patologia FK, fecha_registro)
                                                PK = (id_documento, id_patologia)
```

Antes:

| id_documento | descripcion | fecha_registro |
|---|---|---|
| 1001 | Asma | 2025-02-10 |
| 1002 | asma | 2025-03-01 |

Después:

`PATOLOGIA`

| id_patologia | descripcion |
|---|---|
| 1 | Asma |

`ESTUDIANTE_PATOLOGIA`

| id_documento | id_patologia | fecha_registro |
|---|---|---|
| 1001 | 1 | 2025-02-10 |
| 1002 | 1 | 2025-03-01 |

La regla del modelo ("una patología solo existe asociada a un estudiante") se conserva: lo que describe *que un estudiante padece algo* está en `ESTUDIANTE_PATOLOGIA`, y se borra en cascada si se borra el estudiante.

**Resultado: esquema en 2FN.**

---

## 6. Tercera Forma Normal (3FN)

Se buscan **dependencias transitivas**: un atributo no clave que determina a otro atributo no clave.

### 6.1 Dependencias transitivas encontradas

| # | Tabla | Dependencia transitiva | Por qué es un problema | Solución |
|---|---|---|---|---|
| T1 | PERFIL_ACADEMICO | `id_perfil_acad → ciudad_origen → depto_origen` | El departamento lo determina la ciudad. Se podría guardar "Medellín – Cundinamarca". | Catálogos `DEPARTAMENTO` y `CIUDAD`; queda solo `id_ciudad_origen`. |
| T2 | ESTUDIANTE, EMPRESA, ACTIVIDAD_INTERD | `ciudad` en texto libre, con el mismo problema de T1 | Mismo dato escrito de muchas formas ("Bogotá", "Bogota D.C."). | Se reutiliza `CIUDAD` como FK (`id_ciudad`). |
| T3 | ESTUDIANTE | `id_documento → subacceso → acceso` | Cada subacceso pertenece a un único tipo de acceso (ej. *PAES – Comunidades indígenas* → *Admisión especial*). Guardar ambos permite combinaciones imposibles. | Catálogos `ACCESO` y `SUBACCESO`; en ESTUDIANTE queda solo `id_subacceso`. |
| T4 | PERFIL_ACADEMICO / ESTUDIANTE | `colegio_procedencia → tipo_colegio` | El tipo (oficial/privado) es una característica del colegio, no del estudiante. Si 200 estudiantes vienen del mismo colegio, el tipo se repite 200 veces. | Catálogo `COLEGIO(id_colegio, nombre, tipo_colegio, id_ciudad)`; PERFIL_ACADEMICO guarda `id_colegio` y se quita `tipo_colegio` de ESTUDIANTE. |
| T5 | SOLICITUD | `id_solicitud → ref_acta → fecha_acta` | Un acta tiene una sola fecha. Si varias solicitudes se resuelven en el Acta 05‑2025, su fecha se repite y puede quedar distinta en cada fila. | Tabla `ACTA(ref_acta, fecha_acta)`; SOLICITUD guarda solo `ref_acta` como FK. |
| T6 | ACTIVIDAD_INTERD | `id_actividad → tipo → categoria` | Cada tipo pertenece a una categoría (ej. *Semillero* → *Investigación*; *Selección deportiva* → *Deporte y cultura*). | Catálogos `CATEGORIA_ACTIVIDAD` y `TIPO_ACTIVIDAD`; queda `id_tipo_actividad`. |

Ejemplo de T5, antes:

| id_solicitud | ref_acta | fecha_acta |
|---|---|---|
| 10 | ACTA-05-2025 | 2025-04-12 |
| 11 | ACTA-05-2025 | 2025-04-21 ← inconsistente |

Después:

`ACTA`

| ref_acta | fecha_acta |
|---|---|
| ACTA-05-2025 | 2025-04-12 |

`SOLICITUD`

| id_solicitud | ref_acta |
|---|---|
| 10 | ACTA-05-2025 |
| 11 | ACTA-05-2025 |

### 6.2 Dependencias revisadas que **no** violan 3FN

| Tabla | Dependencia | Por qué está bien |
|---|---|---|
| USUARIO | `login → …`, `correo → …` | `login` y `correo` son **llaves candidatas** (únicas). La 3FN permite que una llave candidata determine a los demás atributos. Se declaran `UNIQUE`. |
| EMPRESA | `nit → nombre, sector, ciudad` | `nit` también es llave candidata → `UNIQUE`. |
| ESTUDIANTE | `papa`, `prom_actual`, `avance_carrera`, `matriculas` | En rigor se calculan a partir del historial de notas, pero ese historial **no está en el modelo**, así que se guardan como datos (vienen del sistema académico). |
| PRACTICA | `jefe_inmediato` | Solo se guarda su nombre. Si se agregaran teléfono o correo del jefe, habría que crear una tabla `JEFE`. |
| PROFESOR | `departamento` | Es un dato del profesor. Se puede convertir en catálogo para evitar errores de escritura, pero no es una dependencia transitiva. |

### 6.3 Ajustes de diseño adicionales (recomendados)

No los exige la 3FN, pero mejoran la calidad del esquema:

1. **Subtipo `TRABAJO_GRADO_POSGRADO`.** `posgrado`, `periodo_admision` y `creditos_cursados` solo tienen sentido en la modalidad *asignaturas de posgrado*; en las demás modalidades quedarían siempre en `NULL`. Se separan en una tabla 1:1 con `trabajo_grado`. La relación del modelo lo confirma: "el director es opcional porque la modalidad de posgrado no lo requiere".
2. **`edad` → `fecha_nacimiento`** (atributo derivado que se desactualiza).
3. **`contraseña` → `contrasena_hash`.**
4. **Restricciones `CHECK`**: estrato 1–6, notas 0–5, `rol` y `estado` de USUARIO con los valores del documento, `fecha_fin ≥ fecha_inicio`, director ≠ codirector.

**Resultado: esquema en 3FN — 28 tablas (9 catálogos + 19 tablas principales).**

---

## 7. Esquema final en 3FN: detalle de cada tabla

### Vista general

```
                        DEPARTAMENTO ─< CIUDAD >─┬─ COLEGIO
                                                 │
 ACCESO ─< SUBACCESO                             │
              │                                  │
USUARIO ──1:1── ESTUDIANTE ───────────────────────┘ (ciudad de residencia)
   │    └─1:1── PROFESOR
   │               │
   │  ESTUDIANTE ─< TUTOR_ESTUDIANTE >─ PROFESOR
   │  ESTUDIANTE ── PERFIL_ACADEMICO (1:1) ─> COLEGIO, CIUDAD
   │  ESTUDIANTE ── PERFIL_PSICOSOCIAL (1:1)
   │  ESTUDIANTE ─< ESTUDIANTE_PATOLOGIA >─ PATOLOGIA
   │  ESTUDIANTE ─< PRACTICA >─ EMPRESA / PROFESOR ;  PRACTICA ─< PRACTICA_ACTIVIDAD
   │  ESTUDIANTE ─< TRABAJO_GRADO >─ PROFESOR (director, codirector) ; ── TRABAJO_GRADO_POSGRADO
   │  ESTUDIANTE ─< ACTIVIDAD_INTERD >─ PROFESOR, TIPO_ACTIVIDAD >─ CATEGORIA_ACTIVIDAD
   │  ESTUDIANTE ─< SOLICITUD >─ ACTA ;  SOLICITUD ─< SOPORTE
   │  ESTUDIANTE ─< ASISTENCIA_TUTORIA >─ TUTORIA
   │  ESTUDIANTE ─< ALERTA
   ├─< SOLICITUD (resuelve)   ├─< TUTORIA (registra)
   ├─< ALERTA (revisa)        └─< BITACORA (deja)
```

`─<` = "uno a muchos". Tipos de dato para PostgreSQL.

---

### 7.1 Catálogos (surgen de la normalización)

#### DEPARTAMENTO
Departamentos geográficos de Colombia. Evita guardar el departamento repetido junto a cada ciudad (T1).

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| id_departamento | INTEGER | **PK**, autoincremental | Identificador. |
| nombre | VARCHAR(60) | NOT NULL, UQ | Ej. "Antioquia". |

#### CIUDAD
Municipios. La usan ESTUDIANTE, PERFIL_ACADEMICO, EMPRESA, ACTIVIDAD_INTERD y COLEGIO (T1, T2).

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| id_ciudad | INTEGER | **PK** | Identificador. |
| nombre | VARCHAR(80) | NOT NULL | Ej. "Medellín". |
| id_departamento | INTEGER | NOT NULL, **FK → departamento** | Departamento al que pertenece. |
| | | UQ (nombre, id_departamento) | No se repite la misma ciudad en el mismo departamento. |

#### COLEGIO
Colegios de procedencia; guarda el tipo de colegio una sola vez (T4).

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| id_colegio | INTEGER | **PK** | Identificador. |
| nombre | VARCHAR(150) | NOT NULL | Nombre del colegio. |
| tipo_colegio | VARCHAR(20) | NOT NULL | Oficial / privado (antes estaba en ESTUDIANTE). |
| id_ciudad | INTEGER | **FK → ciudad**, NULL | Ciudad del colegio. |

#### ACCESO
Tipo de admisión (regular, admisión especial, …) (T3).

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| id_acceso | INTEGER | **PK** | Identificador. |
| nombre | VARCHAR(80) | NOT NULL, UQ | Ej. "Admisión especial". |

#### SUBACCESO
Programa específico de admisión, que pertenece a un único acceso (T3).

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| id_subacceso | INTEGER | **PK** | Identificador. |
| id_acceso | INTEGER | NOT NULL, **FK → acceso** | Acceso al que pertenece. |
| nombre | VARCHAR(80) | NOT NULL; UQ (id_acceso, nombre) | Ej. "PAES – Población afrocolombiana". Para admisión regular se crea un subacceso "Regular". |

#### PATOLOGIA
Catálogo de patologías (2FN).

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| id_patologia | INTEGER | **PK** | Identificador. |
| descripcion | VARCHAR(150) | NOT NULL, UQ | Nombre de la patología. |

#### ACTA
Actas del comité donde se resuelven solicitudes (T5).

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| ref_acta | VARCHAR(30) | **PK** | Número o referencia del acta. |
| fecha_acta | DATE | NOT NULL | Fecha de la sesión (antes en SOLICITUD). |

#### CATEGORIA_ACTIVIDAD
Categorías de actividades interdisciplinarias (T6): pasantía, investigación, deporte y cultura, eventos, publicaciones, vinculaciones.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| id_categoria | INTEGER | **PK** | Identificador. |
| nombre | VARCHAR(60) | NOT NULL, UQ | Nombre de la categoría. |

#### TIPO_ACTIVIDAD
Tipos concretos dentro de cada categoría (T6).

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| id_tipo_actividad | INTEGER | **PK** | Identificador. |
| id_categoria | INTEGER | NOT NULL, **FK → categoria_actividad** | Categoría a la que pertenece. |
| nombre | VARCHAR(80) | NOT NULL; UQ (id_categoria, nombre) | Ej. "Semillero de investigación". |

---

### 7.2 Usuarios y roles

#### USUARIO
Toda persona que entra al sistema (estudiante, profesor o Dirección).

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| id_usuario | INTEGER | **PK** | Identificador. |
| login | VARCHAR(50) | NOT NULL, UQ | Nombre de usuario (llave candidata). |
| nombres | VARCHAR(80) | NOT NULL | Nombres. |
| apellidos | VARCHAR(80) | NOT NULL | Apellidos. |
| correo | VARCHAR(120) | NOT NULL, UQ | Correo institucional (llave candidata). |
| contrasena_hash | VARCHAR(255) | NOT NULL | Hash de la contraseña. |
| rol | VARCHAR(20) | NOT NULL, CHECK ∈ {estudiante, profesor, direccion} | Rol en el sistema. |
| estado | VARCHAR(10) | NOT NULL, CHECK ∈ {activo, inactivo}, por defecto `activo` | Estado de la cuenta. |

#### ESTUDIANTE
Datos personales y académicos del estudiante. El nombre y el correo **no** se repiten aquí: se obtienen de USUARIO.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| id_documento | VARCHAR(20) | **PK** | Documento de identidad. |
| id_usuario | INTEGER | NOT NULL, UQ, **FK → usuario** | Relación *es* (1:1). |
| fecha_nacimiento | DATE | | Reemplaza a `edad`. |
| pbm | SMALLINT | CHECK 0–100 | Puntaje Básico de Matrícula. |
| telefono | VARCHAR(20) | | Teléfono de contacto. |
| direccion | VARCHAR(150) | | Dirección de residencia. |
| id_ciudad | INTEGER | **FK → ciudad** | Ciudad de residencia (antes `ciudad`). |
| estrato | SMALLINT | CHECK 1–6 | Estrato socioeconómico. |
| id_subacceso | INTEGER | NOT NULL, **FK → subacceso** | Reemplaza a `acceso` y `subacceso`. |
| sexo_legal | VARCHAR(20) | | Sexo según el documento. |
| genero | VARCHAR(30) | | Identidad de género. |
| anio_fin_colegio | SMALLINT | | Año de graduación del colegio. |
| prom_actual | NUMERIC(3,2) | CHECK 0–5 | Promedio del periodo actual. |
| papa | NUMERIC(3,2) | CHECK 0–5 | Promedio académico ponderado acumulado. |
| avance_carrera | NUMERIC(5,2) | CHECK 0–100 | Porcentaje de avance. |
| matriculas | SMALLINT | CHECK ≥ 0 | Número de matrículas. |

Atributos eliminados: `edad` (derivado), `tipo_colegio` (→ COLEGIO), `acceso` (→ SUBACCESO/ACCESO), `ciudad` (→ `id_ciudad`).

#### PROFESOR

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| id_profesor | INTEGER | **PK** | Identificador. |
| id_usuario | INTEGER | NOT NULL, UQ, **FK → usuario** | Relación *es* (1:1). |
| departamento | VARCHAR(100) | NOT NULL | Departamento académico (no confundir con el geográfico). |

#### TUTOR_ESTUDIANTE
Relación N:N *tutora*. Guarda el historial de tutores de cada estudiante.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| id_profesor | INTEGER | **PK**, **FK → profesor** | Tutor. |
| id_documento | VARCHAR(20) | **PK**, **FK → estudiante** | Estudiante tutorado. |
| fecha_inicio | DATE | **PK** | Inicio de la asignación. |
| fecha_fin | DATE | NULL, CHECK ≥ fecha_inicio | `NULL` = tutor actual. |

Índice único parcial `ux_tutor_actual`: un estudiante solo puede tener **un** registro con `fecha_fin IS NULL`, es decir, un único tutor actual.

---

### 7.3 Perfiles del estudiante

#### PERFIL_ACADEMICO
Relación *posee* (1:1 opcional).

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| id_perfil_acad | INTEGER | **PK** | Identificador. |
| id_documento | VARCHAR(20) | NOT NULL, UQ, **FK → estudiante** | UQ garantiza el 1:1. |
| id_colegio | INTEGER | **FK → colegio** | Reemplaza a `colegio_procedencia`. |
| puntaje_saber11 | SMALLINT | CHECK 0–500 | Puntaje Saber 11. |
| puntaje_admision | NUMERIC(6,2) | | Puntaje del examen de admisión. |
| puesto_admision | INTEGER | CHECK > 0 | Puesto obtenido. |
| id_ciudad_origen | INTEGER | **FK → ciudad** | Reemplaza a `ciudad_origen` y `depto_origen`. |
| fecha_saber_pro | DATE | | Fecha de la prueba Saber Pro. |
| result_saber_pro | SMALLINT | | Resultado Saber Pro. |

#### PERFIL_PSICOSOCIAL
Relación *reporta* (1:1 opcional).

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| id_perfil_psico | INTEGER | **PK** | Identificador. |
| id_documento | VARCHAR(20) | NOT NULL, UQ, **FK → estudiante** | UQ garantiza el 1:1. |
| resultado_oso | VARCHAR(100) | | Resultado del instrumento de tamizaje. |
| salud_mental | TEXT | | Observaciones de salud mental. |
| salud_fisica | TEXT | | Observaciones de salud física. |
| discapacidad | VARCHAR(150) | | Discapacidad reportada. |
| hobby_formal | VARCHAR(150) | | Actividad o hobby formal. |
| fecha_registro | DATE | NOT NULL, por defecto hoy | Fecha en que se diligenció. |

#### ESTUDIANTE_PATOLOGIA
Relación *padece*.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| id_documento | VARCHAR(20) | **PK**, **FK → estudiante** (ON DELETE CASCADE) | Estudiante. |
| id_patologia | INTEGER | **PK**, **FK → patologia** | Patología. |
| fecha_registro | DATE | NOT NULL, por defecto hoy | Fecha en que se registró. |

---

### 7.4 Prácticas

#### EMPRESA

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| id_empresa | INTEGER | **PK** | Identificador. |
| nit | VARCHAR(20) | NOT NULL, UQ | NIT (llave candidata). |
| nombre | VARCHAR(150) | NOT NULL | Razón social. |
| sector | VARCHAR(80) | | Sector económico. |
| id_ciudad | INTEGER | **FK → ciudad** | Reemplaza a `ciudad`. |

#### PRACTICA
Relaciones *realiza* (estudiante), *recibe* (empresa) y *asesora* (profesor).

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| id_practica | INTEGER | **PK** | Identificador. |
| id_documento | VARCHAR(20) | NOT NULL, **FK → estudiante** | Quien realiza la práctica. |
| id_empresa | INTEGER | NOT NULL, **FK → empresa** | Empresa receptora. |
| id_profesor | INTEGER | NOT NULL, **FK → profesor** | Profesor asesor (obligatorio). |
| periodo | VARCHAR(10) | NOT NULL | Ej. "2025-2". |
| jefe_inmediato | VARCHAR(120) | | Nombre del jefe en la empresa. |
| observ_jefe | TEXT | | Observaciones del jefe. |
| observ_asesor | TEXT | | Observaciones del asesor. |
| estado | VARCHAR(20) | NOT NULL | Estado de la práctica. |

#### PRACTICA_ACTIVIDAD
Atributo multivaluado `actividades` (1FN).

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| id_practica | INTEGER | **PK**, **FK → practica** (ON DELETE CASCADE) | Práctica. |
| numero | SMALLINT | **PK** | Consecutivo de la actividad dentro de la práctica. |
| descripcion | VARCHAR(300) | NOT NULL | Actividad realizada. |

---

### 7.5 Trabajo de grado

#### TRABAJO_GRADO
Relaciones *desarrolla*, *dirige* y *codirige*.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| id_trabajo | INTEGER | **PK** | Identificador. |
| id_documento | VARCHAR(20) | NOT NULL, **FK → estudiante** | Autor. |
| id_director | INTEGER | **FK → profesor**, NULL | Director (opcional). |
| id_codirector | INTEGER | **FK → profesor**, NULL; CHECK ≠ id_director | Codirector (opcional). |
| modalidad | VARCHAR(40) | NOT NULL | Trabajo de grado, pasantía, posgrado, etc. |
| titulo | VARCHAR(300) | | Título. |
| estado | VARCHAR(20) | NOT NULL | Estado (inscrito, aprobado, cancelado…). |
| fecha_aprobacion | DATE | | Fecha de aprobación. |
| periodo_cursado | VARCHAR(10) | | Periodo en que se cursó. |

#### TRABAJO_GRADO_POSGRADO
Subtipo 1:1 con los datos que solo aplican a la modalidad de posgrado.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| id_trabajo | INTEGER | **PK**, **FK → trabajo_grado** (ON DELETE CASCADE) | Mismo id del trabajo de grado. |
| programa_posgrado | VARCHAR(150) | NOT NULL | Antes `posgrado`. |
| periodo_admision | VARCHAR(10) | NOT NULL | Periodo de admisión al posgrado. |
| creditos_cursados | SMALLINT | CHECK ≥ 0 | Créditos cursados. |

---

### 7.6 Actividades interdisciplinarias

#### ACTIVIDAD_INTERD
Relaciones *participa* (estudiante) y *acompaña* (profesor).

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| id_actividad | INTEGER | **PK** | Identificador. |
| id_documento | VARCHAR(20) | NOT NULL, **FK → estudiante** | Estudiante que participa. |
| id_profesor | INTEGER | **FK → profesor**, NULL | Docente acompañante (opcional). |
| id_tipo_actividad | INTEGER | NOT NULL, **FK → tipo_actividad** | Reemplaza a `tipo` y `categoria`. |
| nombre | VARCHAR(200) | NOT NULL | Nombre de la actividad. |
| descripcion | TEXT | | Descripción. |
| entidad | VARCHAR(150) | | Entidad organizadora. |
| id_ciudad | INTEGER | **FK → ciudad** | Reemplaza a `ciudad`. |
| alcance | VARCHAR(30) | | Local, nacional, internacional. |
| rol | VARCHAR(60) | | Rol del estudiante (ponente, asistente…). |
| fecha_inicio | DATE | | Inicio. |
| fecha_fin | DATE | CHECK ≥ fecha_inicio | Fin. |

---

### 7.7 Solicitudes y soportes

#### SOLICITUD
Relaciones *radica* (estudiante) y *resuelve* (usuario de Dirección).

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| id_solicitud | INTEGER | **PK** | Identificador. |
| id_documento | VARCHAR(20) | NOT NULL, **FK → estudiante** | Quien radica. |
| id_usuario_resuelve | INTEGER | **FK → usuario**, NULL | Quien responde; `NULL` = pendiente. |
| ref_acta | VARCHAR(30) | **FK → acta**, NULL | Acta en que se resolvió. `fecha_acta` se obtiene de ACTA. |
| tipo | VARCHAR(60) | NOT NULL | Tipo de solicitud. |
| descripcion | TEXT | NOT NULL | Qué se solicita. |
| fecha_solicitud | DATE | NOT NULL, por defecto hoy | Fecha de radicación. |
| estado | VARCHAR(20) | NOT NULL | Estado. |
| observaciones | TEXT | | Observaciones. |
| respuesta | TEXT | | Respuesta de la Dirección. |

#### SOPORTE
Entidad débil de SOLICITUD (relación *adjunta*).

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| id_solicitud | INTEGER | **PK**, **FK → solicitud** (ON DELETE CASCADE) | Solicitud dueña. |
| nombre_archivo | VARCHAR(200) | **PK** | Nombre del archivo. |
| tipo_soporte | VARCHAR(40) | | Tipo de documento. |
| ruta | VARCHAR(500) | NOT NULL | Ubicación del archivo en el servidor. |
| fecha_carga | TIMESTAMP | NOT NULL, por defecto ahora | Fecha y hora de carga. |

---

### 7.8 Tutorías

#### TUTORIA
Relación *registra* (usuario).

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| id_tutoria | INTEGER | **PK** | Identificador. |
| id_usuario_registra | INTEGER | NOT NULL, **FK → usuario** | Profesor o Dirección que la registra. |
| fecha | DATE | NOT NULL | Fecha de la sesión. |
| modalidad | VARCHAR(20) | NOT NULL | Presencial / virtual. |
| observ_registrada | TEXT | | Observación general de la sesión. |

#### ASISTENCIA_TUTORIA
Relación N:N *asiste*. Permite tutorías grupales.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| id_tutoria | INTEGER | **PK**, **FK → tutoria** (ON DELETE CASCADE) | Sesión. |
| id_documento | VARCHAR(20) | **PK**, **FK → estudiante** | Estudiante que asistió. |
| observ_estudiante | TEXT | | Observación sobre ese estudiante en esa sesión. |

---

### 7.9 Alertas y bitácora

#### ALERTA
Relaciones *genera* (estudiante) y *revisa* (usuario).

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| id_alerta | INTEGER | **PK** | Identificador. |
| id_documento | VARCHAR(20) | NOT NULL, **FK → estudiante** | Estudiante asociado. |
| id_usuario_revisa | INTEGER | **FK → usuario**, NULL | Quien la revisó; `NULL` = pendiente. |
| tipo | VARCHAR(40) | NOT NULL | Tipo de alerta (académica, psicosocial…). |
| descripcion | TEXT | | Detalle. |
| estado | VARCHAR(20) | NOT NULL, por defecto `pendiente` | Estado. |
| accion_tomada | TEXT | | Acción realizada. |
| fecha_generacion | TIMESTAMP | NOT NULL, por defecto ahora | Cuándo se generó. |
| fecha_revision | TIMESTAMP | CHECK ≥ fecha_generacion | Cuándo se revisó. |

#### BITACORA
Relación *deja* (usuario). Auditoría de acciones.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| id_bitacora | BIGINT | **PK** | Identificador (BIGINT porque crece rápido). |
| id_usuario | INTEGER | NOT NULL, **FK → usuario** | Quien hizo la acción. |
| accion | VARCHAR(20) | NOT NULL | INSERT, UPDATE, DELETE, LOGIN… |
| tabla_afectada | VARCHAR(60) | NOT NULL | Tabla modificada. |
| registro_afectado | VARCHAR(60) | | Llave del registro modificado. |
| ip | INET | | Dirección IP (IPv4 o IPv6). |
| fecha_hora | TIMESTAMP | NOT NULL, por defecto ahora | Momento de la acción. |
| enlace_repositorio | VARCHAR(500) | | Enlace al documento o evidencia. |

---

## 8. Cómo quedó implementada cada relación del MER

| Relación | Cardinalidad | Implementación en 3FN |
|---|---|---|
| es (USUARIO–ESTUDIANTE) | 1:1 | `estudiante.id_usuario` NOT NULL + UNIQUE |
| es (USUARIO–PROFESOR) | 1:1 | `profesor.id_usuario` NOT NULL + UNIQUE |
| tutora | N:N | tabla `tutor_estudiante` |
| posee | 1:1 | `perfil_academico.id_documento` NOT NULL + UNIQUE |
| reporta | 1:1 | `perfil_psicosocial.id_documento` NOT NULL + UNIQUE |
| padece | 1:N | tabla `estudiante_patologia` + catálogo `patologia` |
| desarrolla | 1:N | `trabajo_grado.id_documento` NOT NULL |
| dirige | 1:N (0,1) | `trabajo_grado.id_director` NULL |
| codirige | 1:N (0,1) | `trabajo_grado.id_codirector` NULL |
| realiza | 1:N | `practica.id_documento` NOT NULL |
| recibe | 1:N | `practica.id_empresa` NOT NULL |
| asesora | 1:N | `practica.id_profesor` NOT NULL |
| radica | 1:N | `solicitud.id_documento` NOT NULL |
| resuelve | 1:N (0,1) | `solicitud.id_usuario_resuelve` NULL |
| adjunta | 1:N identificadora | `soporte` con PK (id_solicitud, nombre_archivo) |
| participa | 1:N | `actividad_interd.id_documento` NOT NULL |
| acompaña | 1:N (0,1) | `actividad_interd.id_profesor` NULL |
| registra | 1:N | `tutoria.id_usuario_registra` NOT NULL |
| asiste | N:N | tabla `asistencia_tutoria` |
| genera | 1:N | `alerta.id_documento` NOT NULL |
| revisa | 1:N (0,1) | `alerta.id_usuario_revisa` NULL |
| deja | 1:N | `bitacora.id_usuario` NOT NULL |

---

## 9. Reglas que no se pueden expresar solo con llaves

Estas reglas del modelo requieren un *trigger* o validación en la aplicación:

1. **Coherencia de rol:** un `usuario` referenciado desde `estudiante` debe tener `rol = 'estudiante'`, y desde `profesor`, `rol = 'profesor'`. *Resuelve* y *revisa* deben hacerlos usuarios con rol `direccion` (o el tutor, en el caso de alertas).
2. **Tutoría con al menos un estudiante** (participación (1,n) de *asiste*): no se puede garantizar con una FK. Se valida al cerrar la transacción de registro de la tutoría.
3. **Director obligatorio según modalidad:** si la modalidad no es de posgrado, `id_director` no debería quedar `NULL`.
4. **Subtipo de posgrado:** solo los trabajos con modalidad de posgrado deben tener fila en `trabajo_grado_posgrado`.
