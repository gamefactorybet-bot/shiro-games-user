import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode, type Ref } from 'react';
import { nombreProveedor } from './marca.ts';
import { claveCarta } from './juego/blackjack.ts';
import { Fichas } from './Fichas.tsx';
import { fichasDe, fichasVistaDe } from '../motor/fichas.js';
import { valor } from '../motor/blackjack.js';
import type { AjusteBlackjackElem, BlackjackCfg, DisenoBlackjack, Ficha, Juego, PiezaBlackjack } from './types.ts';

export type CartaBj = { rango: string; palo: string } | null;
type PielBj = Pick<BlackjackCfg, 'reversoUrl' | 'cartas'>;

const roja = (palo?: string) => palo === '♥' || palo === '♦';

function Reverso({ piel, clase = '', estilo }: { piel: PielBj; clase?: string; estilo?: CSSProperties }) {
  return piel.reversoUrl
    ? <div className={`bj-carta bj-foto bj-dorso ${clase}`} style={{ ...estilo, backgroundImage: `url("${piel.reversoUrl}")` }} />
    : <div className={`bj-carta bj-oculta bj-dorso ${clase}`} style={estilo} aria-hidden><i /></div>;
}

function Cara({ carta, piel, clase = '', estilo }: {
  carta: { rango: string; palo: string };
  piel: PielBj;
  clase?: string;
  estilo?: CSSProperties;
}) {
  const foto = piel.cartas[claveCarta(carta.rango, carta.palo)];
  if (foto) return <div className={`bj-carta bj-foto bj-frente ${clase}`} style={{ ...estilo, backgroundImage: `url("${foto}")` }} />;
  return (
    <div className={`bj-carta bj-frente ${roja(carta.palo) ? 'roja' : ''} ${clase}`} style={estilo}>
      <b>{carta.rango}</b>
      <span>{carta.palo}</span>
    </div>
  );
}

function CartaVista({
  carta, oculta = false, piel, clase = '', delay = 0,
}: {
  carta: CartaBj;
  oculta?: boolean;
  piel: PielBj;
  clase?: string;
  delay?: number;
}) {
  const estilo = clase ? { animationDelay: `${delay}ms` } : undefined;
  if (clase === 'voltea' && carta) {
    return (
      <div className="bj-flip" style={estilo}>
        <Reverso piel={piel} />
        <Cara carta={carta} piel={piel} />
      </div>
    );
  }
  if (oculta || !carta) return <Reverso piel={piel} clase={clase} estilo={estilo} />;
  return <Cara carta={carta} piel={piel} clase={clase} estilo={estilo} />;
}

const firmaCarta = (c: CartaBj) => (c ? `${c.rango}${c.palo}` : 'back');

function efectosDe(antes: string[], ahora: string[]) {
  const hayVuelta = ahora.some((f, i) => antes[i] === 'back' && f !== 'back');
  let nuevas = 0;
  const base = hayVuelta ? 460 : 0;
  return ahora.map((f, i) => {
    const a = antes[i];
    if (a == null) {
      const delay = base + nuevas * 280;
      nuevas += 1;
      return { clase: 'entra', delay };
    }
    if (a === 'back' && f !== 'back') return { clase: 'voltea', delay: 0 };
    if (a !== f) return { clase: 'entra', delay: 0 };
    return { clase: '', delay: 0 };
  });
}

