// Reglas puras de Blackjack. Este módulo no conoce HTTP ni saldo: el
// endpoint guarda el mazo y decide cuándo cobrar o acreditar.
export const CFG_DEFAULT = {
  mazos: 6,
  dealerSoft17: 'plantar', // 'plantar' | 'pedir'
  pagoBlackjack: 1.5,
  permitirDoblar: true,
};

/** Dónde vive cada pieza de la mesa y qué tamaño tiene. % de la pantalla. */
export const MESA_DEFAULT = {
  tema: 'noche', // 'noche' | 'burdeos' | 'carbon' | 'caoba' | 'zafiro'
  cartaAncho: 82,
  cartaAlto: 118,
  pano: { x: 50, y: 46, ancho: 92, alto: 70 },
  nombre: { x: 18, y: 7, escala: 100 },
  saldo: { x: 84, y: 7, escala: 100 },
  mazo: { x: 86, y: 22, escala: 100 },
  crupier: { x: 50, y: 30, escala: 100 },
  aro: { x: 50, y: 48, escala: 100 },
  jugador: { x: 50, y: 66, escala: 100 },
  controles: { x: 50, y: 92, escala: 100 },
};

const TEMAS = new Set(['noche', 'burdeos', 'carbon', 'caoba', 'zafiro']);
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
  return {
    tema: TEMAS.has(m.tema) ? m.tema : D.tema,
    cartaAncho: clamp(Math.round(num(m.cartaAncho, D.cartaAncho)), 48, 150),
    cartaAlto: clamp(Math.round(num(m.cartaAlto, D.cartaAlto)), 68, 210),
    pano: panoDe(m.pano),
    nombre: zona(m.nombre, D.nombre),
    saldo: zona(m.saldo, D.saldo),
    mazo: zona(m.mazo, D.mazo),
    crupier: zona(m.crupier, D.crupier),
    aro: zona(m.aro, D.aro),
    jugador: zona(m.jugador, D.jugador),
    controles: zona(m.controles, D.controles),
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
  return {
    mazos: clamp(Math.round(Number(c.mazos) || CFG_DEFAULT.mazos), 1, 8),
    dealerSoft17: c.dealerSoft17 === 'pedir' ? 'pedir' : 'plantar',
    pagoBlackjack: clamp(Number(c.pagoBlackjack) || CFG_DEFAULT.pagoBlackjack, 1, 2),
    permitirDoblar: c.permitirDoblar !== false,
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
