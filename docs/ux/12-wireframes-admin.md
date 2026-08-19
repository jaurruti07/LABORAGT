# 12 — Wireframes y Diseño de Pantallas — Panel Administrativo

## Mapa de pantallas (MVP)

```
Login Admin
    ↓
Dashboard (KPIs)
    ├── Usuarios
    ├── Marcajes
    ├── Incidencias
    ├── Permisos
    ├── Horarios
    ├── Ubicaciones
    ├── Reportes
    └── Auditoría
```

El panel es **web responsive** (desktop prioritario, tablet usable).

---

## 1. Dashboard administrativo

```
┌──────────────────────────────────────────────────────────────────┐
│ LaboraGT Admin          [Buscar…]              Josué (Admin) ▼  │
├────────────┬─────────────────────────────────────────────────────┤
│            │                                                     │
│ Dashboard  │  Resumen del día — 19 ago 2026                      │
│ Usuarios   │                                                     │
│ Marcajes   │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐       │
│ Incidencias│  │  142   │ │   18   │ │    4   │ │   12   │       │
│ Permisos   │  │Marcajes│ │Tardías │ │Fuera   │ │Permisos│       │
│ Horarios   │  │ del día│ │        │ │ubic.   │ │activos │       │
│ Ubicaciones│  └────────┘ └────────┘ └────────┘ └────────┘       │
│ Reportes   │                                                     │
│ Auditoría  │  Cumplimiento diario                                │
│            │  ████████████████████░░░░  92 %                     │
│            │                                                     │
│            │  [Gráfico de entradas por hora]                     │
│            │                                                     │
│            │  Últimas incidencias                                │
│            │  • 08:17  María L.  Entrada tardía  17 min          │
│            │  • 08:22  Carlos R. Fuera de ubicación              │
│            │  • 12:45  Ana M.    Regreso de almuerzo tardío      │
│            │                                                     │
└────────────┴─────────────────────────────────────────────────────┘
```

**KPIs prioritarios**
- Colaboradores activos
- Marcajes del día
- Entradas tardías
- Salidas anticipadas
- Marcajes fuera de ubicación
- Ausencias
- Permisos vigentes
- Incidencias pendientes de revisión

Cada KPI es clicable → filtra el listado correspondiente.

---

## 2. Listado de Marcajes

```
┌──────────────────────────────────────────────────────────────────┐
│ Marcajes                                                         │
│                                                                  │
│ Filtros: [Fecha] [Usuario] [Dependencia] [Tipo] [Estado] [Buscar]│
│                                                                  │
│ Fecha       Usuario          Tipo        Hora    Estado   Acciones│
│ 19/08 07:56 Josué Pérez      Entrada     07:56   ✓ Válido  [Ver] │
│ 19/08 08:17 María López      Entrada     08:17   ⚠ Tardío  [Ver] │
│ 19/08 08:22 Carlos Ruiz      Entrada     08:22   🔴 Fuera   [Ver] │
│ ...                                                              │
└──────────────────────────────────────────────────────────────────┘
```

Al hacer clic en **Ver** → se abre el detalle completo (foto, mapa, dispositivo, incidencias asociadas, permisos).

---

## 3. Gestión de Permisos

```
┌──────────────────────────────────────────────────────────────────┐
│ Permisos                              [ + Nuevo permiso ]        │
│                                                                  │
│ Tabs: [Pendientes] [Aprobados] [Rechazados] [Todos]              │
│                                                                  │
│ ID            Colaborador     Tipo              Estado   Acciones│
│ PER-2026-0125 María López     Ingreso tardío    Pendiente [A/R] │
│ PER-2026-0124 Carlos Ruiz     Comisión oficial  Aprobado  [Ver] │
│ ...                                                              │
└──────────────────────────────────────────────────────────────────┘
```

**Formulario de nuevo permiso**
- Selector de colaborador
- Tipo de permiso (lista)
- Rango de fechas y horas
- Motivo (obligatorio)
- Observaciones
- Botón Guardar (estado inicial según rol)

---

## 4. Usuarios (CRUD)

```
┌──────────────────────────────────────────────────────────────────┐
│ Usuarios                                  [ + Nuevo usuario ]    │
│                                                                  │
│ [Buscar por nombre, código o DPI]                                │
│                                                                  │
│ Código    Nombre              Dependencia      Rol      Estado  │
│ EMP-001   Josué Pérez         Tecnologías      Colab.   Activo  │
│ EMP-002   María López         RRHH             Colab.   Activo  │
│ ...                                                              │
└──────────────────────────────────────────────────────────────────┘
```

Formulario de usuario incluye:
- Datos personales
- Código / DPI
- Dependencia / Unidad / Cargo
- Jefe inmediato
- Horario asignado
- Ubicación autorizada + radio
- Rol
- Estado

---

## 5. Horarios y Ubicaciones

Pantallas simples de listado + formulario.

**Ubicaciones** debe incluir:
- Nombre
- Coordenadas (lat / lng)
- Radio en metros
- Mapa interactivo para seleccionar el punto (Leaflet o similar)
- Dependencia asociada
- Estado activo/inactivo

---

## 6. Reportes

```
┌──────────────────────────────────────────────────────────────────┐
│ Reportes                                                         │
│                                                                  │
│ Tipo: [Diario ▼]   Periodo: [19/08/2026]   Dependencia: [Todas] │
│                                                                  │
│ [ Generar ]                                                      │
│                                                                  │
│ Resultados                                                       │
│ • Cumplimiento: 92 %                                             │
│ • Tardanzas: 18                                                  │
│ • Fuera de ubicación: 4                                          │
│ • Ausencias: 3                                                   │
│                                                                  │
│ [ Exportar CSV ]  [ Exportar Excel ]  [ Exportar PDF ]           │
└──────────────────────────────────────────────────────────────────┘
```

---

## 7. Auditoría

Tabla de solo lectura con filtros por fecha, usuario, acción y entidad.
No se permite eliminar ni editar registros.

---

## Principios del panel admin

1. **Desktop-first** pero usable en tablet.
2. Navegación lateral fija (colapsable en móvil).
3. Tablas con filtros claros y paginación.
4. Acciones destructivas siempre con confirmación.
5. Feedback de éxito / error con toasts no bloqueantes.
6. Colores semánticos consistentes con la app del colaborador.

---

**Siguiente paso**: Implementación del MVP (código).
