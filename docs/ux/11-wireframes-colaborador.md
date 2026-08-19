# 11 — Wireframes y Diseño de Pantallas — App Colaborador (PWA)

## Mapa de pantallas (MVP)

```
Login / Activación
    ↓
Dashboard (Home)
    ├── Flujo de Marcaje (modal / pantalla dedicada)
    ├── Mi Historial
    │       └── Detalle de marcaje
    ├── Mis Permisos
    └── Perfil / Horario
```

---

## 1. Pantalla de Login / Primer acceso

```
┌─────────────────────────────────────┐
│           [Logo LaboraGT]           │
│                                     │
│     Control inteligente de          │
│     tu jornada laboral              │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ Código de empleado o DPI      │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │ Código de activación          │  │
│  └───────────────────────────────┘  │
│                                     │
│  [     Continuar     ]              │
│                                     │
│  ─── o ───                          │
│  Usar biometría (después del        │
│  primer acceso)                     │
└─────────────────────────────────────┘
```

**Notas UX**
- Campos grandes, teclado numérico cuando corresponda.
- Mensajes de error claros y no técnicos.
- Después del primer acceso exitoso → solicitar registro de biometría nativa.

---

## 2. Dashboard del colaborador (pantalla principal)

Esta es la pantalla más importante. El usuario debe saber en **menos de 3 segundos**:
1. Quién está autenticado
2. Su horario
3. Qué marcajes ya hizo
4. Cuál es el próximo marcaje
5. Si hay alguna incidencia
6. Si está dentro de la ubicación autorizada

```
┌─────────────────────────────────────┐
│ ☰  LaboraGT              [👤 Josué] │
├─────────────────────────────────────┤
│                                     │
│  Buenos días, Josué                 │
│  19 de agosto de 2026               │
│                                     │
│  ┌─ Estado de mi jornada ─────────┐ │
│  │  🟢  Jornada en curso          │ │
│  │  Cumplimiento: 100 %           │ │
│  └────────────────────────────────┘ │
│                                     │
│  ┌─ Horario de hoy ───────────────┐ │
│  │  08:00  —  17:00               │ │
│  │  Almuerzo: 12:00 – 13:00       │ │
│  └────────────────────────────────┘ │
│                                     │
│  ┌─ Progreso de marcajes ─────────┐ │
│  │  ●─────○─────○─────○           │ │
│  │  Ent.  Alm.  Reg.  Sal.        │ │
│  │                                │ │
│  │  ✓ Entrada      07:56          │ │
│  │  — Salida alm.  pendiente      │ │
│  │  — Regreso      pendiente      │ │
│  │  — Salida       pendiente      │ │
│  └────────────────────────────────┘ │
│                                     │
│  ┌─ Ubicación ────────────────────┐ │
│  │  ✓ Dentro de ubicación         │ │
│  │    autorizada                  │ │
│  └────────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐  │
│  │                               │  │
│  │     MARCAR SALIDA             │  │
│  │     A ALMUERZO                │  │
│  │                               │  │
│  └───────────────────────────────┘  │
│                                     │
│  [ Historial ]  [ Permisos ]        │
└─────────────────────────────────────┘
```

**Reglas de diseño del Dashboard**
- Solo se muestra **un** botón de marcaje (el siguiente lógico).
- El botón es grande, de color primario, y ocupa el ancho casi completo.
- Los estados se comunican con color + icono + texto corto.
- Si existe incidencia del día, se muestra una tarjeta de advertencia encima del botón.

---

## 3. Flujo de marcaje (pantalla de proceso)

Al pulsar el botón de marcaje se abre una secuencia clara:

```
┌─────────────────────────────────────┐
│  ←  Confirmar marcaje               │
├─────────────────────────────────────┤
│                                     │
│  Vas a registrar:                   │
│  **Salida a almuerzo**              │
│                                     │
│  ┌─ Checklist en vivo ────────────┐ │
│  │  ✓ Identidad verificada        │ │
│  │  ✓ Cámara activada             │ │
│  │  ✓ Fotografía capturada        │ │
│  │  ✓ Ubicación obtenida          │ │
│  │  … Validando ubicación         │ │
│  │  … Validando horario           │ │
│  └────────────────────────────────┘ │
│                                     │
│  [Vista previa de la foto]          │
│                                     │
│  ┌─ Mapa / distancia ─────────────┐ │
│  │  28 m del punto autorizado     │ │
│  └────────────────────────────────┘ │
│                                     │
│  [ Confirmar y registrar ]          │
└─────────────────────────────────────┘
```

