import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CarritoService } from '../../servicios/carrito.service';
import { ApiService, Producto, mensajeError } from '../../servicios/api.service';
import { MsalService } from '@azure/msal-angular';
import { clp, imagenProducto } from '../../util/formato';

@Component({
  selector: 'app-pauperrimos',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="hero">
      <div class="hero-copy">
        <span class="eyebrow">Repuestos automotrices</span>
        <h1>Tu auto en marcha,<br><em>sin gastar de más</em></h1>
        <p>Filtros, frenos y baterías al precio justo. Compra con tu cuenta Microsoft y sigue el estado de tus órdenes.</p>
        <button *ngIf="estaAutenticado" class="btn btn-primary btn-lg" (click)="irAlCatalogo()">Ver catálogo</button>
        <button *ngIf="!estaAutenticado" class="btn btn-primary btn-lg" (click)="iniciarSesion()">Iniciar sesión para comprar</button>
      </div>
      <div class="hero-art" aria-hidden="true">
        <img class="hero-gear" src="img/gear.svg" alt="">
        <img class="hero-p p2" src="img/frenos.svg" alt="">
        <img class="hero-p p1" src="img/bateria.svg" alt="">
        <img class="hero-p p3" src="img/filtro-aceite.svg" alt="">
      </div>
    </section>

    <section class="features" aria-label="Ventajas">
      <div class="feature">
        <span class="feature-icon" aria-hidden="true">🔒</span>
        <div><h3>Compra segura</h3><p>Inicio de sesión corporativo con Microsoft y validación de token en cada paso.</p></div>
      </div>
      <div class="feature">
        <span class="feature-icon" aria-hidden="true">📦</span>
        <div><h3>Stock al día</h3><p>El inventario se descuenta automáticamente cuando se confirma tu orden.</p></div>
      </div>
      <div class="feature">
        <span class="feature-icon" aria-hidden="true">✉️</span>
        <div><h3>Confirmación por correo</h3><p>Recibes el detalle de tu compra apenas la orden queda registrada.</p></div>
      </div>
    </section>

    <section id="catalogo">
      <div class="section-head">
        <h2>Catálogo</h2>
        <span class="count" *ngIf="catalogo.length">{{ catalogo.length }} productos</span>
      </div>

      <div *ngIf="!estaAutenticado" class="panel-login">
        <h3>Inicia sesión para ver los productos</h3>
        <p>Usamos tu cuenta Microsoft para proteger el catálogo y tu carrito.</p>
        <button class="btn btn-dark btn-lg" (click)="iniciarSesion()">Iniciar sesión</button>
      </div>

      <p *ngIf="error" class="alert" role="alert">{{ error }}</p>
      <p *ngIf="carritoService.error" class="alert" role="alert">{{ carritoService.error }}</p>

      <div class="grid" *ngIf="cargando">
        <div class="skeleton" *ngFor="let s of [1, 2, 3]"></div>
      </div>

      <div class="grid" *ngIf="estaAutenticado && !cargando">
        <article class="product" *ngFor="let producto of catalogo">
          <div class="product-media">
            <img [src]="imagen(producto.nombre)" [alt]="producto.nombre" loading="lazy">
            <span class="chip" [ngClass]="claseStock(producto)">{{ textoStock(producto) }}</span>
          </div>
          <div class="product-body">
            <h3>{{ producto.nombre }}</h3>
            <p class="desc">{{ producto.descripcion }}</p>
            <div class="product-foot">
              <span class="price">{{ clp(producto.precio) }}</span>
              <button class="btn btn-primary" (click)="agregarAlCarrito(producto)" [disabled]="producto.stock <= 0">
                {{ producto.stock <= 0 ? 'Sin stock' : 'Añadir' }}
              </button>
            </div>
          </div>
        </article>
      </div>
    </section>

    <div class="toast" *ngIf="toast" role="status">{{ toast }}</div>
  `
})
export class PauperrimosComponent implements OnInit {
  catalogo: Producto[] = [];
  cargando = false;
  error = '';
  toast = '';

  clp = clp;
  imagen = imagenProducto;

  constructor(
    public carritoService: CarritoService,
    private authService: MsalService,
    private api: ApiService
  ) {}

  get estaAutenticado(): boolean {
    return this.authService.instance.getAllAccounts().length > 0;
  }

  ngOnInit(): void {
    if (this.estaAutenticado) {
      this.cargar();
    }
  }

  cargar(): void {
    this.cargando = true;
    this.error = '';
    this.api.getCatalogo().subscribe({
      next: productos => { this.catalogo = productos; this.cargando = false; },
      error: e => { this.error = mensajeError(e); this.cargando = false; }
    });
  }

  agregarAlCarrito(producto: Producto): void {
    if (this.estaAutenticado) {
      this.carritoService.agregar(producto);
      this.mostrarToast(`${producto.nombre} añadido al carrito`);
    }
  }

  iniciarSesion(): void {
    this.authService.loginRedirect();
  }

  irAlCatalogo(): void {
    document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' });
  }

  claseStock(p: Producto): string {
    return p.stock <= 0 ? 'out' : p.stock <= 10 ? 'low' : 'ok';
  }

  textoStock(p: Producto): string {
    if (p.stock <= 0) return 'Sin stock';
    return p.stock <= 10 ? `Quedan ${p.stock}` : 'Disponible';
  }

  private mostrarToast(texto: string): void {
    this.toast = texto;
    setTimeout(() => this.toast = '', 2200);
  }
}
