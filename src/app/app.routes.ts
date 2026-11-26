import { Routes } from '@angular/router';
import { PauperrimosComponent } from './componentes/pauperrimos/pauperrimos.component';
import { CarritoComponent } from './componentes/carrito/carrito.component';
import { PagoComponent } from './componentes/pago/pago.component';
import { PagoResultadoComponent } from './componentes/pago/pago-resultado.component';
import { OrdenesComponent } from './componentes/ordenes/ordenes.component';
import { NotificacionesComponent } from './componentes/notificaciones/notificaciones.component';
import { ProductoDetalleComponent } from './componentes/producto/producto-detalle.component';
import { DashboardComponent } from './componentes/dashboard/dashboard.component';

export const routes: Routes = [
  { path: '', component: PauperrimosComponent },                 // Catálogo (Home) + recomendados
  { path: 'producto/:id', component: ProductoDetalleComponent }, // Detalle (evento Kafka PRODUCTO_VISTO)
  { path: 'carrito', component: CarritoComponent },              // Carrito con cupón y envío
  { path: 'pago', component: PagoComponent },                    // Webpay Plus o tarjeta simulada (ms-pagos)
  { path: 'pago/resultado', component: PagoResultadoComponent }, // Vuelta desde Webpay
  { path: 'ordenes', component: OrdenesComponent },              // Mis órdenes (ms-ordenes)
  { path: 'notificaciones', component: NotificacionesComponent },// Preferencias de correo (ms-notificaciones)
  { path: 'dashboard', component: DashboardComponent },          // Métricas en tiempo real (ADMIN, WebSocket)
  { path: '**', redirectTo: '' }
];
