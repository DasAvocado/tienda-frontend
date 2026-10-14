import { Configuration, BrowserCacheLocation } from '@azure/msal-browser';

// --- Microsoft Entra ID (Azure) ---------------------------------------------------------
export const AZURE_TENANT_ID = 'd276cca8-e687-4f20-8984-601387d11401';
export const AZURE_CLIENT_ID = '39a9591b-35f1-4165-8cf2-667a2c643920';

// --- API (unico punto de entrada a los microservicios) ----------------------------------
// En LOCAL (http://localhost:4200) las llamadas /api/... van al propio servidor de desarrollo, que las
// reenvia a los microservicios locales (ver proxy.conf.json). En la NUBE van al AWS API Gateway.
// Pega aqui la "Invoke URL" del API HTTP "menu-compra" (sin barra final).
const API_GATEWAY_URL = 'https://7ot0ksyhdg.execute-api.us-east-1.amazonaws.com';
export const esLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);
export const API_BASE_URL = esLocal ? window.location.origin : API_GATEWAY_URL;

export const msalConfig: Configuration = {
  auth: {
    clientId: AZURE_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${AZURE_TENANT_ID}`,
    // Se toma del origen actual: sirve igual en http://localhost:4200 y en https://<IP-ELASTICA>.
    // Ambas URIs (con "/" final) deben estar registradas en Azure > Autenticacion > Aplicacion de pagina unica.
    redirectUri: window.location.origin + '/',
    postLogoutRedirectUri: window.location.origin + '/'
  },
  cache: {
    cacheLocation: BrowserCacheLocation.LocalStorage
  }
};

export const protectedResources = {
  apiGateway: {
    baseUrl: API_BASE_URL,
    // MsalInterceptor adjunta el token solo a las peticiones que calcen con este patron.
    endpoint: `${API_BASE_URL}/api/*`,
    // Debe coincidir EXACTO con el ambito creado en Azure > Exponer una API.
    scopes: [`api://${AZURE_CLIENT_ID}/Menu-compra`]
  }
};
