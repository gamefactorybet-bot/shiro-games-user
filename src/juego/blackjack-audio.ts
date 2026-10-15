type SonidoBj = 'boton' | 'ficha' | 'carta' | 'voltear' | 'gano' | 'empate' | 'perdio';

let contexto: AudioContext | null = null;

function ctx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  contexto ||= new Ctx();
  if (contexto.state === 'suspended') void contexto.resume();
  return contexto;
}

function tono(c: AudioContext, inicio: number, frecuencia: number, duracion: number, volumen: number, tipo: OscillatorType = 'sine') {
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = tipo; o.frequency.setValueAtTime(frecuencia, inicio);
  g.gain.setValueAtTime(0.0001, inicio);
  g.gain.exponentialRampToValueAtTime(volumen, inicio + .012);
  g.gain.exponentialRampToValueAtTime(0.0001, inicio + duracion);
  o.connect(g).connect(c.destination); o.start(inicio); o.stop(inicio + duracion + .02);
}

export function sonidoBlackjack(tipo: SonidoBj, habilitado = true) {
  if (!habilitado) return;
  const c = ctx(); if (!c) return;
  const t = c.currentTime;
  if (tipo === 'boton') tono(c, t, 240, .07, .035, 'triangle');
  if (tipo === 'ficha') { tono(c, t, 520, .06, .028, 'square'); tono(c, t + .045, 310, .08, .02, 'triangle'); }
  if (tipo === 'carta') { tono(c, t, 128, .055, .018, 'sawtooth'); tono(c, t + .025, 82, .07, .014, 'triangle'); }
  if (tipo === 'voltear') { tono(c, t, 180, .09, .025, 'triangle'); tono(c, t + .07, 360, .11, .025, 'sine'); }
  if (tipo === 'gano') [523, 659, 784].forEach((f, i) => tono(c, t + i * .1, f, .34, .045, 'sine'));
  if (tipo === 'empate') { tono(c, t, 330, .2, .03, 'sine'); tono(c, t + .12, 330, .22, .025, 'sine'); }
  if (tipo === 'perdio') { tono(c, t, 220, .22, .025, 'triangle'); tono(c, t + .11, 165, .3, .02, 'triangle'); }
}
