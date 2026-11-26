import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CarritoService } from '../../servicios/carrito.service';
import { clp, imagenProducto } from '../../util/formato';

@Component({
  selector: 'app-carrito',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="page-head">
      <h1>Tu carrito</h1>
      <span class="sub" *ngIf="carritoService.items.length > 0">{{ unidades }} {{ unidades === 1 ? 'artículo' : 'artículos' }}</span>
    </div>

    <p *ngIf="carritoService.error" class="alert" role="alert">{{ carritoService.error }}</p>

    <div class="empty" *ngIf="carritoService.items.length === 0">
      <img src="img/repuesto.svg" alt="">
      <h3>Tu carrito está vacío</h3>
      <p>Agrega repuestos de motor, frenos o eléctrico desde el catálogo.</p>
      <a routerLink="/" class="btn btn-primary btn-lg">Ir al catálogo</a>
    </div>

    <div class="cart-layout" *ngIf="carritoService.items.length > 0">
      <div class="cart-list">
        <article class="cart-item" *ngFor="let item of carritoService.items">
          <img class="thumb" [src]="imagen(item.nombre)" alt="">
          <div class="ci-info">
            <h3><a [routerLink]="['/producto', item.productoId]">{{ item.nombre }}</a></h3>
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

        <!-- Envío -->
        <div class="card-box opciones">
          <h3>Despacho</h3>
          <div class="envios" role="radiogroup" aria-label="Tipo de despacho">
            <label class="envio" *ngFor="let e of envios" [class.sel]="r?.tipoEnvio === e.tipo">
              <input type="radio" name="envio" [value]="e.tipo" [checked]="r?.tipoEnvio === e.tipo"
                     (change)="carritoService.elegirEnvio(e.tipo)">
              <span class="envio-t">{{ e.nombre }}</span>
              <span class="envio-d">{{ e.detalle }}</span>
              <strong>{{ e.costo === 0 ? 'Gratis' : clp(e.costo) }}</strong>
            </label>
          </div>
        </div>

        <!-- Cupón -->
        <div class="card-box opciones">
          <h3>Cupón de descuento</h3>
          <div class="cupon" *ngIf="!r?.cupon">
            <input type="text" [(ngModel)]="codigo" placeholder="BIENVENIDA10" aria-label="Código de cupón"
                   (keyup.enter)="aplicar()" style="text-transform: uppercase">
            <button class="btn btn-dark" (click)="aplicar()" [disabled]="!codigo.trim() || aplicando">Aplicar</button>
          </div>
          <div class="cupon-ok" *ngIf="r?.cupon">
            <span><strong>{{ r?.cupon }}</strong> · {{ r?.descripcionCupon }}</span>
            <button class="btn btn-outline" (click)="carritoService.quitarCupon()">Quitar</button>
          </div>
          <p class="alert" *ngIf="errorCupon" role="alert">{{ errorCupon }}</p>
          <p class="note">Prueba: BIENVENIDA10 (10%), FRENOS15 (15% sobre $50.000), ENVIOGRATIS.</p>
        </div>
      </div>

      <aside class="summary">
        <h3>Resumen</h3>
        <div class="summary-row"><span>Subtotal</span><span>{{ clp(r?.subtotal ?? 0) }}</span></div>
        <div class="summary-row desc-row" *ngIf="(r?.descuento ?? 0) > 0"><span>Descuento</span><span>−{{ clp(r?.descuento ?? 0) }}</span></div>
        <div class="summary-row"><span>Despacho</span><span>{{ (r?.costoEnvio ?? 0) === 0 ? 'Gratis' : clp(r?.costoEnvio ?? 0) }}</span></div>
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
  codigo = '';
  errorCupon = '';
  aplicando = false;

  readonly envios = [
    { tipo: 'RETIRO', nombre: 'Retiro en tienda', detalle: 'Listo en 2 horas', costo: 0 },
    { tipo: 'ESTANDAR', nombre: 'Estándar', detalle: '2 a 4 días hábiles', costo: 3990 },
    { tipo: 'EXPRESS', nombre: 'Express', detalle: 'Mañana antes de las 14:00', costo: 6990 }
  ];

  constructor(public carritoService: CarritoService) {}

  get r() { return this.carritoService.resumen; }

  get unidades(): number {
    return this.carritoService.items.reduce((t, i) => t + i.cantidad, 0);
  }

  ngOnInit(): void {
    this.carritoService.cargar();
  }

  aplicar(): void {
    this.aplicando = true;
    this.carritoService.aplicarCupon(this.codigo.trim(), error => {
      this.errorCupon = error;
      this.aplicando = false;
      if (!error) this.codigo = '';
    });
  }
}
