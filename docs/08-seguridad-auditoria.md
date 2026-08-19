# 08 — Estrategia de Seguridad y Auditoría — LaboraGT

## 1. Seguridad

### Autenticación y sesión
- JWT con expiración corta (15-30 min) + refresh token
- Biometría nativa del dispositivo (nunca se almacenan huellas en servidor)
- PIN de respaldo con límite de intentos
- Rate limiting en endpoints de autenticación

### Validación en servidor
Nunca confiar en:
- Hora enviada por el cliente
- Coordenadas GPS enviadas por el cliente (se usan, pero se validan y se registran)
- ID de usuario enviado por el cliente (se toma del token)

### Protección de datos
- HTTPS obligatorio
- Fotografías con URLs temporales firmadas o acceso autenticado
- Cifrado de datos sensibles en reposo cuando se migre a base de datos profesional
- Minimización de datos biométricos (solo se usa el resultado de la biometría del SO)

### Prevención de abuso
- Rate limiting por IP y por usuario
- Detección de patrones anómalos (múltiples marcajes desde ubicaciones imposibles, etc.)
- Logs de seguridad independientes

## 2. Auditoría

Toda acción relevante genera un registro inmutable:

- Login / Logout / Intentos fallidos
- Cada marcaje (exitoso o rechazado)
- Creación / aprobación / rechazo de permisos
- Cambios de horario, ubicación o estado de usuario
- Consultas sensibles de reportes

Campos mínimos del log de auditoría:
- usuario_id
- acción
- entidad + entidad_id
- valor_anterior / valor_nuevo (cuando aplique)
- ip
- dispositivo
- resultado
- timestamp del servidor

**Nunca se eliminan registros de auditoría.**

## 3. Privacidad

- Finalidad limitada y explícita
- Retención definida de fotografías y datos de ubicación
- Acceso basado en roles
- Política de privacidad clara para el colaborador

---

**Próximo documento**: [Plan de pruebas](09-plan-pruebas.md)
