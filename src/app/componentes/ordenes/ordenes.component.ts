import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService, Orden, mensajeError } from '../../servicios/api.service';
import { clp, imagenProducto } from '../../util/formato';

@Component({
  selector: 'app-ordenes',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="page-head">
      <h1>Mis órdenes</h1>
      <span class="sub" *ngIf="ordenes.length">{{ ordenes.length }} {{ ordenes.length === 1 ? 'orden' : 'órdenes' }}</span>
    </div>

    <p *ngIf="cargando" class="loading">Cargando tus órdenes…</p>
    <p *ngIf="error" class="alert" role="alert">{{ error }}</p>

    <div class="empty" *ngIf="!cargando && !error && ordenes.length === 0">
      <img src="img/repuesto.svg" alt="">
      <h3>Aún no tienes órdenes</h3>
      <p>Cuando completes una compra, aparecerá aquí.</p>
      <a routerLink="/" class="btn btn-primary btn-lg">Ir al catálogo</a>
    </div>

    <div class="orders">
      <article class="order" *ngFor="let o of ordenes">
        <div class="order-head">
          <div>
            <h3>Orden #{{ o.id }}</h3>
            <span class="order-date">{{ o.fecha | date: 'dd/MM/yyyy HH:mm' }}</span>
          </div>
          <span class="status">{{ o.estado === 'CREADA' ? 'Confirmada' : o.estado }}</span>
        </div>
        <div class="order-items">
          <div class="mini-item" *ngFor="let i of o.items">
            <img class="thumb" [src]="imagen(i.nombre)" alt="">
            <span class="n">{{ i.nombre }} <span class="unit">× {{ i.cantidad }}</span></span>
            <strong>{{ clp(i.precio * i.cantidad) }}</strong>
          </div>
        </div>
        <div class="order-total">Total<strong>{{ clp(o.total) }}</strong></div>
      </article>
    </div>
  `
})
export class OrdenesComponent implements OnInit {
  ordenes: Orden[] = [];
  cargando = false;
  error = '';

  clp = clp;
  imagen = imagenProducto;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.cargando = true;
    this.api.getMisOrdenes().subscribe({
      next: o => { this.ordenes = o; this.cargando = false; },
      error: e => { this.error = mensajeError(e); this.cargando = false; }
    });
  }
}
