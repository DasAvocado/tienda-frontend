import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CarritoService } from '../../servicios/carrito.service';
import { mensajeError } from '../../servicios/api.service';
import { clp, imagenProducto } from '../../util/formato';

@Component({
  selector: 'app-pago',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <!-- Pantalla de éxito -->
    <div class="success" *ngIf="pagoExitoso">
      <div class="check" aria-hidden="true">✓</div>
      <h2>¡Compra recibida!</h2>
      <p>Tu orden se está procesando: descontamos el stock y te enviaremos la confirmación por correo.</p>
      <a routerLink="/ordenes" class="btn btn-primary btn-lg">Ver mis órdenes</a>
      <a routerLink="/" class="btn btn-outline btn-lg">Volver al catálogo</a>
    </div>

    <!-- Formulario de pago -->
    <ng-container *ngIf="!pagoExitoso">
      <div class="page-head"><h1>Finalizar pago</h1></div>

      <div class="pay-layout">
        <div class="card-box">
          <div class="credit-card" aria-hidden="true">
            <div class="chipcard"></div>
            <div class="num">{{ numeroTarjeta || '•••• •••• •••• ••••' }}</div>
            <div class="row">
              <div><small>Titular</small>{{ nombreTarjeta || 'Nombre Apellido' }}</div>
              <div><small>Vence</small>{{ vencimiento || 'MM/AA' }}</div>
            </div>
          </div>

          <div class="field">
            <label for="tarjeta">Número de tarjeta</label>
            <input id="tarjeta" type="text" inputmode="numeric" autocomplete="off"
                   [value]="numeroTarjeta" (input)="formatearTarjeta($event)"
                   placeholder="0000 0000 0000 0000" maxlength="19">
          </div>

          <div class="field-row">
            <div class="field">
              <label for="venc">Vencimiento</label>
              <input id="venc" type="text" inputmode="numeric" autocomplete="off"
                     [value]="vencimiento" (input)="formatearVencimiento($event)"
                     placeholder="MM/AA" maxlength="5">
            </div>
            <div class="field">
              <label for="cvv">CVV</label>
              <input id="cvv" type="text" inputmode="numeric" autocomplete="off"
                     (input)="soloNumeros($event)" placeholder="123" maxlength="3">
            </div>
          </div>

          <div class="field">
            <label for="titular">Nombre en la tarjeta</label>
            <input id="titular" type="text" autocomplete="off" style="text-transform: uppercase;"
                   [value]="nombreTarjeta" (input)="formatearNombre($event)" placeholder="EJ: JUAN PEREZ">
          </div>

          <p *ngIf="error" class="alert" role="alert">{{ error }}</p>

          <button class="btn btn-primary btn-lg btn-block" (click)="procesarPago()"
                  [disabled]="!puedePagar || procesando">
            {{ procesando ? 'Procesando…' : 'Pagar ' + clp(carritoService.obtenerTotal()) }}
          </button>
          <p class="note">Entorno de demostración: los datos de la tarjeta no se envían ni se guardan.</p>
        </div>

        <aside class="summary">
          <h3>Tu pedido</h3>
          <p *ngIf="carritoService.items.length === 0" class="sub">Tu carrito está vacío.</p>
          <div class="mini-item" *ngFor="let item of carritoService.items">
            <img class="thumb" [src]="imagen(item.nombre)" alt="">
            <span class="n">{{ item.nombre }} <span class="unit">× {{ item.cantidad }}</span></span>
            <strong>{{ clp(item.precio * item.cantidad) }}</strong>
          </div>
          <div class="summary-row total"><span>Total</span><strong>{{ clp(carritoService.obtenerTotal()) }}</strong></div>
          <a routerLink="/carrito" class="btn btn-outline btn-block">Editar carrito</a>
        </aside>
      </div>
    </ng-container>
  `
})
export class PagoComponent implements OnInit {
  numeroTarjeta = '';
  vencimiento = '';
  nombreTarjeta = '';
  cvv = '';
  pagoExitoso = false;
  procesando = false;
  error = '';

  clp = clp;
  imagen = imagenProducto;

  constructor(public carritoService: CarritoService) {}

  ngOnInit(): void {
    this.carritoService.cargar();
  }

  /** Validación mínima de formato (la pasarela real validaría con el banco). */
  get puedePagar(): boolean {
    const mes = parseInt(this.vencimiento.substring(0, 2), 10);
    return this.carritoService.obtenerTotal() > 0
      && this.numeroTarjeta.replace(/\s/g, '').length === 16
      && this.vencimiento.length === 5 && mes >= 1 && mes <= 12
      && this.cvv.length === 3
      && this.nombreTarjeta.trim().length > 2;
  }

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
    const valor = event.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
    this.nombreTarjeta = valor;
    event.target.value = this.nombreTarjeta;
  }

  soloNumeros(event: any): void {
    this.cvv = event.target.value.replace(/\D/g, '');
    event.target.value = this.cvv;
  }

  procesarPago(): void {
    // La pasarela de pago real (Transbank, Stripe, etc.) iría aquí. Por ahora se confirma la compra:
    // ms-carrito publica "carrito.checkout" en RabbitMQ y ms-ordenes crea la orden.
    this.procesando = true;
    this.error = '';
    this.carritoService.checkout().subscribe({
      next: () => { this.pagoExitoso = true; this.procesando = false; },
      error: e => { this.error = mensajeError(e); this.procesando = false; }
    });
  }
}
