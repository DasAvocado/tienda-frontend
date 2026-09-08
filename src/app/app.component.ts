import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule } from '@angular/router';
import { MsalService } from '@azure/msal-angular';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule],
  template: `
    <!-- Barra de Navegación -->
    <nav style="display: flex; justify-content: space-between; align-items: center; background-color: #ff4757; padding: 15px 30px; color: white;">
      <!-- Logo / Botón Home -->
      <a routerLink="/" style="color: white; text-decoration: none; font-size: 24px; font-weight: 900; letter-spacing: 1px; cursor: pointer;">
        PAUPÉRRIMOS
      </a>

      <!-- Enlaces y Autenticación -->
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

    <!-- Aquí se inyectarán las páginas (Home, Carrito, Pago) dinámicamente -->
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

  constructor(private authService: MsalService, private cdr: ChangeDetectorRef) {}

  async ngOnInit(): Promise<void> {
    try {
      await this.authService.instance.initialize();
      const response = await this.authService.instance.handleRedirectPromise();
      if (response) this.authService.instance.setActiveAccount(response.account);
      this.checkAndSetActiveAccount();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      this.cargando = false;
      this.cdr.detectChanges();
    }
  }

  checkAndSetActiveAccount(): void {
    let activeAccount = this.authService.instance.getActiveAccount();
    if (!activeAccount && this.authService.instance.getAllAccounts().length > 0) {
      activeAccount = this.authService.instance.getAllAccounts()[0];
      this.authService.instance.setActiveAccount(activeAccount);
    }
    this.usuarioAutenticado = !!activeAccount;
    this.correoUsuario = activeAccount ? activeAccount.username : '';
  }

  login(): void { this.authService.loginRedirect(); }
  logout(): void { this.authService.logoutRedirect(); }
}
