import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CarritoService } from '../../servicios/carrito.service';
import { clp, imagenProducto } from '../../util/formato';

@Component({
  selector: 'app-carrito',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="page-head">
      <h1>Tu carrito</h1>
      <span class="sub" *ngIf="carritoService.items.length > 0">{{ unidades }} {{ unidades === 1 ? 'artículo' : 'artículos' }}</span>
    </div>

    <p *ngIf="carritoService.error" class="alert" role="alert">{{ carritoService.error }}</p>

    <div class="empty" *ngIf="carritoService.items.length === 0">
      <img src="img/repuesto.svg" alt="">
      <h3>Tu carrito está vacío</h3>
      <p>Agrega filtros, frenos o baterías desde el catálogo.</p>
      <a routerLink="/" class="btn btn-primary btn-lg">Ir al catálogo</a>
    </div>

    <div class="cart-layout" *ngIf="carritoService.items.length > 0">
      <div class="cart-list">
        <article class="cart-item" *ngFor="let item of carritoService.items">
          <img class="thumb" [src]="imagen(item.nombre)" alt="">
          <div class="ci-info">
            <h3>{{ item.nombre }}</h3>
            <span class="unit">{{ clp(item.precio) }} c/u</span>
          </div>
          <div class="qty">
            <button (click)="carritoService.restar(item)" aria-label="Quitar una unidad">−</button>
            <span>{{ item.cantidad }}</span>
            <button (click)="carritoService.sumar(item)" aria-label="Agregar una unidad">+</button>
          </div>
          <strong class="ci-total">{{ clp(item.precio * item.cantidad) }}</strong>
          <button class="icon-btn" (click)="carritoService.eliminar(item)" aria-label="Eliminar del carrito">✕</button>
        </article>
      </div>

      <aside class="summary">
        <h3>Resumen</h3>
        <div class="summary-row"><span>Subtotal</span><span>{{ clp(carritoService.obtenerTotal()) }}</span></div>
        <div class="summary-row"><span>Despacho</span><span>Por definir</span></div>
        <div class="summary-row total"><span>Total</span><strong>{{ clp(carritoService.obtenerTotal()) }}</strong></div>
        <a routerLink="/pago" class="btn btn-primary btn-lg btn-block">Proceder al pago</a>
        <button class="btn btn-outline btn-block" (click)="carritoService.vaciar()">Vaciar carrito</button>
      </aside>
    </div>
  `
})
export class CarritoComponent implements OnInit {
  clp = clp;
  imagen = imagenProducto;

  constructor(public carritoService: CarritoService) {}

  get unidades(): number {
    return this.carritoService.items.reduce((t, i) => t + i.cantidad, 0);
  }

  ngOnInit(): void {
    this.carritoService.cargar();
  }
}
