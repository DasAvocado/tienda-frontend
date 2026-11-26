import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ApiService, Producto, mensajeError } from '../../servicios/api.service';
import { CarritoService } from '../../servicios/carrito.service';
import { RecomendacionesComponent } from '../recomendaciones/recomendaciones.component';
import { clp, imagenProducto } from '../../util/formato';

/** Detalle de producto. Al abrirlo, ms-catalogo publica PRODUCTO_VISTO en Kafka (pedidos360.navegacion). */
@Component({
  selector: 'app-producto-detalle',
  standalone: true,
  imports: [CommonModule, RouterModule, RecomendacionesComponent],
  template: `
    <a routerLink="/" class="back">← Volver al catálogo</a>
    <p *ngIf="error" class="alert" role="alert">{{ error }}</p>
    <div class="skeleton detail-skeleton" *ngIf="!producto && !error"></div>

    <article class="detail" *ngIf="producto">
      <div class="detail-media"><img [src]="imagen(producto.nombre)" [alt]="producto.nombre"></div>
      <div class="detail-info">
        <span class="eyebrow">{{ producto.categoria || 'Repuesto' }}</span>
        <h1>{{ producto.nombre }}</h1>
        <p class="desc">{{ producto.descripcion }}</p>
        <span class="price big">{{ clp(producto.precio) }}</span>
        <span class="chip" [ngClass]="producto.stock <= 0 ? 'out' : producto.stock <= 10 ? 'low' : 'ok'">
          {{ producto.stock <= 0 ? 'Sin stock' : producto.stock + ' disponibles' }}
        </span>
        <button class="btn btn-primary btn-lg" [disabled]="producto.stock <= 0" (click)="agregar()">Añadir al carrito</button>
        <p class="sub" *ngIf="agregado">Añadido. <a routerLink="/carrito">Ver carrito</a></p>
      </div>
    </article>

    <app-recomendaciones *ngIf="producto" #recs titulo="También te puede interesar" [excluir]="producto.id"></app-recomendaciones>
  `
})
export class ProductoDetalleComponent implements OnInit {
  producto: Producto | null = null;
  error = '';
  agregado = false;
  clp = clp;
  imagen = imagenProducto;

  @ViewChild('recs') recs?: RecomendacionesComponent;

  constructor(private route: ActivatedRoute, private api: ApiService, private carrito: CarritoService) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(p => {
      const id = Number(p.get('id'));
      this.producto = null;
      this.agregado = false;
      this.api.getProducto(id).subscribe({
        next: prod => {
          this.producto = prod;
          setTimeout(() => this.recs?.cargar(700));   // da tiempo al consumidor Kafka
        },
        error: e => this.error = mensajeError(e)
      });
    });
  }

  agregar(): void {
    if (!this.producto) return;
    this.carrito.agregar(this.producto);
    this.agregado = true;
  }
}
