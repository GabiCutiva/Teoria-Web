-- =====================================================================
-- Esquema relacional en Tercera Forma Normal (3FN)
-- Sistema de seguimiento estudiantil
-- Motor: PostgreSQL 13 o superior
-- Ver la explicación completa en base-de-datos/normalizacion.md
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Catálogos creados durante la normalización
-- ---------------------------------------------------------------------

CREATE TABLE departamento (
    id_departamento  INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre           VARCHAR(60)  NOT NULL UNIQUE
);

CREATE TABLE ciudad (
    id_ciudad        INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre           VARCHAR(80)  NOT NULL,
    id_departamento  INTEGER      NOT NULL REFERENCES departamento (id_departamento),
    UNIQUE (nombre, id_departamento)
);

CREATE TABLE colegio (
    id_colegio       INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre           VARCHAR(150) NOT NULL,
    tipo_colegio     VARCHAR(20)  NOT NULL,
    id_ciudad        INTEGER      REFERENCES ciudad (id_ciudad),
    UNIQUE (nombre, id_ciudad)
);

CREATE TABLE acceso (
    id_acceso        INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre           VARCHAR(80)  NOT NULL UNIQUE
);

CREATE TABLE subacceso (
    id_subacceso     INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_acceso        INTEGER      NOT NULL REFERENCES acceso (id_acceso),
    nombre           VARCHAR(80)  NOT NULL,
    UNIQUE (id_acceso, nombre)
);

CREATE TABLE patologia (
    id_patologia     INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    descripcion      VARCHAR(150) NOT NULL UNIQUE
);

CREATE TABLE acta (
    ref_acta         VARCHAR(30)  PRIMARY KEY,
    fecha_acta       DATE         NOT NULL
);

CREATE TABLE categoria_actividad (
    id_categoria     INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre           VARCHAR(60)  NOT NULL UNIQUE
);

CREATE TABLE tipo_actividad (
    id_tipo_actividad INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_categoria      INTEGER     NOT NULL REFERENCES categoria_actividad (id_categoria),
    nombre            VARCHAR(80) NOT NULL,
    UNIQUE (id_categoria, nombre)
);

-- ---------------------------------------------------------------------
-- 2. Usuarios y roles
-- ---------------------------------------------------------------------

CREATE TABLE usuario (
    id_usuario       INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    login            VARCHAR(50)  NOT NULL UNIQUE,
    nombres          VARCHAR(80)  NOT NULL,
    apellidos        VARCHAR(80)  NOT NULL,
    correo           VARCHAR(120) NOT NULL UNIQUE,
    contrasena_hash  VARCHAR(255) NOT NULL,
    rol              VARCHAR(20)  NOT NULL
                     CHECK (rol IN ('estudiante', 'profesor', 'direccion')),
    estado           VARCHAR(10)  NOT NULL DEFAULT 'activo'
                     CHECK (estado IN ('activo', 'inactivo'))
);

CREATE TABLE estudiante (
    id_documento       VARCHAR(20)  PRIMARY KEY,
    id_usuario         INTEGER      NOT NULL UNIQUE REFERENCES usuario (id_usuario),
    fecha_nacimiento   DATE,
    pbm                SMALLINT     CHECK (pbm BETWEEN 0 AND 100),
    telefono           VARCHAR(20),
    direccion          VARCHAR(150),
    id_ciudad          INTEGER      REFERENCES ciudad (id_ciudad),
    estrato            SMALLINT     CHECK (estrato BETWEEN 1 AND 6),
    id_subacceso       INTEGER      NOT NULL REFERENCES subacceso (id_subacceso),
    sexo_legal         VARCHAR(20),
    genero             VARCHAR(30),
    anio_fin_colegio   SMALLINT,
    prom_actual        NUMERIC(3,2) CHECK (prom_actual BETWEEN 0 AND 5),
    papa               NUMERIC(3,2) CHECK (papa BETWEEN 0 AND 5),
    avance_carrera     NUMERIC(5,2) CHECK (avance_carrera BETWEEN 0 AND 100),
    matriculas         SMALLINT     CHECK (matriculas >= 0)
);

CREATE TABLE profesor (
    id_profesor      INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_usuario       INTEGER      NOT NULL UNIQUE REFERENCES usuario (id_usuario),
    departamento     VARCHAR(100) NOT NULL
);

