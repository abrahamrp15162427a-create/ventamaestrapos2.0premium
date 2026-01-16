# VentaMaestra 2.0 — Web + POS (real)

Este proyecto incluye:
- Landing (HTML/CSS/JS)
- App real con backend (Node/Express) + sesiones + APIs (`/api/*`)
- PWA (instalable) con `manifest.webmanifest` + `sw.js`

## Ejecutar en tu PC (local)

No abras con doble click (file://), porque el login/POS real necesita servidor.

### Servidor local con Node.js (Windows)

Si tienes Node.js instalado:

```bash
npm install
npm run dev
```

Luego abre:

- El puerto exacto lo imprime la terminal (ej: `http://localhost:5600`)
- Login: `/login.html`
- Panel: `/admin.html`
- POS: `/pos.html`

Credenciales iniciales (seed):
- Email: `abrahamreyesperez804@gmail.com`
- Password: `123456789`

## Instalar como app (PWA)

- En Chrome/Edge abre `http://localhost:PUERTO/login.html`
- Menú ⋯ → Instalar aplicación

Nota: Para instalar desde otra PC/celular por red necesitas HTTPS (o usar `localhost`).

## Publicar como página web (HTTPS)

Tienes 2 caminos:

### A) Publicar “landing” solamente (sin POS real)
Usa Netlify o GitHub Pages (solo estático). Esto NO incluye login/ventas reales.

### B) Publicar la app completa (POS real)
Recomendado usar un hosting que corra Node/Express.

Opción 1 (simple): Render.com con Docker
1) Sube este repo a GitHub.
2) En Render: New → Blueprint → selecciona el repo.
3) Render detecta `render.yaml` + `Dockerfile` y despliega.
4) Te dará una URL `https://...` (ahí ya podrás instalar la PWA en PC/celular).

Importante sobre datos:
- Ahora guardamos datos en `data/store.json`.
- En muchos hostings el filesystem es efímero (se borra al reiniciar).
- Para producción real conviene: disco persistente del hosting o migrar a una base de datos.

Opción 2 (rápida para compartir): túnel HTTPS (temporal)
- `npx localtunnel --port PUERTO`
- Te da un `https://...` que puedes abrir/instalar en celular.

## Subir a Git / GitHub

Este repo ya incluye `.gitignore` para NO subir:
- `node_modules/`
- `data/store.json` (tus ventas/clientes reales)

Si quieres llevar datos a otra PC, copia `data/store.json` manualmente por USB/Drive.

### Comandos (PowerShell)

1) Inicializa Git:

```powershell
git init
git add .
git commit -m "VentaMaestra 2.0"
```

2) Crea un repo en GitHub (vacío) y conecta el remoto:

```powershell
git branch -M main
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git push -u origin main
```

- Textos y secciones: `index.html`
- Colores/estilos: `styles.css` (variables CSS en `:root`)
- Menú móvil y formulario: `app.js`

## Personalización rápida

- Landing: `index.html`
- Estilos: `styles.css`
- Interacciones (tema/menú): `app.js`

Contacto (landing): abre `mailto:`. Cambia el destinatario en `app.js`.
