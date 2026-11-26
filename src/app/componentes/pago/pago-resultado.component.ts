import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ApiService, Pago, mensajeError } from '../../servicios/api.service';
import { CarritoService } from '../../servicios/carrito.service';
import { clp } from '../../util/formato';

/** Vuelta desde Webpay: ms-pagos ya confirmó (commit) la transacción y redirige aquí con ?pagoId=&estado= */
@Component({
  selector: 'app-pago-resultado',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="success" *ngIf="estado === 'APROBADO'">
      <div class="check" aria-hidden="true">✓</div>
      <h2>¡Pago aprobado con Webpay!</h2>
      <p *ngIf="pago">Pago #{{ pago.id }} · {{ clp(pago.monto) }} · {{ pago.tarjeta }} · autorización {{ pago.codigoAutorizacion }}</p>
      <p>Tu orden se está creando y te enviaremos la confirmación por correo.</p>
      <a routerLink="/ordenes" class="btn btn-primary btn-lg">Ver mis órdenes</a>
      <a routerLink="/" class="btn btn-outline btn-lg">Volver al catálogo</a>
    </div>

    <div class="empty" *ngIf="estado && estado !== 'APROBADO'">
      <div class="check fail" aria-hidden="true">{{ estado === 'BLOQUEADO_FRAUDE' ? '🚨' : '✕' }}</div>
      <h3>{{ titulo }}</h3>
      <p *ngIf="pago?.detalle">{{ pago?.detalle }}</p>
      <p *ngIf="error" class="alert">{{ error }}</p>
      <a routerLink="/pago" class="btn btn-primary btn-lg">Intentar nuevamente</a>
      <a routerLink="/carrito" class="btn btn-outline btn-lg">Volver al carrito</a>
    </div>
  `
})
export class PagoResultadoComponent implements OnInit {
  estado = '';
  pago: Pago | null = null;
  error = '';
  clp = clp;

  constructor(private route: ActivatedRoute, private api: ApiService, private carrito: CarritoService) {}

  get titulo(): string {
    switch (this.estado) {
      case 'RECHAZADO': return 'El pago fue rechazado';
      case 'ANULADO': return 'Pago anulado';
      case 'BLOQUEADO_FRAUDE': return 'Pago bloqueado por detección de fraude';
      default: return 'No pudimos identificar el pago';
    }
  }

  ngOnInit(): void {
    const q = this.route.snapshot.queryParamMap;
    this.estado = q.get('estado') ?? 'DESCONOCIDO';
    const id = Number(q.get('pagoId'));
    if (this.estado === 'APROBADO') {
      this.carrito.limpiarLocal();
      setTimeout(() => this.carrito.cargar(), 2000);
    }
    if (id) {
      this.api.getPago(id).subscribe({
        next: p => { this.pago = p; this.estado = p.estado; },
        error: e => this.error = mensajeError(e)
      });
    }
  }
}
