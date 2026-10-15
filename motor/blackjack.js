// Reglas puras de Blackjack. Este módulo no conoce HTTP ni saldo: el
// endpoint guarda el mazo y decide cuándo cobrar o acreditar.
export const CFG_DEFAULT = {
  mazos: 6,
  dealerSoft17: 'plantar', // 'plantar' | 'pedir'
  pagoBlackjack: 1.5,
  permitirDoblar: true,
};

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});

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
