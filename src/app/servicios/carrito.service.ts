import { Injectable } from '@angular/core';
import { ApiService, ItemCarrito, ResumenCarrito, mensajeError } from './api.service';

/**
 * El carrito vive en ms-carrito (privado por usuario). Este servicio mantiene una copia local
 * (`items` y `resumen`) para que las vistas la lean directamente, y sincroniza cada cambio con el backend.
 * Los totales (descuento del cupón, envío) los calcula SIEMPRE el backend.
 */
@Injectable({
  providedIn: 'root'
})
export class CarritoService {
  items: ItemCarrito[] = [];
  resumen: ResumenCarrito | null = null;
  error = '';

  constructor(private api: ApiService) {}

  cargar(): void {
    this.api.getResumen().subscribe({
      next: r => this.aplicar(r),
      error: e => this.error = mensajeError(e)
    });
  }

  agregar(producto: { id: number; nombre: string; precio: number }): void {
    this.api.agregarItem({ productoId: producto.id, nombre: producto.nombre, precio: producto.precio, cantidad: 1 })
      .subscribe({ next: () => this.cargar(), error: e => this.error = mensajeError(e) });
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
    this.api.eliminarItem(item.id).subscribe({ next: () => this.cargar(), error: e => this.error = mensajeError(e) });
  }

  vaciar(): void {
    this.api.vaciarCarrito().subscribe({ next: () => this.cargar(), error: e => this.error = mensajeError(e) });
  }

  aplicarCupon(codigo: string, alTerminar: (error: string) => void): void {
    this.api.aplicarCupon(codigo).subscribe({
      next: r => { this.aplicar(r); alTerminar(''); },
      error: e => alTerminar(mensajeError(e))
    });
  }

  quitarCupon(): void {
    this.api.quitarCupon().subscribe({ next: r => this.aplicar(r), error: e => this.error = mensajeError(e) });
  }

  elegirEnvio(tipo: string): void {
    this.api.elegirEnvio(tipo).subscribe({ next: r => this.aplicar(r), error: e => this.error = mensajeError(e) });
  }

  /** Tras un pago aprobado, ms-carrito vacía el carrito de forma asíncrona (RabbitMQ). */
  limpiarLocal(): void {
    this.items = [];
    this.resumen = null;
  }

  obtenerTotal(): number {
    return this.resumen?.total ?? this.items.reduce((t, i) => t + i.precio * i.cantidad, 0);
  }

  private aplicar(r: ResumenCarrito): void {
    this.resumen = r;
    this.items = r.items;
    this.error = '';
  }

  private cambiarCantidad(item: ItemCarrito, cantidad: number): void {
    this.api.cambiarCantidad(item.id, cantidad).subscribe({ next: () => this.cargar(), error: e => this.error = mensajeError(e) });
  }
}
