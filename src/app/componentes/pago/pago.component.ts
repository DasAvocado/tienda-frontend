import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CarritoService } from '../../servicios/carrito.service';

@Component({
  selector: 'app-pago',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div style="max-width: 500px; margin: 40px auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">

      <!-- Formulario de Pago (Se oculta si el pago es exitoso) -->
      <div *ngIf="!pagoExitoso">
        <h2>Finalizar Pago</h2>
        <p>Total a pagar: <strong style="font-size: 18px; color: #28a745;">\${{ carritoService.obtenerTotal() }}</strong></p>

        <div style="margin-bottom: 15px; margin-top: 20px;">
            <label style="display: block; font-weight: bold; margin-bottom: 5px;">Número de Tarjeta</label>
            <input
              type="text"
              [value]="numeroTarjeta"
              (input)="formatearTarjeta($event)"
              placeholder="0000 0000 0000 0000"
              maxlength="19"
              style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 5px; box-sizing: border-box; font-family: monospace; font-size: 16px;">
        </div>

        <div style="display: flex; gap: 10px; margin-bottom: 15px;">
            <div style="flex: 1;">
                <label style="display: block; font-weight: bold; margin-bottom: 5px;">Vencimiento</label>
                <input
                  type="text"
                  [value]="vencimiento"
                  (input)="formatearVencimiento($event)"
                  placeholder="MM/AA"
                  maxlength="5"
                  style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 5px; box-sizing: border-box; text-align: center;">
            </div>
            <div style="flex: 1;">
                <label style="display: block; font-weight: bold; margin-bottom: 5px;">CVV</label>
                <input
                  type="text"
                  placeholder="123"
                  maxlength="3"
                  (input)="soloNumeros($event)"
                  style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 5px; box-sizing: border-box; text-align: center;">
            </div>
        </div>

        <div style="margin-bottom: 25px;">
            <label style="display: block; font-weight: bold; margin-bottom: 5px;">Nombre en la tarjeta</label>
            <input
              type="text"
              [value]="nombreTarjeta"
              (input)="formatearNombre($event)"
              placeholder="EJ: JUAN PEREZ"
              style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 5px; box-sizing: border-box; text-transform: uppercase;">
        </div>

        <button
          (click)="procesarPago()"
          [disabled]="carritoService.obtenerTotal() === 0"
          [style.background-color]="carritoService.obtenerTotal() === 0 ? '#ccc' : '#2ed573'"
          [style.cursor]="carritoService.obtenerTotal() === 0 ? 'not-allowed' : 'pointer'"
          style="width: 100%; color: white; padding: 15px; border: none; border-radius: 5px; font-size: 16px; font-weight: bold;">
          Pagar Ahora
        </button>
      </div>

      <!-- Pantalla de Éxito -->
      <div *ngIf="pagoExitoso" style="text-align: center; padding: 20px 0;">
        <div style="font-size: 60px; color: #2ed573; margin-bottom: 20px;">✅</div>
        <h2 style="color: #333;">¡Compra Exitosa!</h2>
        <p style="color: #666; margin-bottom: 30px;">Tu pedido ha sido procesado correctamente y está en camino.</p>

        <a routerLink="/" style="background-color: #0078D4; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
          Volver al Catálogo
        </a>
      </div>

    </div>
  `
})
export class PagoComponent {
  numeroTarjeta = '';
  vencimiento = '';
  nombreTarjeta = '';
  pagoExitoso = false;

  constructor(public carritoService: CarritoService) {}

  formatearTarjeta(event: any): void {
    let valor = event.target.value.replace(/\D/g, '');
    if (valor.length > 16) valor = valor.substring(0, 16);
    this.numeroTarjeta = valor.replace(/(\d{4})(?=\d)/g, '$1 ');
    event.target.value = this.numeroTarjeta;
  }

  formatearVencimiento(event: any): void {
    let valor = event.target.value.replace(/\D/g, '');
    if (valor.length > 4) valor = valor.substring(0, 4);

    // Inserta la barra automáticamente después del mes
    if (valor.length > 2) {
      this.vencimiento = valor.substring(0, 2) + '/' + valor.substring(2, 4);
    } else {
      this.vencimiento = valor;
    }
    event.target.value = this.vencimiento;
  }

  formatearNombre(event: any): void {
    // Permite solo letras (incluyendo acentos y ñ) y espacios
    let valor = event.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
    this.nombreTarjeta = valor;
    event.target.value = this.nombreTarjeta;
  }

  soloNumeros(event: any): void {
    event.target.value = event.target.value.replace(/\D/g, '');
  }

  procesarPago(): void {
    // Aquí iría la lógica real de conexión a la pasarela de pago (Transbank, Stripe, etc.)
    this.pagoExitoso = true;
    this.carritoService.vaciar(); // Limpiamos el carrito tras la compra
  }
}
