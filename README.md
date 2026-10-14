# frontend-pedidos

Angular 21 + MSAL (login corporativo Microsoft Entra ID con Authorization Code + PKCE).
Llama a los microservicios **solo** a través del API Gateway (en local, a través del proxy de desarrollo).

## Ejecutar en local
Requisitos: Node 22 (≥ 20.19) y los microservicios corriendo en local (puertos 8081–8085).

```bash
npm ci
npm start            # http://localhost:4200  (usa proxy.conf.json → localhost:8081..8086)
```
En Azure debe estar registrada la redirect URI **`http://localhost:4200/`** (Aplicación de página única).

## Configuración
`src/app/auth-config.ts`: tenant, client id, scope (`api://<client-id>/Menu-compra`) y `API_GATEWAY_URL` (Invoke URL del API HTTP `menu-compra`, usada cuando el sitio NO corre en localhost).

## Desplegar en su instancia EC2 (Docker: Angular + nginx con HTTPS)
```bash
# 1) Una sola vez: swap (t3.micro tiene 1 GB) + Docker + git
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile
sudo dnf install -y docker git && sudo systemctl enable --now docker
sudo usermod -aG docker ec2-user      # luego cierra y abre la sesion SSH
# (si antes tenias nginx instalado directo en la instancia:  sudo systemctl disable --now nginx)
# 2) Clonar y levantar
git clone https://github.com/<tu-usuario>/frontend-pedidos.git && cd frontend-pedidos
docker compose up -d --build          # compila Angular y lo sirve en https://<IP-PUBLICA>/
# 3) Actualizar despues de un cambio
git pull && docker compose up -d --build
```
- Usa un certificado **autofirmado**: la primera vez el navegador avisa → *Configuración avanzada* → *Continuar*.
- Security Group: puertos **80 y 443** abiertos.
- La IP pública del frontend debe estar registrada en Azure (`https://<IP-PUBLICA>/`) y en el CORS del API Gateway (`https://<IP-PUBLICA>`). El código no necesita cambios: la redirect URI se toma del navegador.
- Si la instancia **no tiene IP elástica**, su IP cambia cada vez que se apaga/enciende: actualiza esas dos cosas (ver `docs/GUIA_AZURE_AWS.md`, sección "Cada vez que reinicies el laboratorio").

## Diseño e imágenes
- Tipografía: **Barlow Condensed** (títulos) + **Barlow** (texto), cargadas desde Google Fonts en `src/index.html` (necesita internet en el navegador; si no, usa fuentes del sistema).
- Estilos globales y colores: `src/styles.css` (variables en `:root`).
- Imágenes: ilustraciones SVG originales en `public/img/` (filtro, frenos, batería, repuesto, logo, engranaje). Para usar fotos reales de stock (p. ej. Unsplash/Pexels), guárdalas en `public/img/` y cambia los nombres en `src/app/util/formato.ts` (`imagenProducto`).
