import { Configuration, BrowserCacheLocation } from '@azure/msal-browser';

export const msalConfig: Configuration = {
  auth: {
    clientId: '39a9591b-35f1-4165-8cf2-667a2c643920',
    authority: 'https://login.microsoftonline.com/d276cca8-e687-4f20-8984-601387d11401',
    redirectUri: 'https://184.73.48.53/'
  },
  cache: {
    cacheLocation: BrowserCacheLocation.LocalStorage
  }
};

export const protectedResources = {
  apiGateway: {
    endpoint: 'https://7ot0ksyhdg.execute-api.us-east-1.amazonaws.com/',
    scopes: ['api://39a9591b-35f1-4165-8cf2-667a2c643920/Pedidos.Access']
  }
};
