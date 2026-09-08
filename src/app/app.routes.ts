import { Routes } from '@angular/router';
import { PauperrimosComponent } from './componentes/pauperrimos/pauperrimos.component';
import { CarritoComponent } from './componentes/carrito/carrito.component';
import { PagoComponent } from './componentes/pago/pago.component';

export const routes: Routes = [
  { path: '', component: PauperrimosComponent }, // Catálogo (Home)
  { path: 'carrito', component: CarritoComponent }, // Pestaña Carrito
  { path: 'pago', component: PagoComponent }, // Pantalla de Pago
  { path: '**', redirectTo: '' } // Redirige al inicio si la URL no existe
];