-- Relación N:N "tutora" (PROFESOR - ESTUDIANTE)
CREATE TABLE tutor_estudiante (
    id_profesor      INTEGER      NOT NULL REFERENCES profesor (id_profesor),
    id_documento     VARCHAR(20)  NOT NULL REFERENCES estudiante (id_documento),
    fecha_inicio     DATE         NOT NULL,
    fecha_fin        DATE,
    PRIMARY KEY (id_profesor, id_documento, fecha_inicio),
    CHECK (fecha_fin IS NULL OR fecha_fin >= fecha_inicio)
);

-- Un estudiante tiene como máximo un tutor actual (sin fecha_fin)
CREATE UNIQUE INDEX ux_tutor_actual
    ON tutor_estudiante (id_documento)
    WHERE fecha_fin IS NULL;

-- ---------------------------------------------------------------------
-- 3. Perfiles del estudiante
-- ---------------------------------------------------------------------

CREATE TABLE perfil_academico (
    id_perfil_acad    INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_documento      VARCHAR(20)  NOT NULL UNIQUE REFERENCES estudiante (id_documento),
    id_colegio        INTEGER      REFERENCES colegio (id_colegio),
    puntaje_saber11   SMALLINT     CHECK (puntaje_saber11 BETWEEN 0 AND 500),
    puntaje_admision  NUMERIC(6,2),
    puesto_admision   INTEGER      CHECK (puesto_admision > 0),
    id_ciudad_origen  INTEGER      REFERENCES ciudad (id_ciudad),
    fecha_saber_pro   DATE,
    result_saber_pro  SMALLINT
);

CREATE TABLE perfil_psicosocial (
    id_perfil_psico  INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_documento     VARCHAR(20)  NOT NULL UNIQUE REFERENCES estudiante (id_documento),
    resultado_oso    VARCHAR(100),
    salud_mental     TEXT,
    salud_fisica     TEXT,
    discapacidad     VARCHAR(150),
    hobby_formal     VARCHAR(150),
    fecha_registro   DATE         NOT NULL DEFAULT CURRENT_DATE
);

-- Relación "padece" (ESTUDIANTE - PATOLOGIA)
CREATE TABLE estudiante_patologia (
    id_documento     VARCHAR(20)  NOT NULL REFERENCES estudiante (id_documento) ON DELETE CASCADE,
    id_patologia     INTEGER      NOT NULL REFERENCES patologia (id_patologia),
    fecha_registro   DATE         NOT NULL DEFAULT CURRENT_DATE,
    PRIMARY KEY (id_documento, id_patologia)
);

-- ---------------------------------------------------------------------
-- 4. Prácticas
-- ---------------------------------------------------------------------

CREATE TABLE empresa (
    id_empresa       INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nit              VARCHAR(20)  NOT NULL UNIQUE,
    nombre           VARCHAR(150) NOT NULL,
    sector           VARCHAR(80),
    id_ciudad        INTEGER      REFERENCES ciudad (id_ciudad)
);

CREATE TABLE practica (
    id_practica      INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_documento     VARCHAR(20)  NOT NULL REFERENCES estudiante (id_documento),
    id_empresa       INTEGER      NOT NULL REFERENCES empresa (id_empresa),
    id_profesor      INTEGER      NOT NULL REFERENCES profesor (id_profesor),
    periodo          VARCHAR(10)  NOT NULL,
    jefe_inmediato   VARCHAR(120),
    observ_jefe      TEXT,
    observ_asesor    TEXT,
    estado           VARCHAR(20)  NOT NULL
);

-- Atributo multivaluado "actividades" de PRACTICA (1FN)
CREATE TABLE practica_actividad (
    id_practica      INTEGER      NOT NULL REFERENCES practica (id_practica) ON DELETE CASCADE,
    numero           SMALLINT     NOT NULL,
    descripcion      VARCHAR(300) NOT NULL,
    PRIMARY KEY (id_practica, numero)
);

-- ---------------------------------------------------------------------
-- 5. Trabajo de grado
-- ---------------------------------------------------------------------

CREATE TABLE trabajo_grado (
    id_trabajo       INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_documento     VARCHAR(20)  NOT NULL REFERENCES estudiante (id_documento),
    id_director      INTEGER      REFERENCES profesor (id_profesor),
    id_codirector    INTEGER      REFERENCES profesor (id_profesor),
    modalidad        VARCHAR(40)  NOT NULL,
    titulo           VARCHAR(300),
    estado           VARCHAR(20)  NOT NULL,
    fecha_aprobacion DATE,
    periodo_cursado  VARCHAR(10),
    CHECK (id_codirector IS NULL OR id_codirector <> id_director)
);

