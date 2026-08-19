# 06 — Diseño de API REST — LaboraGT

## Principios

- REST + JSON
- Autenticación JWT (Bearer)
- Versionado: `/api/v1/`
- Validación de entrada en servidor
- Respuestas consistentes con códigos HTTP semánticos
- Rate limiting por IP y por usuario

## Endpoints principales

### Autenticación
```
POST   /api/v1/auth/login
POST   /api/v1/auth/activate          # primer acceso
POST   /api/v1/auth/biometric/verify
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
```

### Usuario autenticado
```
GET    /api/v1/users/me
GET    /api/v1/users/me/schedule
GET    /api/v1/users/me/location
```

### Marcajes (colaborador)
```
GET    /api/v1/attendance/today
GET    /api/v1/attendance/history?from=&to=
POST   /api/v1/attendance/check-in
POST   /api/v1/attendance/lunch-out
POST   /api/v1/attendance/lunch-in
POST   /api/v1/attendance/check-out
GET    /api/v1/attendance/:id
```

### Permisos
```
GET    /api/v1/permissions
POST   /api/v1/permissions
GET    /api/v1/permissions/:id
PATCH  /api/v1/permissions/:id/approve
PATCH  /api/v1/permissions/:id/reject
```

### Administración
```
GET    /api/v1/admin/dashboard
GET    /api/v1/admin/users
POST   /api/v1/admin/users
GET    /api/v1/admin/users/:id
PATCH  /api/v1/admin/users/:id
GET    /api/v1/admin/attendance
GET    /api/v1/admin/incidents
GET    /api/v1/admin/schedules
GET    /api/v1/admin/locations
GET    /api/v1/admin/reports/:type
GET    /api/v1/admin/audit
```

## Ejemplo de payload de marcaje

```json
POST /api/v1/attendance/check-in
{
  "latitud": 14.6351,
  "longitud": -90.5070,
  "precision_gps": 12.5,
  "fotografia_base64": "...",
  "dispositivo": {
    "modelo": "Samsung SM-A546B",
    "so": "Android 14",
    "app_version": "1.0.0"
  },
  "biometric_token": "...",
  "client_timestamp": "2026-08-19T07:56:21-06:00"
}
```

## Respuesta exitosa (ejemplo)

```json
{
  "success": true,
  "marcaje": {
    "id": "uuid",
    "tipo": "ENTRADA",
    "fecha_hora": "2026-08-19T07:56:21-06:00",
    "estado": "VALIDO",
    "cumplimiento_horario": "PUNTUAL",
    "cumplimiento_geografico": "DENTRO",
    "distancia_metros": 28,
    "mensaje": "¡Entrada registrada correctamente!"
  }
}
```

## Respuesta con incidencia

```json
{
  "success": true,
  "marcaje": {
    "id": "uuid",
    "tipo": "ENTRADA",
    "estado": "TARDIO",
    "cumplimiento_horario": "TARDIO",
    "minutos_diferencia": 17,
    "mensaje": "Entrada registrada con observación",
    "detalle": "Horario: 08:00 · Tolerancia: 10 min · Diferencia: 17 min"
  },
  "incidencia": {
    "tipo": "ENTRADA_TARDIA",
    "justificada": false
  }
}
```

---

**Próximo documento**: [Reglas de negocio](07-reglas-negocio.md)
