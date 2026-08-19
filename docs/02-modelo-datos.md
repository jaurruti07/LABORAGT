# 02 — Modelo de Datos y Entidad-Relación — LaboraGT

## 1. Entidades principales

```
USUARIOS
HORARIOS
UBICACIONES
MARCAJES
FOTOGRAFIAS
INCIDENCIAS
PERMISOS
JUSTIFICACIONES
DISPOSITIVOS
AUDITORIA
ROLES
CONFIGURACION
INSTITUCIONES (preparado para multi-tenant)
DEPENDENCIAS
UNIDADES
```

## 2. Diagrama conceptual de relaciones

```
INSTITUCION
    │
    ├── DEPENDENCIA
    │       │
    │       └── UNIDAD
    │               │
    │               └── USUARIO ────────────────┐
    │                       │                   │
    │                       ├── HORARIO         │
    │                       │                   │
    │                       ├── UBICACION       │
    │                       │                   │
    │                       ├── DISPOSITIVO     │
    │                       │                   │
    │                       ├── MARCAJE ────────┼── FOTOGRAFIA
    │                       │       │           │
    │                       │       ├── INCIDENCIA
    │                       │       │       │
    │                       │       └── JUSTIFICACION ←── PERMISO
    │                       │
    │                       └── PERMISO (como solicitante o autorizador)
    │
    └── CONFIGURACION / REGLAS
```

## 3. Definición de entidades (campos clave)

### USUARIOS
| Campo | Tipo | Notas |
|-------|------|-------|
| id | string (UUID) | PK |
| codigo_empleado | string | Único |
| dpi | string | Identificador institucional |
| nombre | string | |
| apellidos | string | |
| correo | string | |
| telefono | string | |
| dependencia_id | string | FK |
| unidad_id | string | FK |
| cargo | string | |
| jefe_inmediato_id | string | FK → USUARIOS |
| horario_id | string | FK |
| ubicacion_id | string | FK |
| rol | enum | colaborador / jefe / admin / auditor |
| estado | enum | activo / inactivo / suspendido |
| fecha_creacion | datetime | |
| fecha_actualizacion | datetime | |

### HORARIOS
| Campo | Tipo | Notas |
|-------|------|-------|
| id | string | PK |
| nombre | string | Ej: "Jornada estándar 8-17" |
| hora_entrada | time | 08:00 |
| hora_salida | time | 17:00 |
| inicio_almuerzo | time | 12:00 |
| fin_almuerzo | time | 13:00 |
| tolerancia_entrada_min | int | 10 |
| tolerancia_salida_min | int | 10 |
| tolerancia_almuerzo_min | int | 5 |
| activo | boolean | |

### UBICACIONES
| Campo | Tipo | Notas |
|-------|------|-------|
| id | string | PK |
| nombre | string | |
| latitud | decimal | |
| longitud | decimal | |
| radio_metros | int | 100 |
| dependencia_id | string | |
| activo | boolean | |

### MARCAJES (inmutable)
| Campo | Tipo | Notas |
|-------|------|-------|
| id | string (UUID) | PK |
| usuario_id | string | FK |
| tipo | enum | ENTRADA / SALIDA_ALMUERZO / REGRESO_ALMUERZO / SALIDA |
| fecha | date | |
| hora | time | |
| fecha_hora | datetime | |
| latitud | decimal | |
| longitud | decimal | |
| precision_gps | float | metros |
| distancia_metros | float | respecto al punto autorizado |
| dentro_ubicacion | boolean | |
| cumplimiento_horario | enum | PUNTUAL / TARDIO / ANTICIPADO |
| minutos_diferencia | int | |
| estado | enum | VALIDO / TARDIO / ... (ver estados) |
| dispositivo_id | string | |
| ip | string | |
| sincronizado_posteriormente | boolean | |
| transaction_id | string | Único |
| observaciones | text | |
| created_at | datetime | Hora del servidor |

### FOTOGRAFIAS
| Campo | Tipo | Notas |
|-------|------|-------|
| id | string | PK |
| marcaje_id | string | FK |
| url | string | Protegida / temporal |
| hash | string | Para detectar reutilización |
| capturada_at | datetime | |

### INCIDENCIAS
| Campo | Tipo | Notas |
|-------|------|-------|
| id | string | PK |
| marcaje_id | string | FK |
| tipo | enum | ENTRADA_TARDIA / SALIDA_ANTICIPADA / FUERA_UBICACION / ... |
| descripcion | text | Clara y transparente |
| minutos / metros | number | Según tipo |
| justificada | boolean | |
| permiso_id | string | FK (nullable) |

### PERMISOS
| Campo | Tipo | Notas |
|-------|------|-------|
| id | string | PK |
| usuario_id | string | FK |
| tipo | enum | INGRESO_TARDIO / SALIDA_ANTICIPADA / TRABAJO_REMOTO / ... |
| fecha_inicio | date | |
| fecha_fin | date | |
| hora_inicio | time | |
| hora_fin | time | |
| motivo | text | |
| observaciones | text | |
| autorizado_por | string | FK → USUARIOS |
| estado | enum | PENDIENTE / APROBADO / RECHAZADO / CANCELADO / VENCIDO |
| created_at | datetime | |

### AUDITORIA
| Campo | Tipo | Notas |
|-------|------|-------|
| id | string | PK |
| usuario_id | string | Quién realizó la acción |
| accion | string | LOGIN / MARCAJE / APROBACION_PERMISO / ... |
| entidad | string | MARCAJE / PERMISO / USUARIO |
| entidad_id | string | |
| valor_anterior | json | |
| valor_nuevo | json | |
| ip | string | |
| dispositivo | string | |
| resultado | string | EXITOSO / FALLIDO |
| created_at | datetime | |

## 4. Estados normalizados de marcaje

```
VALIDO
TARDIO
SALIDA_ANTICIPADA
FUERA_DE_UBICACION
TARDIO_Y_FUERA_DE_UBICACION
JUSTIFICADO
RECHAZADO
PENDIENTE_SINCRONIZACION
ANOMALIA
```

## 5. Principio de inmutabilidad

```
Marcaje original (hecho)
        │
        ├── Incidencia (interpretación de la regla)
        │
        └── Justificación ← Permiso (excepción autorizada)
```

Nunca se borra ni se sobrescribe el marcaje.

---

**Próximo documento**: [Flujos](03-flujos.md)
