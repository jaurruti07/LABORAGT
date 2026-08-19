# 03 — Flujos de Usuario — LaboraGT

## 1. Flujo de autenticación

### Primer acceso
```
1. Usuario ingresa Código de empleado o DPI + código de activación
2. Sistema valida contra repositorio de usuarios
3. Si es válido → solicita registrar biometría nativa del dispositivo
4. (Opcional) Configura PIN de respaldo
5. Se genera JWT de sesión
6. Redirección al Dashboard
```

### Accesos posteriores
```
1. Abrir app
2. Biometría (huella / Face ID) o PIN
3. Si éxito → JWT renovado → Dashboard
4. Si falla → reintentos limitados → bloqueo temporal + log de auditoría
```

### Validación adicional para marcaje
Antes de cualquier marcaje se exige biometría nuevamente (prueba de vida de la sesión).

## 2. Flujo de marcaje (ideal)

```
Abrir LaboraGT
    ↓
Autenticación biométrica
    ↓
Dashboard muestra SOLO el botón del próximo marcaje permitido
    ↓
Usuario pulsa "MARCAR ENTRADA" (ejemplo)
    ↓
Pantalla de proceso:
  ✓ Identidad verificada (biometría)
  ✓ Cámara frontal activada
  ✓ Fotografía capturada
  ✓ Ubicación GPS obtenida
  ✓ Precisión GPS registrada
  ✓ Validación de ubicación
  ✓ Validación de horario
    ↓
Backend procesa y responde
    ↓
Resultado claro:
  - Marcaje exitoso + detalles
  - o Marcaje con observación (tardanza / fuera de ubicación)
  - o Marcaje justificado por permiso
```

## 3. Lógica de botones de marcaje (estado de la jornada)

| Estado actual del día | Botón visible |
|-----------------------|---------------|
| Sin marcajes | MARCAR ENTRADA |
| Solo Entrada | MARCAR SALIDA A ALMUERZO |
| Entrada + Salida Almuerzo | MARCAR REGRESO DE ALMUERZO |
| Entrada + Almuerzo completo | MARCAR SALIDA |
| Jornada completa | (ninguno) — "Jornada finalizada" |

## 4. Flujo de permisos

### Creación (Jefe / Admin)
```
1. Selecciona colaborador
2. Tipo de permiso + rango de fechas/horas + motivo
3. Guarda como PENDIENTE o APROBADO (según rol)
4. Se registra en auditoría
```

### Evaluación automática en marcaje
```
Al procesar un marcaje:
1. Buscar permisos APROBADOS del usuario que cubran la fecha/hora
2. Si existe permiso que justifique la incidencia → marcar incidencia como JUSTIFICADA
3. El marcaje original permanece intacto
4. Se crea relación Marcaje → Incidencia → Permiso
```

## 5. Flujo offline

```
1. Detectar falta de conexión
2. Informar al usuario
3. Si la política lo permite → guardar marcaje localmente (encriptado)
4. Al recuperar conexión → sincronizar
5. Marcar el registro como "sincronizado posteriormente"
6. Re-validar en servidor (hora del servidor manda)
```

## 6. Flujo de transparencia de incidencias

Nunca mostrar solo "Incumplimiento".

Ejemplo de mensaje al colaborador:

```
Entrada registrada a las 08:27:15
Horario establecido: 08:00
Tolerancia: 10 minutos
Diferencia: 17 minutos
Estado: Entrada tardía

Ubicación: 850 m del punto autorizado
Radio permitido: 100 m
Estado adicional: Fuera de ubicación autorizada
```

---

**Próximo documento**: [Roles y permisos](04-roles-permisos.md)
