# LaboraGT

**Control inteligente y transparente de la jornada laboral.**

> *Tu jornada, registrada con evidencia.*

Aplicación institucional moderna para el control digital de marcaje de entrada, salida y período de almuerzo de colaboradores.

## Características principales

- Marcaje con autenticación biométrica nativa + fotografía de evidencia + geolocalización
- Validación automática de horario y ubicación
- Detección de incidencias (tardanzas, salidas anticipadas, fuera de perímetro, etc.)
- Justificación mediante permisos autorizados (sin alterar el hecho original)
- Historial completo y trazabilidad
- Panel administrativo web para jefes, supervisores y administradores
- Integración inicial con Google Sheets (arquitectura preparada para migrar a base de datos profesional)
- Diseño limpio, moderno, confiable y fácil de usar

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
| Diseño UX/UI | En progreso |
| MVP funcional | Pendiente |

## Documentación

- [Arquitectura técnica](docs/01-arquitectura-tecnica.md)
- [Modelo de datos y ER](docs/02-modelo-datos.md)
- [Flujos de autenticación y marcaje](docs/03-flujos.md)
- [Matriz de roles y permisos](docs/04-roles-permisos.md)
- [Estructura Google Sheets](docs/05-google-sheets.md)
- [Diseño de API](docs/06-api.md)
- [Reglas de negocio](docs/07-reglas-negocio.md)
- [Estrategia de seguridad y auditoría](docs/08-seguridad-auditoria.md)
- [Plan de pruebas](docs/09-plan-pruebas.md)

## Stack propuesto (MVP)

- **Frontend móvil / PWA**: HTML5 + CSS3 + Vanilla JS (preparado para React Native en fase posterior)
- **Panel administrativo**: HTML5 + CSS3 + Vanilla JS (responsive)
- **Backend**: Node.js + Express
- **Almacenamiento inicial**: Google Sheets (vía API)
- **Autenticación**: JWT + biometría nativa del dispositivo
- **Almacenamiento de fotografías**: Google Drive o almacenamiento seguro con URLs temporales

## Principio fundamental

> *El sistema registra hechos; las reglas los interpretan; los permisos justifican las excepciones; y la auditoría conserva la trazabilidad.*

Nunca se modifica ni se borra un marcaje original.

---

**Desarrollado para instituciones públicas y privadas que requieren evidencia verificable de la jornada laboral.**
