# Despliegue del backend LaboraGT en Render

## Opción A — Con Blueprint (recomendado)

1. Entra a [https://dashboard.render.com](https://dashboard.render.com)
2. **New** → **Blueprint**
3. Conecta el repositorio `jaurruti07/LABORAGT`
4. Render detectará `render.yaml` y creará el servicio `laboragt-api`
5. Confirma y espera el deploy (~2–5 min)

URL típica: `https://laboragt-api.onrender.com`

## Opción B — Manual

1. **New** → **Web Service**
2. Conecta el repo `jaurruti07/LABORAGT`
3. Configura:
   - **Root Directory:** `backend`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Health Check Path:** `/health`
4. Variables de entorno:

| Variable | Valor |
|----------|--------|
| `NODE_ENV` | `production` |
| `JWT_SECRET` | (generar secreto largo) |
| `JWT_EXPIRES_IN` | `30m` |
| `CORS_ORIGIN` | `https://jaurruti07.github.io` |

5. Deploy

## Verificar

```bash
curl https://TU-SERVICIO.onrender.com/health
```

## Conectar el frontend (GitHub Pages)

```
https://jaurruti07.github.io/LABORAGT/frontend/?api=https://TU-SERVICIO.onrender.com
https://jaurruti07.github.io/LABORAGT/admin/?api=https://TU-SERVICIO.onrender.com
```

La URL se guarda en localStorage para las siguientes visitas.

## Credenciales demo

| Rol | Código | Activación |
|-----|--------|------------|
| Colaborador | `EMP-001` | `ACT-2026` |
| Jefe | `EMP-002` | `ACT-2026` |

## Notas del plan Free

- El servicio se duerme tras ~15 min sin tráfico (cold start 30–60 s).
- Los datos mock se reinician al reiniciar el proceso.
