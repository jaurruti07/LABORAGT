# 09 — Plan de Pruebas — LaboraGT

## 1. Pruebas unitarias
- Cálculo de distancia haversine
- Evaluación de puntualidad vs tolerancia
- Determinación del siguiente tipo de marcaje permitido
- Evaluación de permisos que justifican una incidencia

## 2. Pruebas de integración
- Flujo completo de marcaje (mock de GPS + foto)
- Escritura y lectura en Google Sheets
- Generación de JWT y validación de roles
- Creación y justificación de incidencias

## 3. Pruebas de aceptación (MVP)

| Caso | Resultado esperado |
|------|--------------------|
| Marcaje de entrada puntual y dentro de radio | Estado VALIDO |
| Marcaje de entrada 17 min tarde | Estado TARDIO + mensaje transparente |
| Marcaje fuera de radio | Estado FUERA_DE_UBICACION |
| Marcaje tardío + permiso vigente | Estado JUSTIFICADO |
| Intento de marcaje fuera de secuencia | Rechazado con mensaje claro |
| Usuario inactivo intenta marcar | Rechazado |
| Jefe crea y aprueba permiso | Visible para el colaborador y justificación automática |

## 4. Pruebas de seguridad
- Token expirado
- Token de otro usuario
- Intentos de fuerza bruta en login
- Envío de foto de galería (debe rechazarse)
- Manipulación de timestamp del cliente

## 5. Pruebas de usabilidad
- Flujo de marcaje en menos de 15 segundos
- Claridad de mensajes de incidencia
- Accesibilidad básica (contraste, tamaños de toque)

---

**Siguiente paso**: Diseño UX/UI de pantallas + implementación del MVP.
