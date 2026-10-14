import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ApiService, CheckoutResponse, ItemCarrito, mensajeError } from './api.service';

/**
 * El carrito vive en ms-carrito (privado por usuario). Este servicio mantiene una copia local
 * (`items`) para que las vistas la lean directamente, y sincroniza cada cambio con el backend.
 */
@Injectable({
  providedIn: 'root'
})
export class CarritoService {
  items: ItemCarrito[] = [];
  error = '';

  constructor(private api: ApiService) {}

  cargar(): void {
    this.api.getCarrito().subscribe({
      next: items => { this.items = items; this.error = ''; },
      error: e => this.error = mensajeError(e)
    });
  }

  agregar(producto: { id: number; nombre: string; precio: number }): void {
    this.api.agregarItem({
      productoId: producto.id,
      nombre: producto.nombre,
      precio: producto.precio,
      cantidad: 1
    }).subscribe({
      next: () => this.cargar(),
      error: e => this.error = mensajeError(e)
    });
  }

  sumar(item: ItemCarrito): void { this.cambiarCantidad(item, item.cantidad + 1); }

  restar(item: ItemCarrito): void {
    if (item.cantidad > 1) {
      this.cambiarCantidad(item, item.cantidad - 1);
    } else {
      this.eliminar(item);
    }
  }

  eliminar(item: ItemCarrito): void {
    this.api.eliminarItem(item.id).subscribe({
      next: () => this.items = this.items.filter(p => p.id !== item.id),
      error: e => this.error = mensajeError(e)
    });
  }

  vaciar(): void {
    this.api.vaciarCarrito().subscribe({
      next: () => this.items = [],
      error: e => this.error = mensajeError(e)
    });
  }

  /** Confirma la compra: ms-carrito publica el evento en RabbitMQ y vacia el carrito. */
  checkout(): Observable<CheckoutResponse> {
    return this.api.checkout().pipe(tap(() => this.items = []));
  }

  obtenerTotal(): number {
    return this.items.reduce((total, item) => total + (item.precio * item.cantidad), 0);
  }

  private cambiarCantidad(item: ItemCarrito, cantidad: number): void {
    this.api.cambiarCantidad(item.id, cantidad).subscribe({
      next: actualizado => item.cantidad = actualizado.cantidad,
      error: e => this.error = mensajeError(e)
    });
  }
}