function useReparto(dealer: CartaBj[], jugador: CartaBj[]) {
  const prev = useRef<{ d: string[]; j: string[] }>({ d: [], j: [] });
  const fd = dealer.map(firmaCarta);
  const fj = jugador.map(firmaCarta);
  const key = `${fd.join('.')}|${fj.join('.')}`;
  const [visto, setVisto] = useState('');
  const [fx, setFx] = useState(() => ({
    dealer: fd.map(() => ({ clase: '', delay: 0 })),
    jugador: fj.map(() => ({ clase: '', delay: 0 })),
  }));
  if (key !== visto) {
    const antes = prev.current;
    const apertura = antes.d.length === 0 && antes.j.length === 0 && fd.length + fj.length > 1;
    const dealerFx = apertura
      ? fd.map((_, i) => ({ clase: 'entra', delay: 210 + i * 420 }))
      : efectosDe(antes.d, fd);
    const jugadorFx = apertura
      ? fj.map((_, i) => ({ clase: 'entra', delay: i * 420 }))
      : efectosDe(antes.j, fj);
    prev.current = { d: fd, j: fj };
    setVisto(key);
    setFx({ dealer: dealerFx, jugador: jugadorFx });
  }
  return fx;
}

type ManoVista = { j: CartaBj[]; d: CartaBj[] };

function clonarMano(m: ManoVista): ManoVista {
  return { j: m.j.slice(), d: m.d.slice() };
}

/** La mano que llega no sigue a la que está en la mesa: hay que repartir de cero. */
function manoDistinta(desde: CartaBj[], hacia: CartaBj[]): boolean {
  if (!desde.length || !hacia.length) return false;
  if (hacia.length < desde.length) return true;
  return desde.some((c, i) => firmaCarta(c) !== firmaCarta(hacia[i]));
}

/** Pasos de una partida en vivo: una carta por vez, en el orden del crupier. */
function armarPasos(desde: ManoVista, destino: ManoVista): ManoVista[] {
  let cur: ManoVista = manoDistinta(desde.j, destino.j) ? { j: [], d: [] } : clonarMano(desde);
  const pasos: ManoVista[] = [];
  const push = (m: ManoVista) => {
    cur = { j: m.j.slice(), d: m.d.slice() };
    pasos.push(cur);
  };

  if (cur.j.length === 0 && cur.d.length === 0 && destino.j.length > 0) {
    const j = destino.j;
    const d = destino.d;
    if (j[0]) push({ j: [j[0]], d: [] });
    if (d.length) push({ j: cur.j.slice(), d: [null] });
    if (j[1]) push({ j: j.slice(0, 2), d: cur.d.slice() });
    if (d[1]) push({ j: cur.j.slice(), d: [null, d[1]] });
    for (let n = cur.j.length; n < j.length; n++) push({ j: j.slice(0, n + 1), d: cur.d.slice() });
    if (d[0]) push({ j: cur.j.slice(), d: [d[0], ...cur.d.slice(1)] });
    for (let n = cur.d.length; n < d.length; n++) push({ j: cur.j.slice(), d: d.slice(0, n + 1) });
    return pasos;
  }

  for (let n = cur.j.length; n < destino.j.length; n++) push({ j: destino.j.slice(0, n + 1), d: cur.d.slice() });
  if (destino.d[0] && firmaCarta(cur.d[0]) !== firmaCarta(destino.d[0])) {
    const d = cur.d.slice();
    d[0] = destino.d[0];
    push({ j: cur.j.slice(), d });
  }
  for (let n = cur.d.length; n < destino.d.length; n++) push({ j: cur.j.slice(), d: destino.d.slice(0, n + 1) });
  return pasos;
}

function useManoEnVivo(dealer: CartaBj[], jugador: CartaBj[]) {
  const firma = `${dealer.map(firmaCarta).join('.')}|${jugador.map(firmaCarta).join('.')}`;
  const [vista, setVista] = useState<ManoVista>({ j: [], d: [] });
  const [aplicado, setAplicado] = useState('|');
  const vistaRef = useRef(vista);
  if (manoDistinta(vistaRef.current.j, jugador)) {
    const vacio = { j: [], d: [] };
    vistaRef.current = vacio;
    setVista(vacio);
  }
  useEffect(() => {
    const pasos = armarPasos(vistaRef.current, { j: jugador, d: dealer });
    if (!pasos.length) {
      setAplicado(firma);
      return;
    }
    const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const gap = reducido ? 40 : 1200;
    let i = 0;
    let timer = 0;
    let cancelado = false;
    const tick = () => {
      if (cancelado) return;
      if (i >= pasos.length) {
        setAplicado(firma);
        return;
      }
      const paso = pasos[i++];
      vistaRef.current = paso;
      setVista(paso);
      timer = window.setTimeout(tick, gap);
    };
    timer = window.setTimeout(tick, reducido ? 0 : 420);
    return () => {
      cancelado = true;
      window.clearTimeout(timer);
    };
  }, [firma]);
  const enCurso = firma !== aplicado && firma !== '|';
  return { vista: enCurso || firma !== '|' ? vista : { j: jugador, d: dealer }, enCurso };
}

