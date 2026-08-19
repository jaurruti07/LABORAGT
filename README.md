# LaboraGT

**Control inteligente y transparente de la jornada laboral.**

> *Tu jornada, registrada con evidencia.*

Aplicación institucional moderna para el control digital de marcaje de entrada, salida y período de almuerzo de colaboradores.

## Estado del proyecto

| Fase | Estado |
|------|--------|
| Arquitectura técnica | Completada |
| Modelo de datos | Completado |
| Flujos de usuario | Completados |
| Diseño de API | Completado |
| Estructura Google Sheets | Completada |
| Reglas de negocio | Completadas |
| Seguridad y auditoría | Completada |
| Plan de pruebas | Completado |
| Diseño UX/UI | Completado |
| **MVP funcional** | **Implementado (v0.1)** |

## Estructura del repositorio

```
LABORAGT/
├── backend/                 # API Node.js + Express
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── server.js
│       ├── middleware/auth.js
│       ├── routes/          # auth, attendance, users
│       ├── services/        # authService, attendanceService
│       ├── repositories/    # mockData (preparado para Google Sheets)
│       └── utils/           # geo (Haversine), schedule
├── frontend/                # PWA Colaborador
│   ├── index.html
│   ├── manifest.json
│   ├── css/                 # variables, base, components, app
│   └── js/                  # config, api, auth, geo, camera, app
├── docs/                    # Arquitectura + UX
└── README.md
```

## Cómo ejecutar el MVP

### 1. Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
# → http://localhost:3000/health
```

### 2. Frontend (PWA)

```bash
cd frontend
npx serve .
# o Live Server en VS Code
# Abrir la URL que muestre (ej. http://localhost:3000)
```

> **Importante:** En `frontend/js/config.js` la URL del API es `http://localhost:3000/api/v1`. Si el frontend corre en otro puerto, asegúrate de que el backend permita CORS (ya está configurado con `*`).

### Credenciales de demostración

| Campo | Valor |
|-------|-------|
| Código de empleado | `EMP-001` |
| Código de activación | `ACT-2026` |

## Funcionalidades del MVP

**Colaborador**
- Login con código de empleado + activación
- Dashboard con saludo, horario, progreso de marcajes
- Botón único del próximo marcaje permitido
- Flujo de marcaje: identidad → foto → GPS → registro
- Resultado transparente (puntual / tardanza / fuera de ubicación)

**Backend**
- JWT
- Validación de secuencia de marcajes
- Evaluación de horario con tolerancias
- Cálculo de distancia Haversine
- Respuestas con minutos y metros exactos

## Documentación

### Arquitectura y reglas
- [Arquitectura técnica](docs/01-arquitectura-tecnica.md)
- [Modelo de datos](docs/02-modelo-datos.md)
- [Flujos](docs/03-flujos.md)
- [Roles y permisos](docs/04-roles-permisos.md)
- [Google Sheets](docs/05-google-sheets.md)
- [API](docs/06-api.md)
- [Reglas de negocio](docs/07-reglas-negocio.md)
- [Seguridad y auditoría](docs/08-seguridad-auditoria.md)
- [Plan de pruebas](docs/09-plan-pruebas.md)

### Diseño UX/UI
- [Identidad visual](docs/ux/10-identidad-visual.md)
- [Wireframes Colaborador](docs/ux/11-wireframes-colaborador.md)
- [Wireframes Admin](docs/ux/12-wireframes-admin.md)

## Principio fundamental

> *El sistema registra hechos; las reglas los interpretan; los permisos justifican las excepciones; y la auditoría conserva la trazabilidad.*

Nunca se modifica ni se borra un marcaje original.

---

**Desarrollado para instituciones públicas y privadas que requieren evidencia verificable de la jornada laboral.**
