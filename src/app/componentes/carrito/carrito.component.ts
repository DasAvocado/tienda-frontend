import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CarritoService } from '../../servicios/carrito.service';

@Component({
  selector: 'app-carrito',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div style="padding: 20px; max-width: 800px; margin: 0 auto;">
      <h2>🛒 Tu Carrito</h2>

      <ul style="list-style-type: none; padding: 0;">
        <li *ngIf="carritoService.items.length === 0" style="color: #666; padding: 20px; text-align: center; background: #f9f9f9; border-radius: 8px;">
          El carrito está vacío. ¡Ve al catálogo y añade algo!
        </li>

        <li *ngFor="let item of carritoService.items" style="padding: 15px 10px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
          <span style="flex: 1;"><strong>{{ item.nombre }}</strong> (\${{ item.precio }})</span>

          <div style="display: flex; align-items: center; gap: 10px;">
            <button (click)="carritoService.restar(item)" style="padding: 5px 10px; cursor: pointer;">-</button>
            <span>{{ item.cantidad }}</span>
            <button (click)="carritoService.sumar(item)" style="padding: 5px 10px; cursor: pointer;">+</button>
            <button (click)="carritoService.eliminar(item)" style="background-color: #d13438; color: white; padding: 5px 10px; border: none; cursor: pointer; margin-left: 15px;">Eliminar</button>
          </div>

          <strong style="min-width: 100px; text-align: right;">\${{ item.precio * item.cantidad }}</strong>
        </li>
      </ul>

      <div *ngIf="carritoService.items.length > 0" style="text-align: right; margin-top: 20px; padding-top: 20px; border-top: 2px solid #ddd;">
        <button (click)="carritoService.vaciar()" style="background-color: #6c757d; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; margin-right: 15px;">Vaciar Carrito</button>
        <h3 style="display: inline-block; margin-right: 20px;">Total: \${{ carritoService.obtenerTotal() }}</h3>
        <a routerLink="/pago" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">
          Proceder al Pago
        </a>
      </div>
    </div>
  `
})
export class CarritoComponent {
  constructor(public carritoService: CarritoService) {}
}