function totalMano(cartas: CartaBj[]): number | null {
  if (!cartas.length || cartas.some((c) => !c)) return null;
  return (valor(cartas) as { total: number }).total;
}

function estiloZona(z: { x: number; y: number; escala: number }): CSSProperties {
  return {
    left: `${z.x}%`,
    top: `${z.y}%`,
    transform: `translate(-50%, -50%) scale(${z.escala / 100})`,
  };
}

export function MesaBlackjack({
  nombre, saldo, mensaje, dealer, jugador, piel, mesa, error, demo, anclaRef, ajuste, acciones, children,
}: {
  nombre: string;
  saldo: string;
  mensaje: string;
  dealer: CartaBj[];
  jugador: CartaBj[];
  piel: Pick<BlackjackCfg, 'reversoUrl' | 'cartas'>;
  mesa: DisenoBlackjack;
  error?: string;
  demo?: boolean;
  anclaRef?: Ref<HTMLElement>;
  /** Pieza marcada en la vista previa. Se puede arrastrar. */
  ajuste?: { elem: AjusteBlackjackElem; onMover: (x: number, y: number) => void } | null;
  /** Botones de la mano. Se ocultan mientras el crupier está repartiendo. */
  acciones?: ReactNode;
  children: ReactNode;
}) {
  const { vista, enCurso } = useManoEnVivo(dealer, jugador);
  const fx = useReparto(vista.d, vista.j);
  const totalD = totalMano(vista.d);
  const totalJ = totalMano(vista.j);
  const texto = enCurso ? 'Repartiendo…' : mensaje;

  const arrastre = (id: PiezaBlackjack) => {
    if (!ajuste || ajuste.elem !== id) return {};
    const mover = (e: ReactPointerEvent<HTMLElement>) => {
      const host = e.currentTarget.closest('.blackjack');
      if (!host) return;
      const r = host.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const x = Math.round(Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100)));
      const y = Math.round(Math.max(0, Math.min(100, ((e.clientY - r.top) / r.height) * 100)));
      ajuste.onMover(x, y);
    };
    return {
      onPointerDown: (e: ReactPointerEvent<HTMLElement>) => {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.setPointerCapture(e.pointerId);
      },
      onPointerMove: (e: ReactPointerEvent<HTMLElement>) => {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) mover(e);
      },
    };
  };

  const marca = (id: PiezaBlackjack) => (ajuste?.elem === id ? ' bj-marcada' : '');
  const vars = {
    '--bj-carta-w': `${mesa.cartaAncho}px`,
    '--bj-carta-h': `${mesa.cartaAlto}px`,
  } as CSSProperties;

  return (
    <main ref={anclaRef} className={`blackjack tema-${mesa.tema}${demo ? ' demo' : ''}`} style={vars} aria-busy={enCurso}>
      <style>{ESTILOS}</style>
      <section
        className={`bj-pano${marca('pano')}`}
        style={{ left: `${mesa.pano.x}%`, top: `${mesa.pano.y}%`, width: `${mesa.pano.ancho}%`, height: `${mesa.pano.alto}%` }}
        {...arrastre('pano')}
      >
        <div className="bj-riel" />
        <i className="bj-esquina a" />
        <i className="bj-esquina b" />
        <i className="bj-esquina c" />
        <i className="bj-esquina d" />
        <span className="bj-pozo" />
      </section>

      <div className={`bj-zona bj-nombre${marca('nombre')}`} style={estiloZona(mesa.nombre)} {...arrastre('nombre')}>
        <div className="bj-brand">{nombreProveedor()}</div>
        <strong>{nombre}</strong>
      </div>
      <div className={`bj-zona bj-saldo${marca('saldo')}`} style={estiloZona(mesa.saldo)} {...arrastre('saldo')}>
        Saldo <b>{saldo}</b>
      </div>

      <div className={`bj-zona${marca('mazo')}`} style={estiloZona(mesa.mazo)} {...arrastre('mazo')}>
        <div className="bj-mazo" aria-hidden>
          {[0, 1, 2].map((n) => (
            piel.reversoUrl
              ? <i key={n} className="bj-foto" style={{ backgroundImage: `url("${piel.reversoUrl}")` }} />
              : <i key={n} />
          ))}
        </div>
      </div>

      <div className={`bj-zona${marca('crupier')}`} style={estiloZona(mesa.crupier)} {...arrastre('crupier')}>
        <div className="bj-label">Crupier {totalD != null ? `· ${totalD}` : ''}</div>
        <div className="bj-mano">
          {vista.d.map((c, i) => (
            <CartaVista key={`d-${i}-${firmaCarta(c)}`} carta={c} oculta={!c} piel={piel} clase={fx.dealer[i]?.clase} delay={fx.dealer[i]?.delay} />
          ))}
        </div>
      </div>

      <div className={`bj-zona bj-centro${marca('aro')}`} style={estiloZona(mesa.aro)} {...arrastre('aro')}>
        <div className="bj-aro">Apuesta</div>
        <div className="bj-resultado" aria-live="polite">{texto}</div>
      </div>

      <div className={`bj-zona${marca('jugador')}`} style={estiloZona(mesa.jugador)} {...arrastre('jugador')}>
        <div className="bj-label">Jugador {totalJ != null ? `· ${totalJ}` : ''}</div>
        <div className="bj-mano">
          {vista.j.map((c, i) => (
            <CartaVista key={`j-${i}-${firmaCarta(c)}`} carta={c} piel={piel} clase={fx.jugador[i]?.clase} delay={fx.jugador[i]?.delay} />
          ))}
        </div>
      </div>

      <footer className={`bj-zona bj-bottom${marca('controles')}`} style={estiloZona(mesa.controles)} {...arrastre('controles')}>
        {children}
        {!enCurso && acciones}
        {error && <p className="bj-error">{error}</p>}
      </footer>
    </main>
  );
}

