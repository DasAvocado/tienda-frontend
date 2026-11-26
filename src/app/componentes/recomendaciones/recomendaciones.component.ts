import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService, ProductoRecomendado } from '../../servicios/api.service';
import { CarritoService } from '../../servicios/carrito.service';
import { clp, imagenProducto } from '../../util/formato';

/** "Recomendados para ti": ms-recomendaciones analiza tu navegación reciente (eventos Kafka). */
@Component({
  selector: 'app-recomendaciones',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <section class="recs" *ngIf="productos.length > 0" aria-label="Recomendados para ti">
      <div class="section-head">
        <h2>{{ titulo }}</h2>
        <span class="count">según tu navegación</span>
      </div>
      <div class="recs-grid">
        <article class="rec" *ngFor="let r of productos">
          <a [routerLink]="['/producto', r.productoId]" class="rec-media">
            <img [src]="imagen(r.nombre)" [alt]="r.nombre" loading="lazy">
          </a>
          <div class="rec-body">
            <span class="rec-cat" *ngIf="r.categoria">{{ r.categoria }}</span>
            <a [routerLink]="['/producto', r.productoId]" class="rec-name">{{ r.nombre }}</a>
            <span class="rec-why">{{ r.motivo }}</span>
            <div class="rec-foot">
              <span class="price" *ngIf="r.precio">{{ clp(r.precio) }}</span>
              <button class="btn btn-outline" *ngIf="r.precio" (click)="agregar(r)">Añadir</button>
            </div>
          </div>
        </article>
      </div>
    </section>
  `
})
export class RecomendacionesComponent implements OnInit {
  @Input() titulo = 'Recomendados para ti';
  /** Producto que se está mirando (no se recomienda a sí mismo). */
  @Input() excluir?: number;

  productos: ProductoRecomendado[] = [];
  clp = clp;
  imagen = imagenProducto;

  constructor(private api: ApiService, private carrito: CarritoService) {}

  ngOnInit(): void {
    this.cargar();
  }

  /** Se vuelve a pedir con un pequeño retraso: el evento Kafka recién publicado tarda unos ms en procesarse. */
  cargar(retraso = 0): void {
    setTimeout(() => this.api.getRecomendaciones().subscribe({
      next: r => this.productos = r.productos.filter(p => p.productoId !== this.excluir),
      error: () => this.productos = []   // si el servicio no está, la tienda sigue funcionando
    }), retraso);
  }

  agregar(r: ProductoRecomendado): void {
    this.carrito.agregar({ id: r.productoId, nombre: r.nombre, precio: r.precio ?? 0 });
  }
}
