import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService, PreferenciaNotificacion, mensajeError } from '../../servicios/api.service';

/**
 * Opción "Notificaciones": el usuario decide si recibe un correo cada vez que compra.
 * El correo de destino es SIEMPRE el de la sesión (lo extrae ms-notificaciones del JWT de Entra ID).
 */
@Component({
  selector: 'app-notificaciones',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="page-head"><h1>Notificaciones</h1></div>

    <p *ngIf="cargando" class="loading">Cargando tus preferencias…</p>
    <p *ngIf="error" class="alert" role="alert">{{ error }}</p>

    <section class="card-box notif" *ngIf="pref">
      <div class="notif-row">
        <div>
          <h3>Correo de confirmación de compra</h3>
          <p class="sub">
            Cada vez que completes una compra te enviaremos el detalle de la orden a
            <strong>{{ pref.destino }}</strong>.
          </p>
          <p class="sub" *ngIf="pref.destino !== pref.email">
            (Tu sesión es {{ pref.email }}, pero el servidor redirige los correos a esa casilla.)
          </p>
        </div>
        <label class="switch" [class.on]="pref.correoCompra">
          <input type="checkbox" role="switch" [checked]="pref.correoCompra"
                 [disabled]="guardando" (change)="cambiar($event)"
                 aria-label="Enviarme un correo al hacer una compra">
          <span class="slider" aria-hidden="true"></span>
        </label>
      </div>

      <p class="estado-envio" [class.simulado]="pref.modoEnvio === 'SIMULADO'">
        <ng-container *ngIf="pref.modoEnvio === 'SMTP'">El servidor de correo está configurado: los correos llegan a tu bandeja.</ng-container>
        <ng-container *ngIf="pref.modoEnvio === 'SIMULADO'">Modo demostración: el servidor no tiene SMTP configurado y el correo se registra en el log de ms-notificaciones.</ng-container>
      </p>

      <div class="notif-actions">
        <button class="btn btn-outline" (click)="probar()" [disabled]="probando || !pref.correoCompra">
          {{ probando ? 'Enviando…' : 'Enviar correo de prueba' }}
        </button>
        <span class="ok" *ngIf="mensaje" role="status">{{ mensaje }}</span>
      </div>
    </section>
  `
})
export class NotificacionesComponent implements OnInit {
  pref: PreferenciaNotificacion | null = null;
  cargando = false;
  guardando = false;
  probando = false;
  error = '';
  mensaje = '';

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.cargando = true;
    this.api.getPreferencias().subscribe({
      next: p => { this.pref = p; this.cargando = false; },
      error: e => { this.error = mensajeError(e); this.cargando = false; }
    });
  }

  cambiar(event: Event): void {
    const activo = (event.target as HTMLInputElement).checked;
    this.guardando = true;
    this.error = '';
    this.mensaje = '';
    this.api.guardarPreferencias(activo).subscribe({
      next: p => {
        this.pref = p;
        this.guardando = false;
        this.mensaje = p.correoCompra ? 'Activado: recibirás un correo con cada compra.' : 'Desactivado: no te enviaremos correos de compra.';
      },
      error: e => {
        this.error = mensajeError(e);
        this.guardando = false;
        (event.target as HTMLInputElement).checked = !activo; // revierte el interruptor
      }
    });
  }

  probar(): void {
    this.probando = true;
    this.error = '';
    this.mensaje = '';
    this.api.enviarCorreoPrueba().subscribe({
      next: r => {
        this.probando = false;
        this.mensaje = r.estado === 'ENVIADO'
          ? `Correo de prueba enviado a ${r.destinatario}.`
          : r.estado === 'SIMULADO'
            ? `Correo simulado para ${r.destinatario} (revisa el log de ms-notificaciones).`
            : '';
        if (r.estado === 'ERROR') this.error = `No se pudo enviar: ${r.detalle}`;
      },
      error: e => { this.error = mensajeError(e); this.probando = false; }
    });
  }
}
