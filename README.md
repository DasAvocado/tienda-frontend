# frontend-pedidos

Angular 21 + MSAL (login corporativo Microsoft Entra ID con Authorization Code + PKCE).
Llama a los microservicios **solo** a través del API Gateway (en local, a través del proxy de desarrollo).

## Ejecutar en local
Requisitos: Node 22 (≥ 20.19) y los microservicios corriendo en local (puertos 8081–8085).

```bash
npm ci
npm start            # http://localhost:4200  (usa proxy.conf.json → localhost:8081..8085)
```
En Azure debe estar registrada la redirect URI **`http://localhost:4200/`** (Aplicación de página única).

## Configuración
`src/app/auth-config.ts`: tenant, client id, scope (`api://<client-id>/Menu-compra`) y `API_GATEWAY_URL` (Invoke URL del API HTTP `menu-compra`, usada cuando el sitio NO corre en localhost).

## Desplegar en su instancia EC2
```bash
npm ci && npx ng build          # genera dist/frontend-pedidos/browser
# copiar el contenido de dist/frontend-pedidos/browser a la raiz de nginx (p. ej. /usr/share/nginx/html)
```
nginx debe devolver `index.html` para rutas como `/carrito` o `/ordenes`:
```nginx
location / { try_files $uri $uri/ /index.html; }
```
MSAL exige HTTPS (salvo localhost). Registrar en Azure `https://<IP-ELASTICA>/` y ponerla en el CORS del API Gateway.

## Diseño e imágenes
- Tipografía: **Barlow Condensed** (títulos) + **Barlow** (texto), cargadas desde Google Fonts en `src/index.html` (necesita internet en el navegador; si no, usa fuentes del sistema).
- Estilos globales y colores: `src/styles.css` (variables en `:root`).
- Imágenes: ilustraciones SVG originales en `public/img/` (filtro, frenos, batería, repuesto, logo, engranaje). Para usar fotos reales de stock (p. ej. Unsplash/Pexels), guárdalas en `public/img/` y cambia los nombres en `src/app/util/formato.ts` (`imagenProducto`).
