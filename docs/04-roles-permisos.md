# 04 — Matriz de Roles y Permisos — LaboraGT

## Roles

| Rol | Descripción |
|-----|-------------|
| **Colaborador** | Realiza marcajes y consulta su propia información |
| **Jefe** | Supervisa a su equipo, crea/aprueba permisos de su unidad |
| **Administrador** | Gestión completa de usuarios, horarios, ubicaciones y reglas |
| **Auditor** | Solo lectura + trazabilidad completa (no modifica datos históricos) |

## Matriz de permisos

| Acción | Colaborador | Jefe | Administrador | Auditor |
|--------|:-----------:|:----:|:-------------:|:-------:|
| Realizar marcaje propio | ✅ | ✅ | ✅ | ❌ |
| Ver propio historial | ✅ | ✅ | ✅ | ❌ |
| Ver propios permisos | ✅ | ✅ | ✅ | ❌ |
| Ver marcajes de su equipo | ❌ | ✅ | ✅ | ✅ |
| Crear permiso para su equipo | ❌ | ✅ | ✅ | ❌ |
| Aprobar/rechazar permisos | ❌ | ✅* | ✅ | ❌ |
| CRUD usuarios | ❌ | ❌ | ✅ | ❌ |
| CRUD horarios | ❌ | ❌ | ✅ | ❌ |
| CRUD ubicaciones | ❌ | ❌ | ✅ | ❌ |
| Ver todos los marcajes | ❌ | ❌ | ✅ | ✅ |
| Generar reportes de su unidad | ❌ | ✅ | ✅ | ✅ |
| Generar reportes globales | ❌ | ❌ | ✅ | ✅ |
| Ver bitácora de auditoría | ❌ | ❌ | ✅ | ✅ |
| Modificar marcajes históricos | ❌ | ❌ | ❌ | ❌ |
| Desactivar usuarios | ❌ | ❌ | ✅ | ❌ |

\* Según configuración institucional (puede requerir doble aprobación).

## Principios de acceso

- El colaborador **nunca** puede modificar ni eliminar sus marcajes.
- Ningún rol puede borrar físicamente registros de auditoría.
- El Auditor no tiene capacidad de escritura sobre hechos históricos.
- Toda acción de escritura genera entrada en la bitácora de auditoría.

---

**Próximo documento**: [Estructura Google Sheets](05-google-sheets.md)
