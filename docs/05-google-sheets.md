# 05 — Estructura de Google Sheets — LaboraGT

## Principio de diseño

La integración con Google Sheets se realiza a través de una **capa de repositorios**.
La lógica de negocio nunca conoce que la fuente es Sheets.
Esto permite migrar a PostgreSQL/Supabase sin reescribir la aplicación.

```
UserRepository
AttendanceRepository
PermissionRepository
AuditRepository
LocationRepository
ScheduleRepository
```

Implementaciones iniciales:
```
GoogleSheetsUserRepository
GoogleSheetsAttendanceRepository
...
```

## Pestaña 1 — USUARIOS

| Columna | Nombre | Tipo / Ejemplo |
|---------|--------|----------------|
| A | id | UUID |
| B | codigo_empleado | EMP-00123 |
| C | dpi | 1234567890101 |
| D | nombre | Josué |
| E | apellidos | Pérez López |
| F | correo | josue.perez@institucion.gob.gt |
| G | telefono | 50212345678 |
| H | dependencia | Dirección de Tecnologías |
| I | unidad | Unidad de Desarrollo |
| J | cargo | Analista |
| K | jefe_inmediato_id | UUID del jefe |
| L | horario_id | HOR-001 |
| M | hora_entrada | 08:00 |
| N | hora_salida | 17:00 |
| O | inicio_almuerzo | 12:00 |
| P | fin_almuerzo | 13:00 |
| Q | ubicacion_id | UBI-001 |
| R | latitud_autorizada | 14.6349 |
| S | longitud_autorizada | -90.5069 |
| T | radio_metros | 100 |
| U | estado | activo |
| V | rol | colaborador |
| W | fecha_creacion | 2026-08-01T10:00:00Z |

## Pestaña 2 — MARCAJES

| Columna | Nombre | Tipo / Ejemplo |
|---------|--------|----------------|
| A | id | UUID |
| B | usuario_id | UUID |
| C | nombre_usuario | Josué Pérez López |
| D | fecha | 2026-08-19 |
| E | hora | 07:56:21 |
| F | fecha_hora | 2026-08-19T07:56:21-06:00 |
| G | tipo | ENTRADA |
| H | latitud | 14.6351 |
| I | longitud | -90.5070 |
| J | precision_gps | 12.5 |
| K | distancia_metros | 28 |
| L | fotografia_url | https://... |
| M | resultado_biometrico | EXITOSO |
| N | dispositivo | Samsung SM-A546B |
| O | sistema_operativo | Android 14 |
| P | ip | 190.x.x.x |
| Q | estado | VALIDO |
| R | cumplimiento_horario | PUNTUAL |
| S | cumplimiento_geografico | DENTRO |
| T | incidencia | (vacío o texto) |
| U | permiso_asociado | PER-2026-00125 |
| V | observaciones | |
| W | fecha_sincronizacion | 2026-08-19T07:56:25Z |
| X | transaction_id | TXN-... |
| Y | sincronizado_posteriormente | false |

## Pestañas adicionales recomendadas

- **PERMISOS**
- **HORARIOS**
- **UBICACIONES**
- **AUDITORIA**
- **CONFIGURACION**

## Buenas prácticas de integración

- Usar Service Account de Google con permisos mínimos.
- Cachear lecturas de usuarios/horarios cuando sea posible.
- Escrituras de marcajes de forma atómica (una fila por vez).
- Manejar rate limits de la API de Google.
- Nunca exponer las credenciales de Sheets en el cliente.

---

**Próximo documento**: [Diseño de API](06-api.md)
