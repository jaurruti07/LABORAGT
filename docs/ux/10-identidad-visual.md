# 10 — Identidad Visual y Sistema de Diseño — LaboraGT

## Concepto

**"Tu jornada, registrada con evidencia."**

La interfaz debe transmitir:
- Confianza y transparencia
- Seguridad y trazabilidad
- Orden y puntualidad
- Modernización institucional
- Claridad (incluso para usuarios con poca experiencia tecnológica)

Evitar apariencia burocrática o excesivamente formal. Preferir diseño limpio, con tarjetas, indicadores visuales claros e iconografía moderna.

---

## Paleta de colores

### Colores primarios (institucionales)

| Token | Hex | Uso |
|-------|-----|-----|
| `--color-primary` | `#0F4C81` | Azul institucional principal (confianza, seriedad) |
| `--color-primary-dark` | `#0A3559` | Hover / estados activos |
| `--color-primary-light` | `#1A6BB5` | Acentos secundarios |

### Colores semánticos (estado de jornada)

| Token | Hex | Significado |
|-------|-----|-------------|
| `--color-success` | `#0D9488` | Cumplido / Válido / Dentro de ubicación (verde-teal) |
| `--color-warning` | `#D97706` | Observación / Tardanza leve (ámbar) |
| `--color-danger` | `#DC2626` | Incidencia / Fuera de ubicación / Incumplimiento |
| `--color-info` | `#2563EB` | Información / Justificado / Neutral |

### Neutros

| Token | Hex | Uso |
|-------|-----|-----|
| `--color-bg` | `#F8FAFC` | Fondo general |
| `--color-surface` | `#FFFFFF` | Tarjetas y superficies |
| `--color-border` | `#E2E8F0` | Bordes sutiles |
| `--color-text` | `#0F172A` | Texto principal |
| `--color-text-secondary` | `#64748B` | Texto secundario / labels |
| `--color-text-muted` | `#94A3B8` | Texto deshabilitado |

### Indicadores de estado de jornada

```
🟢  #0D9488  → Jornada cumplida
🟡  #D97706  → Jornada con observación
🔴  #DC2626  → Jornada con incidencia
🔵  #2563EB  → Jornada justificada
```

---

## Tipografía

- **Familia principal**: `Inter` (o system-ui como fallback)
- **Títulos**: 600–700 weight
- **Cuerpo**: 400–500 weight
- **Números / horas**: Tabular nums preferible

Escala sugerida:
- Display / H1: 28–32 px
- H2: 22–24 px
- H3: 18 px
- Body: 15–16 px
- Caption / labels: 13–14 px
- Micro: 12 px

---

## Iconografía

- Estilo: outline / line icons (Lucide, Heroicons o Phosphor)
- Grosor consistente (1.5–2 px)
- Tamaño táctil mínimo: 44×44 px en móvil

Iconos clave:
- Marcaje entrada / salida / almuerzo
- Ubicación (pin)
- Cámara / biometría
- Reloj / horario
- Check / warning / alert
- Historial / calendario
- Usuario / perfil

---

## Espaciado y layout

- Sistema de 4 px / 8 px
- Padding de tarjetas: 16–24 px
- Gap entre elementos: 12–16 px
- Border-radius: 12 px (tarjetas), 8 px (botones), 999 px (pills)
- Sombras suaves: `0 1px 3px rgba(0,0,0,0.06)`

---

## Componentes base

### Botón primario (Marcaje)
- Fondo: `--color-primary`
- Texto blanco, bold
- Altura mínima 52 px (móvil)
- Ancho completo en móvil
- Estado loading con spinner

### Botón semántico
- Verde → Confirmación de cumplimiento
- Ámbar → Observación
- Rojo → Alerta

### Tarjeta de estado
- Fondo blanco
- Borde sutil o acento lateral de color según estado
- Título + valor grande + caption

### Badge / Pill de estado
- Pequeño, redondeado
- Color de fondo + texto según semántica

### Indicador de progreso de jornada
- 4 pasos horizontales (Entrada → Almuerzo → Regreso → Salida)
- Check verde / círculo vacío / círculo actual resaltado

---

## Principios de UX prioritarios

1. **Una sola acción principal por pantalla** (el botón de marcaje debe dominar).
2. **Feedback inmediato y transparente** (el usuario debe entender *por qué* hay una observación).
3. **Mínima carga cognitiva** (no mostrar botones de marcaje que no correspondan).
4. **Accesibilidad WCAG 2.1 AA** (contraste, focus visible, labels, tamaños táctiles).
5. **Mobile-first** (el colaborador usa principalmente el teléfono).

---

**Siguiente**: Wireframes de pantallas clave.
