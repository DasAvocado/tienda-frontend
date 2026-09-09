import { Component, OnInit, ChangeDetectorRef, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule } from '@angular/router';
import { MsalService, MsalBroadcastService } from '@azure/msal-angular';
import { EventMessage, EventType } from '@azure/msal-browser';
import { filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule],
  template: `
    <nav style="display: flex; justify-content: space-between; align-items: center; background-color: #ff4757; padding: 15px 30px; color: white;">
      <a routerLink="/" style="color: white; text-decoration: none; font-size: 24px; font-weight: 900; letter-spacing: 1px; cursor: pointer;">
        PAUPÉRRIMOS
      </a>

      <div style="display: flex; gap: 20px; align-items: center;">
        <a routerLink="/" style="color: white; text-decoration: none; font-weight: bold;">Inicio</a>
        <a routerLink="/carrito" style="background: white; color: #ff4757; padding: 8px 15px; border-radius: 20px; text-decoration: none; font-weight: bold;">🛒 Carrito</a>

        <div *ngIf="!cargando">
          <button *ngIf="!usuarioAutenticado" (click)="login()" style="padding: 8px 15px; cursor: pointer; background-color: #333; color: white; border: none; border-radius: 4px;">
            Iniciar Sesión
          </button>
          <button *ngIf="usuarioAutenticado" (click)="logout()" style="padding: 8px 15px; cursor: pointer; background-color: #d13438; color: white; border: none; border-radius: 4px;">
            Cerrar Sesión ({{ correoUsuario }})
          </button>
        </div>
      </div>
    </nav>

    <div style="padding: 30px; font-family: Arial, sans-serif;">
      <div *ngIf="cargando">Cargando estado de autenticación...</div>
      <router-outlet *ngIf="!cargando"></router-outlet>
    </div>
  `
})
export class AppComponent implements OnInit {
  usuarioAutenticado = false;
  correoUsuario = '';
  cargando = true;

  private destroyRef = inject(DestroyRef);

  constructor(
    private authService: MsalService,
    private msalBroadcastService: MsalBroadcastService,
    private cdr: ChangeDetectorRef
  ) {}

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
    this.cdr.detectChanges();
  }

  login(): void {
    this.authService.loginRedirect();
  }

  logout(): void {
    this.authService.logoutRedirect();
  }
}
