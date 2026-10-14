import { Component, OnInit, ChangeDetectorRef, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule } from '@angular/router';
import { MsalService, MsalBroadcastService } from '@azure/msal-angular';
import { EventMessage, EventType } from '@azure/msal-browser';
import { filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CarritoService } from './servicios/carrito.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule],
  template: `
    <header class="topbar">
      <div class="topbar-inner">
        <a routerLink="/" class="brand" aria-label="Pauperrimos, ir al inicio">
          <img src="img/logo.svg" alt="" class="brand-mark" width="36" height="36">
          <span class="brand-name">PAUPÉRRIMOS</span>
        </a>

        <nav class="nav" aria-label="Principal">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Inicio</a>
          <a routerLink="/ordenes" routerLinkActive="active">Mis órdenes</a>
          <a routerLink="/carrito" routerLinkActive="active" class="cart-link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="9" cy="20" r="1.5"></circle><circle cx="18" cy="20" r="1.5"></circle>
              <path d="M2 3h3l2.6 12.4a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6"></path>
            </svg>
            Carrito
            <span class="badge" *ngIf="cantidadCarrito > 0">{{ cantidadCarrito }}</span>
          </a>

          <ng-container *ngIf="!cargando">
            <button *ngIf="!usuarioAutenticado" class="btn btn-light" (click)="login()">Iniciar sesión</button>
            <div *ngIf="usuarioAutenticado" class="user">
              <span class="avatar" aria-hidden="true">{{ iniciales }}</span>
              <span class="user-mail">{{ correoUsuario }}</span>
              <button class="btn btn-ghost-light" (click)="logout()">Salir</button>
            </div>
          </ng-container>
        </nav>
      </div>
    </header>

    <main class="page">
      <div *ngIf="cargando" class="loading">Cargando…</div>
      <router-outlet *ngIf="!cargando"></router-outlet>
    </main>

    <footer class="footer">
      <strong>PAUPÉRRIMOS</strong><br>
      Repuestos para tu auto · Acceso seguro con Microsoft Entra ID
    </footer>
  `
})
export class AppComponent implements OnInit {
  usuarioAutenticado = false;
  correoUsuario = '';
  cargando = true;
  private carritoCargado = false;

  private destroyRef = inject(DestroyRef);

  constructor(
    private authService: MsalService,
    private msalBroadcastService: MsalBroadcastService,
    private cdr: ChangeDetectorRef,
    public carritoService: CarritoService
  ) {}

  /** Cantidad total de unidades (para el contador del carrito). */
  get cantidadCarrito(): number {
    return this.carritoService.items.reduce((total, item) => total + item.cantidad, 0);
  }

  get iniciales(): string {
    const base = (this.correoUsuario.split('@')[0] || '?').replace(/[^a-zA-Z]/g, ' ').trim();
    const partes = base.split(/\s+/).filter(Boolean);
    return ((partes[0]?.[0] ?? '?') + (partes[1]?.[0] ?? '')).toUpperCase();
  }

  async ngOnInit(): Promise<void> {
    // 1. Escuchar eventos globales de MSAL con auto-desuscripción
    this.msalBroadcastService.msalSubject$
      .pipe(
        filter((msg: EventMessage) =>
          msg.eventType === EventType.LOGIN_SUCCESS ||
          msg.eventType === EventType.ACQUIRE_TOKEN_SUCCESS ||
          msg.eventType === EventType.HANDLE_REDIRECT_END
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.actualizarEstado();
      });

    // 2. Inicialización y manejo de promesas
    try {
      await this.authService.instance.initialize();
      const response = await this.authService.instance.handleRedirectPromise();

      if (response?.account) {
        this.authService.instance.setActiveAccount(response.account);
      }
    } catch (error) {
      console.error('Error al inicializar MSAL:', error);
    } finally {
      this.actualizarEstado();
      this.cargando = false;
      this.cdr.detectChanges();
    }
  }

  private actualizarEstado(): void {
    let activeAccount = this.authService.instance.getActiveAccount();
    const allAccounts = this.authService.instance.getAllAccounts();

    // Si no hay cuenta activa establecida pero existen cuentas en almacenamiento local
    if (!activeAccount && allAccounts.length > 0) {
      activeAccount = allAccounts[0];
      this.authService.instance.setActiveAccount(activeAccount);
    }

    this.usuarioAutenticado = !!activeAccount;
    this.correoUsuario = activeAccount ? activeAccount.username : '';

    // Carga el carrito una sola vez al detectar la sesión (alimenta el contador de la barra)
    if (this.usuarioAutenticado && !this.carritoCargado) {
      this.carritoCargado = true;
      this.carritoService.cargar();
    }
    if (!this.usuarioAutenticado) {
      this.carritoCargado = false;
    }
    this.cdr.detectChanges();
  }

  login(): void {
    this.authService.loginRedirect();
  }

  logout(): void {
    this.authService.logoutRedirect();
  }
}
