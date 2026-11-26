/** Formatea un monto en pesos chilenos: 15000 -> "$15.000" */
export function clp(valor: number): string {
  return '$' + Math.round(valor ?? 0).toLocaleString('es-CL');
}

/**
 * Foto de cada producto: public/img/productos/<archivo>.jpg (fotos reales, formato 4:3).
 * Se busca por palabras del nombre; si el producto no tiene foto, se usa una ilustración.
 */
const FOTOS: [string[], string][] = [
  [['aceite sint'], 'aceite-sintetico'],
  [['filtro de aceite'], 'filtro-aceite'],
  [['filtro de aire'], 'filtro-aire'],
  [['buj'], 'bujias'],
  [['pastilla'], 'pastillas-freno'],
  [['disco'], 'discos-freno'],
  [['liquido', 'líquido'], 'liquido-frenos'],
  [['bater'], 'bateria'],
  [['ampollet', 'led'], 'ampolletas-led'],
  [['cable', 'puente'], 'cables-puente']
];

export function imagenProducto(nombre: string): string {
  const n = (nombre ?? '').toLowerCase();
  const foto = FOTOS.find(([claves]) => claves.some(c => n.includes(c)));
  return foto ? `img/productos/${foto[1]}.jpg` : 'img/repuesto.svg';
}

/** Si falta la foto, muestra la ilustración genérica (se usa en (error) de cada <img>). */
export function sinFoto(ev: Event): void {
  const img = ev.target as HTMLImageElement;
  if (!img.src.endsWith('repuesto.svg')) {
    img.src = 'img/repuesto.svg';
    img.classList.add('ilustracion');
  }
}
