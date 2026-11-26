import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CarritoService } from '../../servicios/carrito.service';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiService, Pago, mensajeError } from '../../servicios/api.service';
import { clp, imagenProducto } from '../../util/formato';

@Component({
  selector: 'app-pago',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <!-- Pantalla de éxito (tarjeta simulada) -->
    <div class="success" *ngIf="pagoExitoso">
      <div class="check" aria-hidden="true">✓</div>
      <h2>¡Pago aprobado!</h2>
      <p>Pago #{{ pago?.id }} · {{ pago?.tarjeta }} · autorización {{ pago?.codigoAutorizacion }}</p>
      <p>Tu orden se está creando y descontamos el stock.</p>
      <p *ngIf="aviso" class="sub">{{ aviso }}</p>
      <a routerLink="/ordenes" class="btn btn-primary btn-lg">Ver mis órdenes</a>
      <a routerLink="/" class="btn btn-outline btn-lg">Volver al catálogo</a>
    </div>

    <ng-container *ngIf="!pagoExitoso">
      <div class="page-head"><h1>Finalizar pago</h1></div>

      <div class="pay-layout">
        <div class="card-box">
          <div class="tabs" role="tablist" aria-label="Medio de pago">
            <button role="tab" [attr.aria-selected]="metodo === 'webpay'" [class.on]="metodo === 'webpay'" (click)="metodo = 'webpay'; error = ''">
              Webpay Plus
            </button>
            <button role="tab" [attr.aria-selected]="metodo === 'tarjeta'" [class.on]="metodo === 'tarjeta'" (click)="metodo = 'tarjeta'; error = ''">
              Tarjeta (simulada)
            </button>
          </div>

          <!-- Webpay Plus (Transbank, ambiente de integración) -->
          <div *ngIf="metodo === 'webpay'" class="webpay">
            <p>Serás redirigido al formulario seguro de <strong>Transbank Webpay Plus</strong> (ambiente de pruebas).</p>
            <ul class="note">
              <li>Tarjeta de prueba VISA: <code>4051 8856 0044 6623</code> · CVV <code>123</code> · cualquier fecha futura</li>
              <li>Autenticación: RUT <code>11.111.111-1</code> · clave <code>123</code></li>
            </ul>
            <p *ngIf="error" class="alert" role="alert">{{ error }}</p>
            <button class="btn btn-primary btn-lg btn-block" (click)="pagarWebpay()" [disabled]="total <= 0 || procesando">
              {{ procesando ? 'Conectando con Webpay…' : 'Pagar ' + clp(total) + ' con Webpay' }}
            </button>
          </div>

          <!-- Tarjeta simulada (sirve para la demo de la regla antifraude) -->
          <div *ngIf="metodo === 'tarjeta'">
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

            <p *ngIf="error" class="alert" [class.fraude]="bloqueado" role="alert">{{ error }}</p>

            <button class="btn btn-primary btn-lg btn-block" (click)="pagarConTarjeta()"
                    [disabled]="!puedePagar || procesando">
              {{ procesando ? 'Procesando…' : 'Pagar ' + clp(total) }}
            </button>
            <p class="note">Tarjeta aprobada: 4051 8856 0044 6623 · rechazada: 4000 0000 0000 0002.
              Más de 3 intentos con la misma tarjeta en 10 s se bloquean por fraude.</p>
          </div>
        </div>

        <aside class="summary">
          <h3>Tu pedido</h3>
          <p *ngIf="carritoService.items.length === 0" class="sub">Tu carrito está vacío.</p>
          <div class="mini-item" *ngFor="let item of carritoService.items">
            <img class="thumb" [src]="imagen(item.nombre)" alt="">
            <span class="n">{{ item.nombre }} <span class="unit">× {{ item.cantidad }}</span></span>
            <strong>{{ clp(item.precio * item.cantidad) }}</strong>
          </div>
          <ng-container *ngIf="carritoService.resumen as r">
            <div class="summary-row"><span>Subtotal</span><span>{{ clp(r.subtotal) }}</span></div>
            <div class="summary-row desc-row" *ngIf="r.descuento > 0"><span>Descuento {{ r.cupon }}</span><span>−{{ clp(r.descuento) }}</span></div>
            <div class="summary-row"><span>Despacho {{ r.tipoEnvio | lowercase }}</span><span>{{ r.costoEnvio === 0 ? 'Gratis' : clp(r.costoEnvio) }}</span></div>
          </ng-container>
          <div class="summary-row total"><span>Total</span><strong>{{ clp(total) }}</strong></div>
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
  bloqueado = false;
  error = '';
  metodo: 'webpay' | 'tarjeta' = 'webpay';
  pago: Pago | null = null;
  /** Aviso sobre el correo de confirmación (según la opción Notificaciones). */
  aviso = '';

  clp = clp;
  imagen = imagenProducto;

  constructor(public carritoService: CarritoService, private api: ApiService) {}

  ngOnInit(): void {
    this.carritoService.cargar();
  }

  get total(): number {
    return this.carritoService.obtenerTotal();
  }

  /** Validación mínima de formato (ms-pagos valida Luhn, vencimiento y CVV). */
  get puedePagar(): boolean {
    const mes = parseInt(this.vencimiento.substring(0, 2), 10);
    return this.total > 0
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

  /** Webpay Plus: ms-pagos crea la transacción; el navegador hace POST del token al formulario de Transbank. */
  pagarWebpay(): void {
    this.procesando = true;
    this.error = '';
    this.api.iniciarWebpay(this.total).subscribe({
      next: r => {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = r.url;
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = 'token_ws';
        input.value = r.token;
        form.appendChild(input);
        document.body.appendChild(form);
        form.submit();
      },
      error: e => { this.error = mensajeError(e); this.procesando = false; }
    });
  }

  /**
   * Tarjeta simulada: ms-pagos aplica la regla antifraude y, si aprueba, envía el comando "pago.aprobado"
   * (RabbitMQ) a ms-carrito, que cierra la compra y ms-ordenes crea la orden.
   */
  pagarConTarjeta(): void {
    this.procesando = true;
    this.error = '';
    this.bloqueado = false;
    this.api.pagarConTarjeta({
      numero: this.numeroTarjeta.replace(/\s/g, ''),
      vencimiento: this.vencimiento,
      cvv: this.cvv,
      titular: this.nombreTarjeta.trim(),
      monto: this.total
    }).subscribe({
      next: p => {
        this.pago = p;
        this.pagoExitoso = true;
        this.procesando = false;
        this.carritoService.limpiarLocal();
        setTimeout(() => this.carritoService.cargar(), 2000);
        this.avisarCorreo();
      },
      error: (e: HttpErrorResponse) => {
        this.procesando = false;
        this.bloqueado = e.status === 423;
        this.error = e.status === 423
          ? '🚨 Pago bloqueado preventivamente por detección de fraude: ' + (e.error?.detalle ?? '')
          : e.status === 402 ? 'Pago rechazado: ' + (e.error?.detalle ?? 'el emisor rechazó la tarjeta')
          : mensajeError(e);
      }
    });
  }

  /** ms-notificaciones envía el correo de forma asíncrona (RabbitMQ); aquí solo informamos a dónde llegará. */
  private avisarCorreo(): void {
    this.api.getPreferencias().subscribe({
      next: p => this.aviso = p.correoCompra
        ? `Te enviaremos la confirmación a ${p.destino}.`
        : 'Tienes desactivado el correo de compra (puedes activarlo en Notificaciones).',
      error: () => this.aviso = ''
    });
  }
}
