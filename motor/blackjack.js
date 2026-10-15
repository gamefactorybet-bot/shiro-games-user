// Reglas puras de Blackjack. Este módulo no conoce HTTP ni saldo: el
// endpoint guarda el mazo y decide cuándo cobrar o acreditar.
export const CFG_DEFAULT = {
  mazos: 6,
  dealerSoft17: 'plantar', // 'plantar' | 'pedir'
  pagoBlackjack: 1.5,
  permitirDoblar: true,
  sonido: true,
  movimiento: 'cinematico',
  ambiente: 80,
  mostrarNombre: true,
};

/** Dónde vive cada pieza de la mesa y qué tamaño tiene. % de la pantalla. */
export const MESA_DEFAULT = {
  version: 2,
  tema: 'noche',
  cartaAncho: 68,
  cartaAlto: 96,
  pano: { x: 50, y: 47, ancho: 94, alto: 58 },
  nombre: { x: 50, y: 9, escala: 100 },
  saldo: { x: 82, y: 6, escala: 92 },
  mazo: { x: 84, y: 30, escala: 82 },
  crupier: { x: 50, y: 29, escala: 100 },
  aro: { x: 50, y: 69, escala: 100 },
  jugador: { x: 50, y: 55, escala: 100 },
  controles: { x: 50, y: 80, escala: 100 },
};

const TEMAS = new Set([
  'noche', 'burdeos', 'carbon', 'caoba', 'zafiro', 'monaco',
  'artdeco', 'neon', 'artico', 'imperial', 'havana', 'perla',
]);
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
const num = (v, d) => (Number.isFinite(Number(v)) ? Number(v) : d);

function zona(v, d) {
  const o = obj(v);
  return {
    x: clamp(Math.round(num(o.x, d.x)), 0, 100),
    y: clamp(Math.round(num(o.y, d.y)), 0, 100),
    escala: clamp(Math.round(num(o.escala, d.escala)), 40, 180),
  };
}

function panoDe(v) {
  const o = obj(v);
  const d = MESA_DEFAULT.pano;
  return {
    x: clamp(Math.round(num(o.x, d.x)), 0, 100),
    y: clamp(Math.round(num(o.y, d.y)), 0, 100),
    ancho: clamp(Math.round(num(o.ancho, d.ancho)), 40, 100),
    alto: clamp(Math.round(num(o.alto, d.alto)), 32, 96),
  };
}

export function mesaDe(raw) {
  const m = obj(raw);
  const D = MESA_DEFAULT;
  // v2 cambia la mesa apaisada original por el escenario vertical. Las mesas
  // ya guardadas migran una sola vez; desde ahí vuelven a ser editables.
  const layout = Number(m.version) >= 2 ? m : {};
  return {
    version: 2,
    tema: TEMAS.has(m.tema) ? m.tema : D.tema,
    cartaAncho: clamp(Math.round(num(layout.cartaAncho, D.cartaAncho)), 48, 150),
    cartaAlto: clamp(Math.round(num(layout.cartaAlto, D.cartaAlto)), 68, 210),
    pano: panoDe(layout.pano),
    nombre: zona(layout.nombre, D.nombre),
    saldo: zona(layout.saldo, D.saldo),
    mazo: zona(layout.mazo, D.mazo),
    crupier: zona(layout.crupier, D.crupier),
    aro: zona(layout.aro, D.aro),
    jugador: zona(layout.jugador, D.jugador),
    controles: zona(layout.controles, D.controles),
  };
}

function cartasDe(v) {
  const o = obj(v);
  const out = {};
  for (const [k, val] of Object.entries(o)) {
    if (typeof val === 'string' && val.trim()) out[k] = val.trim();
  }
  return out;
}

export function cfgConDefaults(cfg) {
  const c = obj(cfg);
  const reverso = typeof c.reversoUrl === 'string' ? c.reversoUrl.trim() : '';
  const fondo = typeof c.fondoUrl === 'string' ? c.fondoUrl.trim() : '';
  return {
    mazos: clamp(Math.round(Number(c.mazos) || CFG_DEFAULT.mazos), 1, 8),
    dealerSoft17: c.dealerSoft17 === 'pedir' ? 'pedir' : 'plantar',
    pagoBlackjack: clamp(Number(c.pagoBlackjack) || CFG_DEFAULT.pagoBlackjack, 1, 2),
    permitirDoblar: c.permitirDoblar !== false,
    sonido: c.sonido !== false,
    movimiento: ['cinematico', 'rapido', 'reducido'].includes(c.movimiento) ? c.movimiento : CFG_DEFAULT.movimiento,
    ambiente: clamp(Math.round(num(c.ambiente, CFG_DEFAULT.ambiente)), 0, 100),
    mostrarNombre: c.mostrarNombre !== false,
    fondoUrl: fondo || null,
    reversoUrl: reverso || null,
    cartas: cartasDe(c.cartas),
    mesa: mesaDe(c.mesa),
  };
}

const PALOS = ['♠', '♥', '♦', '♣'];
const RANGOS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export function crearMazo(mazos = 6) {
  const out = [];
  for (let n = 0; n < mazos; n++) for (const palo of PALOS) for (const rango of RANGOS) out.push({ rango, palo });
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function sacar(mazo) {
  if (!Array.isArray(mazo) || !mazo.length) throw new Error('El mazo se quedó sin cartas');
  return mazo.pop();
}

export function valor(mano) {
  let total = 0; let ases = 0;
  for (const carta of mano || []) {
    if (carta.rango === 'A') { total += 11; ases++; }
    else if (['K', 'Q', 'J'].includes(carta.rango)) total += 10;
    else total += Number(carta.rango);
  }
  while (total > 21 && ases) { total -= 10; ases--; }
  return { total, suave: ases > 0 };
}

export const esBlackjack = (mano) => Array.isArray(mano) && mano.length === 2 && valor(mano).total === 21;

export function jugarDealer(mazo, mano, cfg) {
  const c = cfgConDefaults(cfg);
  const cartas = [...mano];
  while (true) {
    const v = valor(cartas);
    if (v.total < 17 || (v.total === 17 && v.suave && c.dealerSoft17 === 'pedir')) cartas.push(sacar(mazo));
    else return cartas;
  }
}

export function resolver(manoJugador, manoDealer, cfg) {
  const jugador = valor(manoJugador).total;
  const dealer = valor(manoDealer).total;
  if (jugador > 21) return { resultado: 'perdio', multiplicador: 0 };
  if (dealer > 21 || jugador > dealer) return { resultado: 'gano', multiplicador: 2 };
  if (jugador < dealer) return { resultado: 'perdio', multiplicador: 0 };
  return { resultado: 'empate', multiplicador: 1 };
}
