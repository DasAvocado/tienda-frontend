/** Formatea un monto en pesos chilenos: 15000 -> "$15.000" */
export function clp(valor: number): string {
  return '$' + Math.round(valor ?? 0).toLocaleString('es-CL');
}

/**
 * Imagen de cada producto (carpeta public/img). Se elige por palabras del nombre.
 * Para usar fotos reales: guarda tu archivo en public/img/ y apunta aquí el nombre.
 */
export function imagenProducto(nombre: string): string {
  const n = (nombre ?? '').toLowerCase();
  if (n.includes('filtro') || n.includes('aceite')) return 'img/filtro-aceite.svg';
  if (n.includes('freno') || n.includes('pastilla') || n.includes('disco')) return 'img/frenos.svg';
  if (n.includes('bater')) return 'img/bateria.svg';
  return 'img/repuesto.svg';
}