const ESTILOS = `
.blackjack{
  --bj-luz:rgba(120,24,36,.4);
  --bj-pano-a:#10261c;
  --bj-pano-b:#050d0a;
  --bj-madera:#0c0908;
  --bj-oro:#c6a15a;
  --bj-oro-suave:rgba(198,161,90,.32);
  --accent:var(--bj-oro);--accent-hover:#f6e7c1;
  --bj-carta-w:82px;--bj-carta-h:118px;
  --bj-btn-a:#f0d48a;--bj-btn-b:#b8883a;--bj-btn-ink:#1a120c;
  position:relative;min-height:100vh;box-sizing:border-box;color:#f4efe6;
  font-family:Inter,system-ui,sans-serif;
  background:
    radial-gradient(ellipse at 50% -8%, var(--bj-luz), transparent 46%),
    radial-gradient(ellipse at 50% 120%, #000 0%, #040507 58%);
}
.blackjack.tema-burdeos{
  --bj-luz:rgba(160,28,52,.5);
  --bj-pano-a:#341018;--bj-pano-b:#12060a;
  --bj-madera:#16090c;--bj-oro:#e0c089;
}
.blackjack.tema-carbon{
  --bj-luz:rgba(86,96,112,.32);
  --bj-pano-a:#1c1e26;--bj-pano-b:#08090c;
  --bj-madera:#121318;--bj-oro:#c2b09a;--bj-oro-suave:rgba(194,176,154,.3);
}
.blackjack.tema-caoba{
  --bj-luz:rgba(140,72,18,.42);
  --bj-pano-a:#3a1c0c;--bj-pano-b:#140904;
  --bj-madera:#1c0e08;--bj-oro:#e2a45c;--bj-oro-suave:rgba(226,164,92,.36);
  --bj-btn-a:#f3c48a;--bj-btn-b:#a86a28;
}
.blackjack.tema-zafiro{
  --bj-luz:rgba(46,82,150,.48);
  --bj-pano-a:#10203c;--bj-pano-b:#070b14;
  --bj-madera:#0c121e;--bj-oro:#c5d2e0;--bj-oro-suave:rgba(197,210,224,.34);
  --bj-btn-a:#e8eef6;--bj-btn-b:#8ea0b5;--bj-btn-ink:#121820;
}
.bj-zona{position:absolute;z-index:2;width:max-content;max-width:94vw;text-align:center}
.bj-nombre{text-align:left}
.bj-nombre strong{display:block;margin-top:2px;font-size:18px;font-weight:650}
.bj-brand{font-weight:800;letter-spacing:.22em;font-size:11px;color:var(--bj-oro);text-transform:uppercase}
.bj-marcada{outline:1px dashed var(--bj-oro);outline-offset:8px;cursor:grab;touch-action:none;z-index:6}
.bj-saldo{
  background:linear-gradient(180deg, rgba(18,14,12,.92), rgba(6,5,4,.94));
  border:1px solid var(--bj-oro-suave);padding:8px 14px;border-radius:999px;
  font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#cbb992;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.05), 0 10px 24px rgba(0,0,0,.45);
}
.bj-saldo b{color:#f3e2b8;font-weight:750;letter-spacing:0;font-size:15px;margin-left:6px}
.bj-pano{
  position:absolute;z-index:0;transform:translate(-50%,-50%);box-sizing:border-box;
  border-radius:46% 46% 18px 18px;
  background:
    radial-gradient(ellipse at 50% 38%, rgba(255,255,255,.045), transparent 24%),
    radial-gradient(ellipse at 50% 46%, rgba(0,0,0,.18), transparent 42%),
    radial-gradient(ellipse at 50% 78%, var(--bj-pano-a), var(--bj-pano-b) 74%);
  border:16px solid var(--bj-madera);
  box-shadow:
    inset 0 0 0 2px var(--bj-oro),
    inset 0 0 0 11px #120e0c,
    inset 0 0 120px rgba(0,0,0,.72),
    0 30px 60px rgba(0,0,0,.6);
}
.bj-pano.bj-marcada{cursor:grab;z-index:1}
.bj-riel{
  pointer-events:none;position:absolute;inset:16px 18px 14px;
  border-radius:42% 42% 12px 12px;
  border:1px solid var(--bj-oro-suave);
  box-shadow:inset 0 0 50px rgba(0,0,0,.35);
}
.bj-pozo{
  pointer-events:none;position:absolute;left:50%;top:48%;width:190px;height:78px;
  transform:translate(-50%,-50%);border-radius:50%;
  box-shadow:inset 0 0 0 1px var(--bj-oro-suave), inset 0 18px 30px rgba(0,0,0,.35);
}
.bj-esquina{
  pointer-events:none;position:absolute;width:9px;height:9px;border:1px solid var(--bj-oro);opacity:.7;
  transform:rotate(45deg);box-shadow:0 0 8px rgba(0,0,0,.6);
}
.bj-esquina.a{top:18%;left:10%}
.bj-esquina.b{top:18%;right:10%}
.bj-esquina.c{bottom:12%;left:7%}
.bj-esquina.d{bottom:12%;right:7%}
.bj-label{
  display:inline-block;margin-bottom:12px;padding:4px 12px;border-radius:999px;
  font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#e7d7b0;
  background:rgba(0,0,0,.55);border:1px solid var(--bj-oro-suave);
}
.bj-mano{display:flex;justify-content:center;min-height:124px;perspective:900px}
.bj-mano .bj-carta,.bj-mano .bj-flip{margin:0 -6px}
.bj-carta{
  width:var(--bj-carta-w);height:var(--bj-carta-h);border-radius:11px;padding:8px 8px 6px;box-sizing:border-box;
  text-align:left;display:flex;flex-direction:column;justify-content:space-between;
  font-family:Georgia,"Times New Roman",serif;
  background:linear-gradient(180deg,#fffdf8 0%,#f4ead8 100%);
  color:#1a140f;
  box-shadow:0 12px 18px rgba(0,0,0,.45), inset 0 0 0 1px rgba(255,255,255,.7);
}
.bj-flip{
  width:var(--bj-carta-w);height:var(--bj-carta-h);position:relative;flex:0 0 auto;transform-style:preserve-3d;
  animation:bj-voltea .72s ease both;
}
.bj-flip .bj-carta{position:absolute;inset:0;width:100%;height:100%;margin:0;backface-visibility:hidden}
.bj-flip .bj-frente{transform:rotateY(180deg)}
.bj-carta b{font-size:calc(var(--bj-carta-h) * .18);line-height:1}
.bj-carta span{font-size:calc(var(--bj-carta-h) * .24);line-height:.8;align-self:flex-end}
.bj-carta.roja{color:#9d1c2b}
.bj-carta.entra{animation:bj-reparte .74s cubic-bezier(.16,.84,.28,1) both}
@keyframes bj-reparte{
  0%{opacity:0;transform:translate(28vw,-24vh) rotate(18deg) scale(.62)}
  68%{opacity:1;transform:translate(0,8px) rotate(-3deg) scale(1.045)}
  100%{opacity:1;transform:none}
}
@keyframes bj-voltea{
  0%{transform:rotateY(0deg)}
  100%{transform:rotateY(180deg)}
}
@media (prefers-reduced-motion: reduce){
  .bj-carta.entra,.bj-flip{animation:none}
  .bj-flip{transform:rotateY(180deg)}
}
.blackjack .gw-ficha:hover,
.blackjack .gw-abanico-ficha:hover,
.blackjack .gw-columna-principal:hover,
.blackjack .gw-columna-item:hover{
  background:radial-gradient(circle at 32% 28%, #2b3140, #171a22);border-color:transparent;
}
.blackjack .gw-ficha.con-img:hover,
.blackjack .gw-abanico-ficha.con-img:hover,
.blackjack .gw-columna-principal.con-img:hover,
.blackjack .gw-columna-item.con-img:hover{background:transparent;border-color:transparent}
.blackjack .gw-ficha:active{transform:translate(-50%,-50%)}
.blackjack .gw-ficha.on:active{transform:translate(-50%,-50%) scale(1.09)}
.bj-mazo{position:relative;width:54px;height:76px}
.bj-mazo i{
  position:absolute;inset:0;border-radius:7px;
  background:
    radial-gradient(circle at 50% 50%, transparent 0 28%, rgba(198,161,90,.85) 30% 32%, transparent 34%),
    repeating-linear-gradient(135deg, #1a120e 0 3px, #2a1c14 3px 7px);
  box-shadow:inset 0 0 0 3px #120d0a, inset 0 0 0 4px #8d6a32, 0 8px 12px rgba(0,0,0,.4);
}
.bj-mazo i:nth-child(1){transform:translate(5px,-4px) rotate(7deg)}
.bj-mazo i:nth-child(2){transform:translate(2px,-1px) rotate(3deg)}
.bj-mazo i.bj-foto{background-color:#111;background-size:cover;background-position:center}
.bj-foto{padding:0;background:#0c0c0c center/contain no-repeat}
.bj-oculta{
  background:
    radial-gradient(circle at 50% 50%, transparent 0 16%, #c6a15a 17% 18%, transparent 19%),
    repeating-linear-gradient(135deg, #1a120e 0 3px, #24180f 3px 7px);
  box-shadow:0 12px 18px rgba(0,0,0,.45), inset 0 0 0 5px #120d0a, inset 0 0 0 6px #8d6a32;
  align-items:center;justify-content:center;
}
.bj-oculta i{
  width:22px;height:22px;border:1px solid #c6a15a;transform:rotate(45deg);
  box-shadow:0 0 0 4px rgba(198,161,90,.15);
}
.bj-centro{display:flex;flex-direction:column;align-items:center;gap:8px;text-align:center}
.bj-aro{
  width:168px;height:64px;border-radius:50%;
  border:1px dashed rgba(198,161,90,.55);
  display:grid;place-items:center;
  color:rgba(231,201,138,.7);letter-spacing:.22em;text-transform:uppercase;font-size:10px;
  box-shadow:inset 0 0 0 6px rgba(0,0,0,.15);
}
.bj-resultado{min-height:24px;font-weight:750;color:#f0d48a;letter-spacing:.02em}
.bj-bottom{display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap}
.bj-apuesta{
  display:flex;align-items:center;gap:8px;
  background:rgba(8,6,5,.72);border:1px solid rgba(198,161,90,.3);
  padding:8px 14px;border-radius:999px;color:#e7d7b0;letter-spacing:.08em;font-size:12px;text-transform:uppercase;
}
.bj-apuesta input{width:110px;background:transparent;color:#fff8ea;border:0;font-weight:700;font-size:16px;letter-spacing:0}
.bj-bottom button{
  border:0;border-radius:999px;cursor:pointer;
  background:linear-gradient(180deg,var(--bj-btn-a),var(--bj-btn-b));
  color:var(--bj-btn-ink);padding:12px 22px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;font-size:12px;
  box-shadow:0 8px 16px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.55);
}
.bj-bottom button.sec{
  background:linear-gradient(180deg,#2a2118,#14110e);color:#e7c98a;
  box-shadow:inset 0 0 0 1px rgba(198,161,90,.55);
}
.bj-bottom button:disabled{opacity:.4;cursor:not-allowed}
.bj-error{color:#ffb4b4;text-align:center;margin:0;width:100%}
@media(max-width:600px){
  .bj-pano{border-width:10px}
  .bj-aro{width:120px;height:48px}
  .bj-pozo{width:130px;height:54px}
}
`;

