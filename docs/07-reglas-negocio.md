# 07 — Reglas de Negocio — LaboraGT

## Principio rector

> El sistema registra hechos; las reglas los interpretan; los permisos justifican las excepciones; y la auditoría conserva la trazabilidad.

## 1. Reglas de horario

- Cada usuario tiene un horario asignado (entrada, almuerzo, salida).
- Existe tolerancia configurable (por institución / dependencia / usuario).
- Si `hora_marcaje <= hora_programada + tolerancia` → **PUNTUAL**.
- Si `hora_marcaje > hora_programada + tolerancia` → **TARDIO** (o ANTICIPADO en salidas).
- La hora que manda es la del **servidor**, no la del dispositivo.

## 2. Reglas de ubicación

- Cada usuario tiene un punto geográfico autorizado + radio en metros.
- Se calcula distancia haversine entre GPS del marcaje y punto autorizado.
- Si `distancia <= radio` → **DENTRO**.
- Si `distancia > radio` → **FUERA_DE_UBICACION**.
- La política de “registrar con alerta” vs “rechazar” es configurable por administrador.

## 3. Reglas de secuencia de marcaje

Solo se permite el siguiente marcaje lógico del día:

1. ENTRADA
2. SALIDA_ALMUERZO
3. REGRESO_ALMUERZO
4. SALIDA

No se permiten marcajes fuera de secuencia ni duplicados del mismo tipo en el mismo día (salvo reglas especiales futuras).

## 4. Reglas de permisos

- Un permiso APROBADO que cubra la fecha/hora del marcaje justifica la incidencia correspondiente.
- El marcaje original **nunca se modifica**.
- Se crea una relación: Marcaje → Incidencia → Permiso (Justificación).
- El colaborador ve el estado “Justificado” y no una alerta de incumplimiento.

## 5. Reglas de evidencia

- Todo marcaje requiere fotografía capturada en el momento (cámara frontal preferida).
- No se permite seleccionar imagen de galería.
- Se registra hash de la imagen para detectar posibles reutilizaciones.
- Biometría nativa del dispositivo se usa como prueba de identidad en el momento del marcaje.

## 6. Reglas de transparencia

Toda incidencia mostrada al colaborador debe explicar:
- Hora real del marcaje
- Hora programada
- Tolerancia aplicada
- Diferencia en minutos o metros
- Estado resultante

## 7. Estados posibles de un marcaje

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

## 8. Detección de anomalías (fase posterior)

- GPS mock / ubicación falsa
- Cambio de fecha/hora del dispositivo
- Reutilización de fotografía
- Múltiples intentos fallidos de biometría
- Dispositivo no reconocido

Se registran como “Intento sospechoso” sin bloqueo automático (revisión administrativa).

---

**Próximo documento**: [Seguridad y auditoría](08-seguridad-auditoria.md)