**Resultado exitoso**
```
┌─────────────────────────────────────┐
│                                     │
│            ✓                        │
│     Marcaje exitoso                 │
│                                     │
│  Salida a almuerzo registrada       │
│  12:03:18                           │
│                                     │
│  ✓ Dentro del horario               │
│  ✓ Dentro de la ubicación           │
│                                     │
│  [ Volver al inicio ]               │
└─────────────────────────────────────┘
```

**Resultado con observación**
```
┌─────────────────────────────────────┐
│                                     │
│            ⚠                        │
│  Marcaje con observación            │
│                                     │
│  Entrada registrada                 │
│  08:17:42                           │
│                                     │
│  ⚠ Entrada tardía                   │
│  Horario: 08:00                     │
│  Tolerancia: 10 min                 │
│  Diferencia: 17 min                 │
│                                     │
│  ✓ Dentro de ubicación              │
│                                     │
│  [ Entendido ]                      │
└─────────────────────────────────────┘
```

**Resultado justificado por permiso**
```
┌─────────────────────────────────────┐
│                                     │
│            ✓                        │
│  Marcaje justificado                │
│                                     │
│  Entrada registrada                 │
│  08:17:42                           │
│                                     │
│  ✓ Cubierto por permiso             │
│    PER-2026-00125                   │
│                                     │
│  [ Entendido ]                      │
└─────────────────────────────────────┘
```

---

## 4. Mi Historial

```
┌─────────────────────────────────────┐
│  ←  Mi historial                    │
├─────────────────────────────────────┤
│  [ Hoy ] [ Semana ] [ Mes ] [ Rango]│
│                                     │
│  ┌─────────────────────────────────┐│
│  │ 19/08  07:56 12:03 13:01 17:03 ││
│  │        ✓ Cumplido              ││
│  └─────────────────────────────────┘│
│  ┌─────────────────────────────────┐│
│  │ 18/08  08:27 12:00 13:00 17:00 ││
│  │        ⚠ Entrada tardía        ││
│  └─────────────────────────────────┘│
│  ┌─────────────────────────────────┐│
│  │ 17/08  07:55 12:01 12:58 17:02 ││
│  │        ✓ Cumplido              ││
│  └─────────────────────────────────┘│
│                                     │
│  Resumen semanal                    │
│  LUN ✓  MAR ✓  MIÉ ⚠  JUE ✓  VIE ✓  │
│  Cumplimiento: 96 %                 │
└─────────────────────────────────────┘
```

Al tocar un día → **Detalle de marcaje** (foto, mapa, coordenadas, dispositivo, estado, observaciones).

---

## 5. Detalle de un marcaje (evidencia)

```
┌─────────────────────────────────────┐
│  ←  Detalle de entrada              │
├─────────────────────────────────────┤
│  19 de agosto de 2026               │
│  07:56:21                           │
│                                     │
│  Estado: ✓ Válido                   │
│                                     │
│  [ Fotografía de evidencia ]        │
│                                     │
│  ┌─ Ubicación ────────────────────┐ │
│  │  [Mini mapa]                   │ │
│  │  14.6351, -90.5070             │ │
│  │  28 m del punto autorizado     │ │
│  │  Precisión GPS: 12 m           │ │
│  └────────────────────────────────┘ │
│                                     │
│  Dispositivo: Samsung SM-A546B      │
│  SO: Android 14                     │
│                                     │
│  Observaciones: —                   │
└─────────────────────────────────────┘
```

---

## 6. Principios de interacción del colaborador

1. El flujo de marcaje debe completarse en **menos de 15 segundos** en condiciones normales.
2. Nunca mostrar botones de marcaje que no correspondan al estado actual.
3. Toda incidencia se explica con números concretos (minutos / metros).
4. El botón de marcaje es la acción más prominente de la pantalla.
5. Feedback visual inmediato en cada paso del checklist.

---

**Siguiente**: Wireframes del Panel Administrativo.
