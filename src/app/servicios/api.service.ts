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
  categoria?: string;
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
  pagoId?: number;
  metodoPago?: string;
  subtotal?: number;
  descuento?: number;
  costoEnvio?: number;
  cupon?: string;
  tipoEnvio?: string;
}

/** Totales calculados por ms-carrito (el monto a pagar sale de aquí). */
export interface ResumenCarrito {
  items: ItemCarrito[];
  subtotal: number;
  descuento: number;
  costoEnvio: number;
  total: number;
  cupon: string | null;
  descripcionCupon: string | null;
  tipoEnvio: 'RETIRO' | 'ESTANDAR' | 'EXPRESS';
}

/** ms-pagos */
export interface Pago {
  id: number;
  estado: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO' | 'BLOQUEADO_FRAUDE' | 'ANULADO';
  metodo: 'TARJETA_SIMULADA' | 'WEBPAY';
  monto: number;
  tarjeta: string | null;
  codigoAutorizacion: string | null;
  detalle: string | null;
  creado: string;
}

export interface WebpayInicio {
  pagoId: number;
  token: string;
  url: string;
}

/** ms-recomendaciones */
export interface ProductoRecomendado {
  productoId: number;
  nombre: string;
  categoria: string | null;
  precio: number | null;
  puntaje: number;
  motivo: string;
}

export interface Metricas {
  generado: string;
  clicksUltimoMinuto: number;
  clicksPorMinuto: { minuto: string; clicks: number }[];
  topProductos: { productoId: number; nombre: string; vistas: number }[];
  eventosPorTipo: Record<string, number>;
  pagos: { aprobados: number; rechazados: number; bloqueados: number; anulados: number; montoAprobado: number };
  alertasFraude: number;
  ultimasAlertas: { fecha: string; usuarioId: string; tarjeta: string; intentos: number; monto: number }[];
  ordenesCreadas: number;
  ventasTotales: number;
  correosEnviados: number;
  usuariosActivos: number;
  totalEventos: number;
  almacenamiento: string;
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
  if ([400, 402, 409, 423].includes(err?.status) && (err.error?.mensaje || err.error?.message || err.error?.detalle)) {
    return err.error.mensaje ?? err.error.detalle ?? err.error.message;
  }
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
  getResumen(): Observable<ResumenCarrito> {
    return this.http.get<ResumenCarrito>(`${this.base}/api/carrito/resumen`);
  }
  aplicarCupon(codigo: string): Observable<ResumenCarrito> {
    return this.http.post<ResumenCarrito>(`${this.base}/api/carrito/cupon`, { codigo });
  }
  quitarCupon(): Observable<ResumenCarrito> {
    return this.http.delete<ResumenCarrito>(`${this.base}/api/carrito/cupon`);
  }
  elegirEnvio(tipo: string): Observable<ResumenCarrito> {
    return this.http.put<ResumenCarrito>(`${this.base}/api/carrito/envio`, { tipo });
  }

  // ms-catalogo: detalle (publica PRODUCTO_VISTO en Kafka)
  getProducto(id: number): Observable<Producto> {
    return this.http.get<Producto>(`${this.base}/api/catalogo/${id}`);
  }

  // ms-pagos
  pagarConTarjeta(datos: { numero: string; vencimiento: string; cvv: string; titular: string; monto: number }): Observable<Pago> {
    return this.http.post<Pago>(`${this.base}/api/pagos/tarjeta`, datos);
  }
  iniciarWebpay(monto: number): Observable<WebpayInicio> {
    return this.http.post<WebpayInicio>(`${this.base}/api/pagos/webpay/iniciar`, { monto, returnOrigin: window.location.origin });
  }
  getPago(id: number): Observable<Pago> {
    return this.http.get<Pago>(`${this.base}/api/pagos/${id}`);
  }

  // ms-recomendaciones
  getRecomendaciones(): Observable<{ usuarioId: string; productos: ProductoRecomendado[]; fecha: string }> {
    return this.http.get<{ usuarioId: string; productos: ProductoRecomendado[]; fecha: string }>(`${this.base}/api/recomendaciones`);
  }
  getMetricas(): Observable<Metricas> {
    return this.http.get<Metricas>(`${this.base}/api/recomendaciones/metricas`);
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
