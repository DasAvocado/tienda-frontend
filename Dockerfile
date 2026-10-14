# Frontend Pedidos360: compila Angular y lo sirve con nginx por HTTPS (MSAL exige HTTPS fuera de localhost).
# En una t3.micro (1 GB) crea swap antes de construir (ver README).
FROM node:22 AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npx ng build
# Certificado autofirmado (el navegador mostrara una advertencia la primera vez: "Avanzado" > "Continuar")
RUN mkdir -p /certs && openssl req -x509 -nodes -newkey rsa:2048 -days 365 \
      -subj "/CN=pedidos360" -keyout /certs/key.pem -out /certs/cert.pem

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /certs /etc/nginx/certs
COPY --from=build /app/dist/frontend-pedidos/browser /usr/share/nginx/html
EXPOSE 80 443