-- Subtipo: datos que solo aplican a la modalidad de posgrado
CREATE TABLE trabajo_grado_posgrado (
    id_trabajo        INTEGER      PRIMARY KEY REFERENCES trabajo_grado (id_trabajo) ON DELETE CASCADE,
    programa_posgrado VARCHAR(150) NOT NULL,
    periodo_admision  VARCHAR(10)  NOT NULL,
    creditos_cursados SMALLINT     CHECK (creditos_cursados >= 0)
);

-- ---------------------------------------------------------------------
-- 6. Actividades interdisciplinarias
-- ---------------------------------------------------------------------

CREATE TABLE actividad_interd (
    id_actividad      INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_documento      VARCHAR(20)  NOT NULL REFERENCES estudiante (id_documento),
    id_profesor       INTEGER      REFERENCES profesor (id_profesor),
    id_tipo_actividad INTEGER      NOT NULL REFERENCES tipo_actividad (id_tipo_actividad),
    nombre            VARCHAR(200) NOT NULL,
    descripcion       TEXT,
    entidad           VARCHAR(150),
    id_ciudad         INTEGER      REFERENCES ciudad (id_ciudad),
    alcance           VARCHAR(30),
    rol               VARCHAR(60),
    fecha_inicio      DATE,
    fecha_fin         DATE,
    CHECK (fecha_fin IS NULL OR fecha_inicio IS NULL OR fecha_fin >= fecha_inicio)
);

-- ---------------------------------------------------------------------
-- 7. Solicitudes y soportes
-- ---------------------------------------------------------------------

CREATE TABLE solicitud (
    id_solicitud        INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_documento        VARCHAR(20)  NOT NULL REFERENCES estudiante (id_documento),
    id_usuario_resuelve INTEGER      REFERENCES usuario (id_usuario),
    ref_acta            VARCHAR(30)  REFERENCES acta (ref_acta),
    tipo                VARCHAR(60)  NOT NULL,
    descripcion         TEXT         NOT NULL,
    fecha_solicitud     DATE         NOT NULL DEFAULT CURRENT_DATE,
    estado              VARCHAR(20)  NOT NULL,
    observaciones       TEXT,
    respuesta           TEXT
);

-- Entidad débil: un soporte solo existe dentro de una solicitud
CREATE TABLE soporte (
    id_solicitud     INTEGER      NOT NULL REFERENCES solicitud (id_solicitud) ON DELETE CASCADE,
    nombre_archivo   VARCHAR(200) NOT NULL,
    tipo_soporte     VARCHAR(40),
    ruta             VARCHAR(500) NOT NULL,
    fecha_carga      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_solicitud, nombre_archivo)
);

-- ---------------------------------------------------------------------
-- 8. Tutorías
-- ---------------------------------------------------------------------

CREATE TABLE tutoria (
    id_tutoria          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_usuario_registra INTEGER      NOT NULL REFERENCES usuario (id_usuario),
    fecha               DATE         NOT NULL,
    modalidad           VARCHAR(20)  NOT NULL,
    observ_registrada   TEXT
);

-- Relación N:N "asiste" (ESTUDIANTE - TUTORIA)
CREATE TABLE asistencia_tutoria (
    id_tutoria        INTEGER      NOT NULL REFERENCES tutoria (id_tutoria) ON DELETE CASCADE,
    id_documento      VARCHAR(20)  NOT NULL REFERENCES estudiante (id_documento),
    observ_estudiante TEXT,
    PRIMARY KEY (id_tutoria, id_documento)
);

-- ---------------------------------------------------------------------
-- 9. Alertas y bitácora
-- ---------------------------------------------------------------------

CREATE TABLE alerta (
    id_alerta         INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_documento      VARCHAR(20)  NOT NULL REFERENCES estudiante (id_documento),
    id_usuario_revisa INTEGER      REFERENCES usuario (id_usuario),
    tipo              VARCHAR(40)  NOT NULL,
    descripcion       TEXT,
    estado            VARCHAR(20)  NOT NULL DEFAULT 'pendiente',
    accion_tomada     TEXT,
    fecha_generacion  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_revision    TIMESTAMP,
    CHECK (fecha_revision IS NULL OR fecha_revision >= fecha_generacion)
);

CREATE TABLE bitacora (
    id_bitacora        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_usuario         INTEGER      NOT NULL REFERENCES usuario (id_usuario),
    accion             VARCHAR(20)  NOT NULL,
    tabla_afectada     VARCHAR(60)  NOT NULL,
    registro_afectado  VARCHAR(60),
    ip                 INET,
    fecha_hora         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    enlace_repositorio VARCHAR(500)
);
