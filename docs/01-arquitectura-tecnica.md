# 01 — Arquitectura Técnica — LaboraGT

## 1. Visión general

LaboraGT se diseña como un sistema **modular, desacoplado y escalable** con tres capas principales:

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENTES                                 │
│  ┌──────────────────┐    ┌──────────────────────────────┐  │
│  │  App Móvil / PWA │    │  Panel Administrativo Web    │  │
│  │  (Colaboradores) │    │  (Jefes / Admin / Auditor)   │  │
│  └────────┬─────────┘    └──────────────┬───────────────┘  │
└───────────┼─────────────────────────────┼──────────────────┘
            │                             │
            └─────────────┬───────────────┘
                          │ HTTPS + JWT
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (API REST)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ Auth Service│  │ Attendance  │  │ Permission Service  │ │
│  │             │  │ Service     │  │                     │ │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘ │
│         │                │                    │            │
│  ┌──────┴────────────────┴────────────────────┴──────────┐ │
│  │              Business Rules Engine                    │ │
│  └───────────────────────────┬───────────────────────────┘ │
│                              │                             │
│  ┌───────────────────────────┴───────────────────────────┐ │
│  │              Repository Layer (Abstracción)           │ │
│  └───────────────────────────┬───────────────────────────┘ │
└──────────────────────────────┼─────────────────────────────┘
                               │
          ┌────────────────────┼────────────────────┐
          ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ Google Sheets   │  │ Storage (fotos) │  │ Logs / Auditoría│
│ (inicial)       │  │ Google Drive /  │  │                 │
│                 │  │ S3 / local      │  │                 │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

## 2. Principios de diseño

| Principio | Aplicación |
|-----------|------------|
| **Separación de responsabilidades** | Auth, Attendance, Permissions, Audit son servicios independientes |
| **Repository Pattern** | La capa de datos es intercambiable (Sheets → PostgreSQL/Supabase) |
| **Hechos inmutables** | Los marcajes nunca se borran ni se modifican; solo se relacionan con incidencias y permisos |
| **Validación en servidor** | Nunca confiar en hora/GPS/ID enviados por el cliente |
| **Evidencia completa** | Cada marcaje lleva foto + geo + dispositivo + biometría |
| **Transparencia** | El colaborador ve exactamente por qué se generó una incidencia |
| **Escalabilidad multi-institución** | Estructura preparada para `Institución → Dependencia → Unidad` |

## 3. Componentes principales

### 3.1 Cliente Móvil / PWA (Colaborador)
- Autenticación biométrica nativa (BiometricPrompt / LocalAuthentication)
- Captura de cámara frontal obligatoria
- Geolocalización en tiempo real
- Dashboard de jornada
- Historial personal
- Funcionamiento offline limitado (cola de sincronización)

### 3.2 Panel Administrativo Web
- Dashboard con indicadores KPI
- CRUD de usuarios, horarios, ubicaciones
- Gestión de permisos (crear / aprobar / rechazar)
- Consulta de marcajes e incidencias
- Reportes exportables (CSV / Excel / PDF)
- Bitácora de auditoría

### 3.3 Backend API
- Node.js + Express (o Fastify)
- JWT con expiración corta + refresh tokens
- Rate limiting + protección contra fuerza bruta
- Validación de datos con schemas (Zod / Joi)
- Motor de reglas de negocio
- Capa de repositorios abstracta

### 3.4 Almacenamiento
- **Fase 1**: Google Sheets (usuarios + marcajes + permisos)
- **Fase 2**: Migración a PostgreSQL / Supabase / Firebase
- Fotografías: Google Drive o bucket seguro con URLs temporales firmadas

## 4. Flujo de alto nivel de un marcaje

```
1. Usuario abre app → autenticación biométrica
2. Selecciona tipo de marcaje (solo el permitido según estado)
3. Sistema solicita:
   - Biometría de confirmación
   - Cámara frontal → captura foto
   - GPS + precisión
4. Cliente envía payload al backend
5. Backend valida:
   - Token JWT válido
   - Usuario activo
   - Distancia vs radio autorizado
   - Hora vs horario + tolerancia
   - Existencia de permiso vigente
6. Se crea registro de MARCAJE (inmutable)
7. Se genera INCIDENCIA si corresponde
8. Se asocia PERMISO si existe y justifica
9. Se escribe en auditoría
10. Se responde resultado claro al usuario
```

## 5. Consideraciones de escalabilidad

- Multi-institución desde el modelo de datos
- Cola de sincronización offline
- Posibilidad de workers para reportes pesados
- Separación clara entre lectura y escritura de Sheets (rate limits de Google)

## 6. Decisiones técnicas del MVP

| Decisión | Justificación |
|----------|---------------|
| PWA + responsive web primero | Velocidad de entrega, sin stores, funciona en Android/iOS |
| Google Sheets como fuente inicial | Cumple el requerimiento institucional actual |
| Repository Pattern | Migración futura sin reescribir lógica de negocio |
| Vanilla JS + CSS moderno | Alineado con portales institucionales + bajo peso |
| Node.js backend | Rápido de desarrollar, ecosistema maduro para Sheets API |

---

**Próximo documento**: [Modelo de datos](02-modelo-datos.md)
