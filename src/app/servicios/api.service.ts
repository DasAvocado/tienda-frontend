import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { esLocal, protectedResources } from '../auth-config';

export interface Producto {
  id: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  stock: number;
}

export interface ItemCarrito {
  id: number;
  productoId: number;
  nombre: string;
  precio: number;
  cantidad: number;
}

export interface CheckoutResponse {
  estado: string;
  mensaje: string;
  total: number;
}

export interface Orden {
  id: number;
  estado: string;
  total: number;
  fecha: string;
  items: { productoId: number; nombre: string; precio: number; cantidad: number }[];
}

/** Preferencias de la opción "Notificaciones" (ms-notificaciones). */
export interface PreferenciaNotificacion {
  email: string;        // correo con el que se inició sesión
  destino: string;      // casilla a la que realmente se envía
  correoCompra: boolean;
  modoEnvio: 'SMTP' | 'SIMULADO';
}

export interface NotificacionResponse {
  estado: string;       // ENVIADO | SIMULADO | ERROR
  destinatario: string;
  asunto: string;
  detalle: string;
}

/** Traduce un error HTTP a un mensaje legible para el usuario. */
export function mensajeError(e: unknown): string {
  const err = e as HttpErrorResponse;
  if (err?.status === 0) {
    return esLocal
      ? 'Sin respuesta del servidor local: ejecuta el frontend con "npm start" (usa el proxy) y revisa que los microservicios estén corriendo.'
      : 'Sin conexión con el API Gateway (revisa la URL, CORS o que el servicio esté arriba).';
  }
  if (err?.status === 502 || err?.status === 503 || err?.status === 504 || (err?.status === 500 && esLocal)) {
    return 'El microservicio no responde (¿está corriendo? ¿Postgres y RabbitMQ arriba?). Revisa su consola.';
  }
  if (err?.status === 401) return 'Sesión no válida o token rechazado (401). Vuelve a iniciar sesión.';
  if (err?.status === 403) return 'No tienes permisos para esta acción (403): falta el rol o el scope.';
  if (err?.status === 400 && (err.error?.mensaje || err.error?.message)) return err.error.mensaje ?? err.error.message;
  return `Error ${err?.status ?? ''} al llamar al servidor.`;
}

/**
 * Todas las llamadas pasan por el API Gateway. El token JWT lo adjunta
 * automaticamente MsalInterceptor (ver app.config.ts).
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly base = protectedResources.apiGateway.baseUrl;

  constructor(private http: HttpClient) {}

  // ms-catalogo
  getCatalogo(): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${this.base}/api/catalogo`);
  }

  // ms-carrito
  getCarrito(): Observable<ItemCarrito[]> {
    return this.http.get<ItemCarrito[]>(`${this.base}/api/carrito`);
  }
  agregarItem(item: { productoId: number; nombre: string; precio: number; cantidad: number }): Observable<ItemCarrito> {
    return this.http.post<ItemCarrito>(`${this.base}/api/carrito/items`, item);
  }
  cambiarCantidad(id: number, cantidad: number): Observable<ItemCarrito> {
    return this.http.put<ItemCarrito>(`${this.base}/api/carrito/items/${id}`, { cantidad });
  }
  eliminarItem(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/api/carrito/items/${id}`);
  }
  vaciarCarrito(): Observable<void> {
    return this.http.delete<void>(`${this.base}/api/carrito/items`);
  }
  checkout(): Observable<CheckoutResponse> {
    return this.http.post<CheckoutResponse>(`${this.base}/api/carrito/checkout`, {});
  }

  // ms-ordenes
  getMisOrdenes(): Observable<Orden[]> {
    return this.http.get<Orden[]>(`${this.base}/api/ordenes`);
  }

  // ms-notificaciones (el correo se toma del token en el backend, nunca se envía desde aquí)
  getPreferencias(): Observable<PreferenciaNotificacion> {
    return this.http.get<PreferenciaNotificacion>(`${this.base}/api/notificaciones/preferencias`);
  }
  guardarPreferencias(correoCompra: boolean): Observable<PreferenciaNotificacion> {
    return this.http.put<PreferenciaNotificacion>(`${this.base}/api/notificaciones/preferencias`, { correoCompra });
  }
  enviarCorreoPrueba(): Observable<NotificacionResponse> {
    return this.http.post<NotificacionResponse>(`${this.base}/api/notificaciones/preferencias/prueba`, {});
  }
}