/** Fichas sobre la mesa del 21. Fila, abanico y columna usan el mismo ancla. */
export function FichasEnMesa({
  juego, host, apuesta, onElegir, bloqueado, editable, onMover, fichas,
}: {
  juego: Juego;
  host: HTMLElement | null;
  apuesta: number;
  onElegir: (valor: number) => void;
  bloqueado?: boolean;
  editable?: boolean;
  onMover?: (i: number, x: number, y: number) => void;
  fichas?: Ficha[];
}) {
  const lista = fichas ?? (fichasDe(juego) as Ficha[]);
  const vista = fichasVistaDe(juego) as {
    modo: 'fila' | 'abanico' | 'columna';
    abanicoApertura: number;
    abanicoArco: number;
    abanicoOrden?: 'lista' | 'valor' | 'valor-inv';
    abanicoSale?: 'izquierda' | 'centro' | 'derecha';
  };
  if (!host || !lista.length) return null;
  return (
    <Fichas
      host={host}
      fichas={lista}
      apuesta={apuesta}
      onElegir={onElegir}
      bloqueado={bloqueado}
      editable={editable}
      onMover={onMover}
      modo={vista.modo}
      abanicoApertura={vista.abanicoApertura}
      abanicoArco={vista.abanicoArco}
      abanicoOrden={vista.abanicoOrden}
      abanicoSale={vista.abanicoSale}
    />
  );
}
