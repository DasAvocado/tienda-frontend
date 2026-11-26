import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MsalService } from '@azure/msal-angular';
import { ApiService, Metricas, mensajeError } from '../../servicios/api.service';
import { esLocal, protectedResources } from '../../auth-config';
import { clp } from '../../util/formato';

/**
 * Dashboard en tiempo real (solo ADMIN). ms-recomendaciones empuja las métricas por WebSocket cada 2 s
 * (wss://<este sitio>/ws/metricas, nginx lo reenvía al microservicio). El JWT va en ?token= porque el
 * navegador no permite cabeceras en un WebSocket.
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-head">
      <h1>Dashboard en vivo</h1>
      <span class="ws-estado" [class.on]="estado === 'conectado'" [class.poll]="estado === 'REST'">
        <span class="dot"></span>{{ textoEstado }}
      </span>
    </div>
    <p *ngIf="error" class="alert" role="alert">{{ error }}</p>

    <ng-container *ngIf="m">
      <div class="kpis">
        <div class="kpi"><span class="kpi-l">Clicks último minuto</span><strong>{{ m.clicksUltimoMinuto }}</strong></div>
        <div class="kpi"><span class="kpi-l">Usuarios activos (15 min)</span><strong>{{ m.usuariosActivos }}</strong></div>
        <div class="kpi"><span class="kpi-l">Pagos aprobados</span><strong>{{ m.pagos.aprobados }}</strong><small>{{ clp(m.pagos.montoAprobado) }}</small></div>
        <div class="kpi alerta" [class.activa]="m.alertasFraude > 0"><span class="kpi-l">Alertas de fraude</span><strong>{{ m.alertasFraude }}</strong><small>{{ m.pagos.bloqueados }} pagos bloqueados</small></div>
        <div class="kpi"><span class="kpi-l">Órdenes creadas</span><strong>{{ m.ordenesCreadas }}</strong><small>{{ clp(m.ventasTotales) }}</small></div>
        <div class="kpi"><span class="kpi-l">Eventos Kafka procesados</span><strong>{{ m.totalEventos }}</strong><small>almacenamiento: {{ m.almacenamiento }}</small></div>
      </div>

      <div class="dash-grid">
        <section class="card-box">
          <h3>Volumen de clicks por minuto</h3>
          <svg class="chart" [attr.viewBox]="'0 0 ' + ancho + ' 160'" role="img" aria-label="Clicks por minuto, últimos 15 minutos">
            <g *ngFor="let p of m.clicksPorMinuto; let i = index">
              <rect [attr.x]="i * paso + 4" [attr.y]="140 - alto(p.clicks)" [attr.width]="paso - 8" [attr.height]="alto(p.clicks)" rx="3"></rect>
              <text *ngIf="p.clicks > 0" class="v" [attr.x]="i * paso + paso / 2" [attr.y]="134 - alto(p.clicks)">{{ p.clicks }}</text>
              <text *ngIf="i % 3 === 0 || i === m.clicksPorMinuto.length - 1" class="x" [attr.x]="i * paso + paso / 2" y="156">{{ p.minuto }}</text>
            </g>
          </svg>
        </section>

        <section class="card-box">
          <h3>Productos más vistos</h3>
          <p class="sub" *ngIf="m.topProductos.length === 0">Aún no hay visitas a productos.</p>
          <div class="barra" *ngFor="let t of m.topProductos; let i = index">
            <span class="barra-n">{{ i + 1 }}. {{ t.nombre }}</span>
            <span class="barra-b"><span [style.width.%]="100 * t.vistas / maxVistas"></span></span>
            <strong>{{ t.vistas }}</strong>
          </div>
        </section>

        <section class="card-box">
          <h3>Pagos por estado</h3>
          <div class="barra" *ngFor="let p of estadosPago">
            <span class="barra-n">{{ p.nombre }}</span>
            <span class="barra-b" [ngClass]="p.clase"><span [style.width.%]="totalPagos ? 100 * p.valor / totalPagos : 0"></span></span>
            <strong>{{ p.valor }}</strong>
          </div>
        </section>

        <section class="card-box">
          <h3>Últimas alertas de fraude</h3>
          <p class="sub" *ngIf="m.ultimasAlertas.length === 0">Sin alertas. Prueba 4 pagos seguidos con la misma tarjeta.</p>
          <table class="tabla" *ngIf="m.ultimasAlertas.length > 0">
            <thead><tr><th>Hora</th><th>Tarjeta</th><th>Intentos</th><th>Monto</th></tr></thead>
            <tbody>
              <tr *ngFor="let a of m.ultimasAlertas">
                <td>{{ a.fecha | date: 'HH:mm:ss' }}</td><td>{{ a.tarjeta }}</td><td>{{ a.intentos }} en 10 s</td><td>{{ clp(a.monto) }}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section class="card-box ancho">
          <h3>Eventos por tipo</h3>
          <div class="tipos">
            <span class="tipo" *ngFor="let t of tipos"><code>{{ t[0] }}</code> {{ t[1] }}</span>
          </div>
          <p class="note">Actualizado {{ m.generado | date: 'HH:mm:ss' }} · fuente: tópicos Kafka navegación, pagos, fraude y transacciones.</p>
        </section>
      </div>
    </ng-container>
  `
})
export class DashboardComponent implements OnInit, OnDestroy {
  m: Metricas | null = null;
  estado: 'conectando' | 'conectado' | 'desconectado' | 'REST' = 'conectando';
  error = '';
  clp = clp;

  readonly paso = 40;
  private ws?: WebSocket;
  private intentos = 0;
  private cerrado = false;
  private timer?: ReturnType<typeof setTimeout>;
  private poll?: ReturnType<typeof setInterval>;

  constructor(private msal: MsalService, private api: ApiService, private zone: NgZone) {}

  get ancho(): number { return (this.m?.clicksPorMinuto.length ?? 15) * this.paso; }
  get maxClicks(): number { return Math.max(1, ...(this.m?.clicksPorMinuto.map(p => p.clicks) ?? [1])); }
  get maxVistas(): number { return Math.max(1, ...(this.m?.topProductos.map(p => p.vistas) ?? [1])); }
  get tipos(): [string, number][] { return Object.entries(this.m?.eventosPorTipo ?? {}); }
  get totalPagos(): number {
    const p = this.m?.pagos;
    return p ? p.aprobados + p.rechazados + p.bloqueados + p.anulados : 0;
  }
  get estadosPago() {
    const p = this.m!.pagos;
    return [
      { nombre: 'Aprobados', valor: p.aprobados, clase: 'ok' },
      { nombre: 'Rechazados', valor: p.rechazados, clase: 'warn' },
      { nombre: 'Bloqueados (fraude)', valor: p.bloqueados, clase: 'err' },
      { nombre: 'Anulados', valor: p.anulados, clase: '' }
    ];
  }
  get textoEstado(): string {
    return { conectando: 'Conectando…', conectado: 'En vivo (WebSocket)', desconectado: 'Reconectando…', REST: 'Modo consulta (cada 5 s)' }[this.estado];
  }

  alto(v: number): number { return Math.round(120 * v / this.maxClicks); }

  ngOnInit(): void {
    this.conectar();
  }

  ngOnDestroy(): void {
    this.cerrado = true;
    clearTimeout(this.timer);
    clearInterval(this.poll);
    this.ws?.close();
  }

  private async conectar(): Promise<void> {
    try {
      const account = this.msal.instance.getActiveAccount() ?? this.msal.instance.getAllAccounts()[0];
      if (!account) { this.error = 'Inicia sesión con una cuenta ADMIN.'; return; }
      const t = await this.msal.instance.acquireTokenSilent({ scopes: protectedResources.apiGateway.scopes, account });
      const protocolo = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const url = `${protocolo}://${window.location.host}/ws/metricas?token=${encodeURIComponent(t.accessToken)}`;
      this.zone.runOutsideAngular(() => {
        this.ws = new WebSocket(url);
        this.ws.onopen = () => this.zone.run(() => { this.estado = 'conectado'; this.intentos = 0; this.error = ''; });
        this.ws.onmessage = ev => this.zone.run(() => this.m = JSON.parse(ev.data));
        this.ws.onclose = () => this.zone.run(() => this.reintentar());
      });
    } catch (e) {
      this.error = 'No se pudo obtener el token: ' + (e as Error).message;
      this.reintentar();
    }
  }

  /** Reconexión con espera creciente; tras 3 fallos usa la API REST (GET /api/recomendaciones/metricas). */
  private reintentar(): void {
    if (this.cerrado) return;
    this.intentos++;
    if (this.intentos >= 3 && !this.poll) {
      this.estado = 'REST';
      this.error = esLocal ? '' : 'WebSocket no disponible (¿RECOMENDACIONES_HOST en el .env del frontend?). Se consulta por REST.';
      const consultar = () => this.api.getMetricas().subscribe({ next: m => this.m = m, error: e => this.error = mensajeError(e) });
      consultar();
      this.poll = setInterval(consultar, 5000);
    }
    if (this.estado !== 'REST') this.estado = 'desconectado';
    this.timer = setTimeout(() => this.conectar(), Math.min(30000, 1000 * 2 ** this.intentos));
  }
}
