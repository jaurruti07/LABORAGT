# 14 — Configurar Google Sheets como fuente de datos

LaboraGT puede operar en dos modos:

| `DATA_SOURCE` | Comportamiento |
|---------------|----------------|
| `mock` (default) | Datos en memoria. Ideal para demos. Se pierden al reiniciar el servicio. |
| `sheets` | Google Sheets persistente vía Service Account. |

La lógica de negocio **no conoce** Sheets: usa la fachada `repositories/index.js`.

---

## 1. Crear la hoja de cálculo

1. Crea un Google Spreadsheet nuevo.
2. Renombra las pestañas (nombres exactos):
   - `USUARIOS`
   - `MARCAJES`
   - `PERMISOS`
3. Copia el **ID** del spreadsheet desde la URL:
   ```
   https://docs.google.com/spreadsheets/d/ESTE_ES_EL_ID/edit
   ```

### Encabezados USUARIOS (fila 1)

```
id | codigo_empleado | dpi | nombre | apellidos | correo | telefono | dependencia | unidad | cargo | jefe_inmediato_id | horario_id | hora_entrada | hora_salida | inicio_almuerzo | fin_almuerzo | tolerancia_entrada_min | tolerancia_salida_min | tolerancia_almuerzo_min | ubicacion_id | ubicacion_nombre | latitud_autorizada | longitud_autorizada | radio_metros | estado | rol | codigo_activacion
```

### Encabezados MARCAJES (fila 1)

```
id | usuario_id | nombre_usuario | fecha | hora | fecha_hora | tipo | latitud | longitud | precision_gps | distancia_metros | dentro_ubicacion | cumplimiento_horario | minutos_diferencia | estado | dispositivo_json | fotografia_presente | transaction_id | sincronizado_posteriormente | created_at | permiso_id | incidencias_json
```

### Encabezados PERMISOS (fila 1)

```
id | usuario_id | nombre_usuario | fecha | hora_inicio | hora_fin | motivo | motivo_label | descripcion | tipos_cubiertos | estado | aprobado_por | aprobado_at | comentario_jefe | created_at | timezone
```

### Filas de ejemplo (USUARIOS)

| id | codigo_empleado | … | latitud | longitud | radio | estado | rol | codigo_activacion |
|----|-----------------|---|---------|----------|-------|--------|-----|-------------------|
| usr-001 | EMP-001 | … | 14.6349 | -90.5069 | 100 | activo | colaborador | ACT-2026 |
| usr-002 | EMP-002 | … | 14.6349 | -90.5069 | 100 | activo | jefe | ACT-2026 |

---

## 2. Service Account de Google

1. Ve a [Google Cloud Console](https://console.cloud.google.com/).
2. Crea un proyecto (o usa uno existente).
3. Habilita **Google Sheets API**.
4. **IAM y administración → Cuentas de servicio → Crear**.\n5. Crea una clave JSON y descárgala.
6. Comparte el spreadsheet con el email de la service account (`…@….iam.gserviceaccount.com`) como **Editor**.

---

## 3. Variables en Render

En el Web Service `laboragt-api` agrega:

| Variable | Valor |
|----------|--------|
| `DATA_SOURCE` | `sheets` |
| `GOOGLE_SHEETS_ID` | ID del spreadsheet |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | email de la service account |
| `GOOGLE_PRIVATE_KEY` | contenido de `private_key` del JSON (con `\n` literales) |

Ejemplo de `GOOGLE_PRIVATE_KEY` en una sola línea:

```
-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n
```

---

## 4. Verificar

```bash
curl https://TU-API.onrender.com/health
```

Respuesta esperada:

```json
{
  "status": "ok",
  "data_source": "sheets",
  "data_ready": true,
  "timezone": "America/Guatemala",
  "hora_guatemala": "2026-08-20T09:15:00-06:00"
}
```

En los logs del deploy debe aparecer:

```
[data] Google Sheets listo · usuarios=N marcajes=M permisos=P
```

---

## 5. Comportamiento

- **Lectura:** se carga en memoria al arrancar (caché ~30 s en capa Sheets).
- **Escritura de marcajes/permisos:** se guarda en memoria y se appendea a Sheets en segundo plano.
- **Aprobar/rechazar permiso:** actualiza memoria y reescribe la hoja PERMISOS.
- Si falla la conexión al arrancar, reintenta cada 2 minutos.

---

## 6. Volver a mock

```
DATA_SOURCE=mock
```

(o elimina las variables de Sheets).

---

**Relacionado:** [Estructura de pestañas](05-google-sheets.md) · [Despliegue Render](13-despliegue-render.md)
