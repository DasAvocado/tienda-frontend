import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CarritoService {
  items: any[] = [];

  agregar(producto: any): void {
    const itemExistente = this.items.find(item => item.id === producto.id);
    if (itemExistente) {
      itemExistente.cantidad++;
    } else {
      this.items = [...this.items, { ...producto, cantidad: 1 }];
    }
  }

  sumar(item: any): void { item.cantidad++; }

  restar(item: any): void {
    if (item.cantidad > 1) {
      item.cantidad--;
    } else {
      this.eliminar(item);
    }
  }

  eliminar(item: any): void {
    this.items = this.items.filter(p => p.id !== item.id);
  }

  vaciar(): void { this.items = []; }

  obtenerTotal(): number {
    return this.items.reduce((total, item) => total + (item.precio * item.cantidad), 0);
  }
}
