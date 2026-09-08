import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CarritoService } from '../../servicios/carrito.service';
import { MsalService } from '@azure/msal-angular';

@Component({
  selector: 'app-pauperrimos',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="padding: 20px;">
      <h2>Catálogo de Productos</h2>
      <div style="display: flex; gap: 20px; flex-wrap: wrap;">
        <div *ngFor="let producto of catalogo" style="border: 1px solid #ccc; padding: 15px; border-radius: 8px; width: 220px; background-color: #f9f9f9;">
          <h3>{{ producto.nombre }}</h3>
          <p style="font-size: 18px; font-weight: bold;">\${{ producto.precio }}</p>

          <button
            (click)="agregarAlCarrito(producto)"
            [disabled]="!estaAutenticado"
            [style.background-color]="estaAutenticado ? '#0078D4' : '#cccccc'"
            [style.cursor]="estaAutenticado ? 'pointer' : 'not-allowed'"
            style="padding: 10px; border: none; border-radius: 4px; color: white; width: 100%;">
            {{ estaAutenticado ? 'Añadir al carrito' : 'Inicia sesión para añadir' }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class PauperrimosComponent {
  catalogo = [
    { id: 1, nombre: 'Filtro de Aceite', precio: 15000 },
    { id: 2, nombre: 'Pastillas de Freno', precio: 45000 },
    { id: 3, nombre: 'Batería 12V', precio: 85000 }
  ];

  constructor(
    private carritoService: CarritoService,
    private authService: MsalService
  ) {}

  get estaAutenticado(): boolean {
    return this.authService.instance.getAllAccounts().length > 0;
  }

  agregarAlCarrito(producto: any): void {
    if (this.estaAutenticado) {
      this.carritoService.agregar(producto);
    }
  }
}
