import { useEffect, useLayoutEffect, useRef, useState, type AnimationEvent as ReactAnimationEvent, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode, type Ref } from 'react';
import { nombreProveedor } from './marca.ts';
import { claveCarta } from './juego/blackjack.ts';
import { Fichas } from './Fichas.tsx';
import { fichasDe, fichasVistaDe } from '../motor/fichas.js';
import { valor } from '../motor/blackjack.js';
import type { AjusteBlackjackElem, BlackjackCfg, DisenoBlackjack, Ficha, Juego, PiezaBlackjack } from './types.ts';

export type CartaBj = { rango: string; palo: string } | null;
type PielBj = Pick<BlackjackCfg, 'reversoUrl' | 'cartas'>;

const roja = (palo?: string) => palo === '♥' || palo === '♦';

function Reverso({ piel, clase = '', estilo, ancla, alVolar }: {
  piel: PielBj; clase?: string; estilo?: CSSProperties; ancla?: Ref<HTMLDivElement>;
  alVolar?: (e: ReactAnimationEvent<HTMLDivElement>) => void;
}) {
  return piel.reversoUrl
    ? <div ref={ancla} className={`bj-carta bj-foto bj-dorso ${clase}`} style={{ ...estilo, backgroundImage: `url("${piel.reversoUrl}")` }} onAnimationEnd={alVolar} />
    : <div ref={ancla} className={`bj-carta bj-oculta bj-dorso ${clase}`} style={estilo} aria-hidden onAnimationEnd={alVolar}><i /></div>;
}

function Cara({ carta, piel, clase = '', estilo, ancla, alVolar }: {
  carta: { rango: string; palo: string };
  piel: PielBj;
  clase?: string;
  estilo?: CSSProperties;
  ancla?: Ref<HTMLDivElement>;
  alVolar?: (e: ReactAnimationEvent<HTMLDivElement>) => void;
}) {
  const foto = piel.cartas[claveCarta(carta.rango, carta.palo)];
  if (foto) return <div ref={ancla} className={`bj-carta bj-foto bj-frente ${clase}`} style={{ ...estilo, backgroundImage: `url("${foto}")` }} onAnimationEnd={alVolar} />;
  return (
    <div ref={ancla} className={`bj-carta bj-frente ${roja(carta.palo) ? 'roja' : ''} ${clase}`} style={estilo} onAnimationEnd={alVolar}>
      <b>{carta.rango}</b>
      <span>{carta.palo}</span>
    </div>
  );
}

/** Cuánto hay que trasladar la carta, en su propio eje, para que arranque en el centro del mazo. */
function salidaDelMazo(carta: HTMLElement): CSSProperties | null {
  const mazo = carta.closest('.blackjack')?.querySelector('.bj-mazo');
  if (!(mazo instanceof HTMLElement)) return null;
  const destino = carta.getBoundingClientRect();
  const origen = mazo.getBoundingClientRect();
  if (!destino.width || !destino.height || !origen.width) return null;
  const zona = carta.closest('.bj-zona');
  const escala = zona instanceof HTMLElement && zona.offsetWidth
    ? zona.getBoundingClientRect().width / zona.offsetWidth
    : 1;
  const s = escala || 1;
  return {
    '--bj-dx': `${((origen.left + origen.width / 2) - (destino.left + destino.width / 2)) / s}px`,
    '--bj-dy': `${((origen.top + origen.height / 2) - (destino.top + destino.height / 2)) / s}px`,
    '--bj-escala': String(Math.max(0.45, Math.min(1, origen.width / destino.width))),
  } as CSSProperties;
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
  const ancla = useRef<HTMLDivElement>(null);
  const [vuelo, setVuelo] = useState<CSSProperties | null>(clase === 'entra' ? null : {});
  const [volo, setVolo] = useState(clase !== 'entra');
  useLayoutEffect(() => {
    if (clase !== 'entra' || volo) return;
    const el = ancla.current;
    const quieto = !!el?.closest('.mov-reducido') || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!el || quieto) { setVuelo({}); setVolo(true); return; }
    setVuelo(salidaDelMazo(el) ?? {});
  }, [clase, volo]);
  const estilo: CSSProperties | undefined = clase && !volo
    ? { animationDelay: `${delay}ms`, ...(vuelo ?? {}) }
    : undefined;
  const claseVista = clase !== 'entra' || volo ? '' : !vuelo ? 'entra espera' : 'entra';
  const alVolar = (e: ReactAnimationEvent<HTMLDivElement>) => {
    if (e.animationName === 'bj-reparte') setVolo(true);
  };
  if (clase === 'voltea' && carta) {
    return (
      <div className="bj-flip" style={estilo}>
        <Reverso piel={piel} />
        <Cara carta={carta} piel={piel} />
      </div>
    );
  }
  if (oculta || !carta) return <Reverso piel={piel} clase={claseVista} estilo={estilo} ancla={ancla} alVolar={alVolar} />;
  return <Cara carta={carta} piel={piel} clase={claseVista} estilo={estilo} ancla={ancla} alVolar={alVolar} />;
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
  nombre, saldo, apuesta, mensaje, resultado, dealer, jugador, piel, mesa, error, demo,
  mostrarNombre = true, anclaRef, ajuste, acciones, children, movimiento = 'cinematico', ambiente = 80,
}: {
  nombre: string;
  saldo: string;
  apuesta?: string;
  mensaje: string;
  resultado?: 'en_curso' | 'gano' | 'perdio' | 'empate' | null;
  dealer: CartaBj[];
  jugador: CartaBj[];
  piel: Pick<BlackjackCfg, 'reversoUrl' | 'cartas'>;
  mesa: DisenoBlackjack;
  error?: string;
  demo?: boolean;
  /** El cartel con la marca y el nombre del juego. */
  mostrarNombre?: boolean;
  anclaRef?: Ref<HTMLElement>;
  /** Pieza marcada en la vista previa. Se puede arrastrar. */
  ajuste?: { elem: AjusteBlackjackElem; onMover: (x: number, y: number) => void } | null;
  /** Botones de la mano. Se ocultan mientras el crupier está repartiendo. */
  acciones?: ReactNode;
  children: ReactNode;
  movimiento?: 'cinematico' | 'rapido' | 'reducido';
  ambiente?: number;
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
    '--bj-ambiente': `${Math.max(0, Math.min(100, ambiente)) / 100}`,
    '--bj-velocidad': movimiento === 'rapido' ? '.46s' : movimiento === 'reducido' ? '.01s' : '.78s',
  } as CSSProperties;

  return (
    <main ref={anclaRef} className={`blackjack tema-${mesa.tema} mov-${movimiento}${demo ? ' demo' : ''}${resultado && resultado !== 'en_curso' ? ` resultado-${resultado}` : ''}`} style={vars} aria-busy={enCurso}>
      <style>{ESTILOS}</style>
      <div className="bj-ambiente" aria-hidden><i /><i /><i /><i /><b /><b /></div>
      <div className="bj-vineta" aria-hidden />
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
        <div className="bj-reglas" aria-hidden>
          <span>BLACKJACK PAGA 3 A 2</span><i>•</i><span>CRUPIER SE PLANTA EN 17</span>
        </div>
      </section>

      {mostrarNombre && (
        <div className={`bj-zona bj-nombre${marca('nombre')}`} style={estiloZona(mesa.nombre)} {...arrastre('nombre')}>
          <div className="bj-brand">{nombreProveedor()}</div>
          <strong>{nombre}</strong>
        </div>
      )}
      <div className={`bj-zona bj-saldo${marca('saldo')}`} style={estiloZona(mesa.saldo)} {...arrastre('saldo')}>
        Saldo <b>{saldo}</b>
      </div>

      <div className={`bj-zona${marca('mazo')}`} style={estiloZona(mesa.mazo)} {...arrastre('mazo')}>
        <div className={`bj-mazo${vista.d.length + vista.j.length ? ' sale' : ''}`} key={vista.d.length + vista.j.length} aria-hidden>
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
        <div className="bj-aro"><small>Apuesta</small>{apuesta && <b>{apuesta}</b>}</div>
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
  --bj-bg-a:#102219;--bj-bg-b:#030806;--bj-text:#f4efe6;
  --bj-card-a:#fffefb;--bj-card-b:#eee5d6;--bj-rojo:#a81f32;
  --bj-textura:radial-gradient(circle at 50% 50%,rgba(255,255,255,.025) 0 1px,transparent 1.5px);
  --bj-motivo:radial-gradient(circle at 50% 50%,rgba(255,255,255,.035) 0 1px,transparent 1.5px);
  --bj-ambiente: .8;--bj-velocidad:.78s;
  position:relative;min-height:100vh;box-sizing:border-box;color:var(--bj-text);
  overflow:hidden;font-family:"Avenir Next","Manrope","Inter",ui-sans-serif,system-ui,sans-serif;
  background:
    radial-gradient(ellipse at 50% -8%, var(--bj-luz), transparent 46%),
    var(--bj-textura),
    radial-gradient(ellipse at 50% 120%, var(--bj-bg-b) 0%, var(--bj-bg-a) 58%,var(--bj-bg-b) 100%);
  background-size:auto,14px 14px,auto;
  isolation:isolate;
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
.blackjack.tema-monaco{
  --bj-luz:rgba(255,235,193,.5);--bj-pano-a:#d8c9aa;--bj-pano-b:#8d7654;
  --bj-madera:#e5d8bd;--bj-oro:#9c6e2e;--bj-oro-suave:rgba(156,110,46,.38);
  --bj-bg-a:#d8d0bf;--bj-bg-b:#8c806b;--bj-text:#201c16;
  --bj-btn-a:#fff1c6;--bj-btn-b:#bd9147;--bj-btn-ink:#251b0e;
}
.blackjack.tema-artdeco{
  --bj-luz:rgba(214,174,76,.42);--bj-pano-a:#20201e;--bj-pano-b:#080807;
  --bj-madera:#050505;--bj-oro:#e3bd5e;--bj-oro-suave:rgba(227,189,94,.4);
  --bj-bg-a:#171612;--bj-bg-b:#030303;
  --bj-textura:repeating-linear-gradient(135deg,transparent 0 34px,rgba(227,189,94,.035) 35px 36px);
  --bj-motivo:linear-gradient(45deg,transparent 47%,rgba(227,189,94,.08) 48% 52%,transparent 53%),linear-gradient(-45deg,transparent 47%,rgba(227,189,94,.08) 48% 52%,transparent 53%);
}
.blackjack.tema-neon{
  --bj-luz:rgba(213,47,255,.5);--bj-pano-a:#17215d;--bj-pano-b:#080a28;
  --bj-madera:#090a1a;--bj-oro:#6ceeff;--bj-oro-suave:rgba(108,238,255,.38);
  --bj-bg-a:#0d1033;--bj-bg-b:#030413;--bj-btn-a:#fd78ff;--bj-btn-b:#8150ff;--bj-btn-ink:#110b27;
  --bj-textura:linear-gradient(rgba(89,223,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,90,236,.025) 1px,transparent 1px);
  --bj-motivo:linear-gradient(rgba(108,238,255,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(240,92,255,.06) 1px,transparent 1px);
}
.blackjack.tema-artico{
  --bj-luz:rgba(140,226,255,.55);--bj-pano-a:#d9edf0;--bj-pano-b:#6d9ca7;
  --bj-madera:#b9d2d6;--bj-oro:#25768a;--bj-oro-suave:rgba(37,118,138,.35);
  --bj-bg-a:#d9e8eb;--bj-bg-b:#6c9098;--bj-text:#13262b;
  --bj-btn-a:#ecfdff;--bj-btn-b:#72bbc9;--bj-btn-ink:#102b31;
  --bj-motivo:linear-gradient(120deg,transparent 35%,rgba(255,255,255,.13) 36% 37%,transparent 38% 66%,rgba(255,255,255,.09) 67% 68%,transparent 69%);
}
.blackjack.tema-imperial{
  --bj-luz:rgba(218,34,48,.52);--bj-pano-a:#6e111c;--bj-pano-b:#200508;
  --bj-madera:#150405;--bj-oro:#e1b45b;--bj-oro-suave:rgba(225,180,91,.42);
  --bj-bg-a:#36070c;--bj-bg-b:#090102;--bj-btn-a:#f0c96e;--bj-btn-b:#ae7424;
  --bj-motivo:radial-gradient(circle,transparent 0 45%,rgba(225,180,91,.08) 46% 48%,transparent 49%);
}
.blackjack.tema-havana{
  --bj-luz:rgba(151,97,47,.45);--bj-pano-a:#3e4b2d;--bj-pano-b:#141c0d;
  --bj-madera:#35180c;--bj-oro:#c98c4e;--bj-oro-suave:rgba(201,140,78,.38);
  --bj-bg-a:#2b2118;--bj-bg-b:#0d0906;--bj-btn-a:#ddb078;--bj-btn-b:#8d562a;
  --bj-motivo:repeating-linear-gradient(22deg,transparent 0 8px,rgba(255,240,205,.025) 9px 10px);
}
.blackjack.tema-perla{
  --bj-luz:rgba(255,255,255,.62);--bj-pano-a:#e6e2d8;--bj-pano-b:#a7a69f;
  --bj-madera:#ded9ce;--bj-oro:#616866;--bj-oro-suave:rgba(66,74,72,.3);
  --bj-bg-a:#dedbd3;--bj-bg-b:#858882;--bj-text:#171b1a;
  --bj-btn-a:#fff;--bj-btn-b:#aeb3b0;--bj-btn-ink:#171b1a;
  --bj-motivo:linear-gradient(135deg,rgba(255,255,255,.1),transparent 40%,rgba(35,44,42,.035));
}
.bj-ambiente,.bj-vineta{position:absolute;inset:0;pointer-events:none;z-index:0}
.bj-vineta{z-index:8;box-shadow:inset 0 0 160px rgba(0,0,0,.58)}
.bj-ambiente{opacity:var(--bj-ambiente);overflow:hidden}
.bj-ambiente i{position:absolute;width:34vw;height:34vw;border-radius:50%;filter:blur(70px);background:var(--bj-luz);animation:bj-flotar 11s ease-in-out infinite alternate}
.bj-ambiente i:nth-child(1){left:-12%;top:-18%}.bj-ambiente i:nth-child(2){right:-12%;top:2%;animation-delay:-4s}.bj-ambiente i:nth-child(3){left:28%;bottom:-32%;animation-delay:-7s}.bj-ambiente i:nth-child(4){right:20%;bottom:-26%;animation-delay:-2s}
.bj-ambiente b{position:absolute;width:2px;height:2px;border-radius:50%;background:var(--bj-oro);box-shadow:12vw 8vh 0 var(--bj-oro),31vw 16vh 0 var(--bj-oro),54vw 7vh 0 var(--bj-oro),76vw 23vh 0 var(--bj-oro),88vw 12vh 0 var(--bj-oro),18vw 73vh 0 var(--bj-oro),68vw 81vh 0 var(--bj-oro);opacity:.36;animation:bj-destello 4s ease-in-out infinite}
.bj-ambiente b:nth-of-type(1){left:8%;top:16%}.bj-ambiente b:nth-of-type(2){left:2%;top:48%;animation-delay:-2s}
@keyframes bj-flotar{to{transform:translate(8vw,5vh) scale(1.18)}}
@keyframes bj-destello{50%{opacity:.08;transform:scale(.5)}}
.bj-zona{position:absolute;z-index:2;width:max-content;max-width:94vw;text-align:center}
.bj-nombre{text-align:left}
.bj-nombre strong{display:block;margin-top:3px;font-size:19px;font-weight:560;letter-spacing:-.025em;color:var(--bj-text)}
.bj-brand{font-weight:750;letter-spacing:.28em;font-size:10px;color:var(--bj-oro);text-transform:uppercase}
.bj-marcada{outline:1px dashed var(--bj-oro);outline-offset:8px;cursor:grab;touch-action:none;z-index:6}
.bj-saldo{
  background:linear-gradient(180deg, rgba(18,14,12,.92), rgba(6,5,4,.94));
  border:1px solid var(--bj-oro-suave);padding:8px 14px;border-radius:999px;
  font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#cbb992;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.05), 0 10px 24px rgba(0,0,0,.45);
}
.bj-saldo b{color:#f3e2b8;font-weight:750;letter-spacing:0;font-size:15px;margin-left:6px}
.bj-pano{
  position:absolute;z-index:0;transform:translate(-50%,-50%);box-sizing:border-box;overflow:hidden;
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
.bj-pano::before{content:"";position:absolute;inset:26px;border-radius:40% 40% 10px 10px;background:var(--bj-motivo);background-size:32px 32px;opacity:.8;pointer-events:none;mask-image:linear-gradient(to bottom,black,transparent 86%)}
.bj-reglas{position:absolute;left:50%;top:10%;transform:translateX(-50%);display:flex;align-items:center;gap:14px;white-space:nowrap;color:var(--bj-oro);opacity:.6;font-size:9px;font-weight:650;letter-spacing:.22em;text-transform:uppercase}
.bj-reglas i{font-style:normal;opacity:.55}
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
  font-family:"Iowan Old Style","Baskerville",Georgia,serif;
  background:linear-gradient(150deg,var(--bj-card-a) 0%,var(--bj-card-b) 100%);
  color:#1a140f;
  border:1px solid rgba(255,255,255,.72);box-shadow:0 16px 26px rgba(0,0,0,.48), inset 0 0 0 1px rgba(40,30,18,.09);
}
.bj-flip{
  width:var(--bj-carta-w);height:var(--bj-carta-h);position:relative;flex:0 0 auto;transform-style:preserve-3d;
  animation:bj-voltea .72s ease both;
}
.bj-flip .bj-carta{position:absolute;inset:0;width:100%;height:100%;margin:0;backface-visibility:hidden}
.bj-flip .bj-frente{transform:rotateY(180deg)}
.bj-carta b{font-size:calc(var(--bj-carta-h) * .18);line-height:1}
.bj-carta span{font-size:calc(var(--bj-carta-h) * .24);line-height:.8;align-self:flex-end}
.bj-carta.roja{color:var(--bj-rojo)}
.bj-carta.entra{
  --bj-dx:18vw;--bj-dy:-16vh;--bj-escala:.72;--bj-giro:12deg;
  position:relative;z-index:3;
  animation:bj-reparte var(--bj-velocidad) cubic-bezier(.22,.7,.2,1) both;
}
.bj-carta.entra.espera{opacity:0;animation:none}
.bj-zona:has(.bj-carta.entra){z-index:7}
@keyframes bj-reparte{
  0%{opacity:1;transform:translate(var(--bj-dx),var(--bj-dy)) rotate(var(--bj-giro)) scale(var(--bj-escala))}
  55%{opacity:1;transform:translate(calc(var(--bj-dx) * .28), calc(var(--bj-dy) * .28 - 22px)) rotate(4deg) scale(1.02)}
  100%{opacity:1;transform:none}
}
@keyframes bj-voltea{
  0%{transform:rotateY(0deg)}
  100%{transform:rotateY(180deg)}
}
@media (prefers-reduced-motion: reduce){
  .bj-carta.entra,.bj-carta.entra.espera,.bj-flip,.bj-mazo.sale{animation:none;opacity:1}
  .bj-flip{transform:rotateY(180deg)}
}
.mov-reducido .bj-carta.entra,.mov-reducido .bj-carta.entra.espera,.mov-reducido .bj-mazo.sale{animation:none;opacity:1;transform:none}
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
.bj-mazo.sale{animation:bj-mazo-sale .42s ease}
@keyframes bj-mazo-sale{
  0%{transform:none}
  40%{transform:translate(-7px,5px) rotate(-6deg)}
  100%{transform:none}
}
.bj-mazo i{
  position:absolute;inset:0;border-radius:7px;
  background:
    radial-gradient(circle at 50% 50%, transparent 0 28%, var(--bj-oro) 30% 32%, transparent 34%),
    repeating-linear-gradient(135deg, #1a120e 0 3px, #2a1c14 3px 7px);
  box-shadow:inset 0 0 0 3px #120d0a, inset 0 0 0 4px #8d6a32, 0 8px 12px rgba(0,0,0,.4);
}
.bj-mazo i:nth-child(1){transform:translate(5px,-4px) rotate(7deg)}
.bj-mazo i:nth-child(2){transform:translate(2px,-1px) rotate(3deg)}
.bj-mazo i.bj-foto{background-color:#111;background-size:cover;background-position:center}
.bj-foto{padding:0;background:#0c0c0c center/contain no-repeat}
.bj-oculta{
  background:
    radial-gradient(circle at 50% 50%, transparent 0 16%, var(--bj-oro) 17% 18%, transparent 19%),
    repeating-linear-gradient(135deg, #1a120e 0 3px, #24180f 3px 7px);
  box-shadow:0 12px 18px rgba(0,0,0,.45), inset 0 0 0 5px #120d0a, inset 0 0 0 6px #8d6a32;
  align-items:center;justify-content:center;
}
.bj-oculta i{
  width:22px;height:22px;border:1px solid var(--bj-oro);transform:rotate(45deg);
  box-shadow:0 0 0 4px rgba(198,161,90,.15);
}
.bj-centro{display:flex;flex-direction:column;align-items:center;gap:8px;text-align:center}
.bj-aro{
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;
  color:rgba(231,201,138,.7);letter-spacing:.22em;text-transform:uppercase;font-size:10px;
}
.bj-aro small{font-size:9px;letter-spacing:.22em}.bj-aro b{font-size:17px;letter-spacing:-.02em;color:var(--bj-oro)}
.bj-resultado{min-height:24px;font-weight:680;color:var(--bj-oro);letter-spacing:-.01em;text-shadow:0 2px 14px rgba(0,0,0,.75)}
.bj-bottom{display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap}
.bj-apuesta{
  display:flex;align-items:center;gap:8px;
  background:rgba(8,6,5,.72);border:1px solid rgba(198,161,90,.3);
  padding:8px 14px;border-radius:999px;color:#e7d7b0;letter-spacing:.08em;font-size:12px;text-transform:uppercase;
}
.bj-apuesta input{width:110px;background:transparent;color:#fff8ea;border:0;font-weight:700;font-size:16px;letter-spacing:0}
.bj-stepper{gap:5px}.bj-stepper span{margin:0 4px}.bj-stepper button{min-width:30px!important;width:30px;height:30px;padding:0!important;border-radius:50%!important;background:rgba(255,255,255,.08)!important;color:var(--bj-oro)!important;box-shadow:inset 0 0 0 1px var(--bj-oro-suave)!important;font-size:15px!important}.bj-stepper button::after{display:none}
.bj-bottom button{
  position:relative;overflow:hidden;border:0;border-radius:999px;cursor:pointer;min-width:120px;
  background:linear-gradient(180deg,var(--bj-btn-a),var(--bj-btn-b));
  color:var(--bj-btn-ink);padding:12px 22px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;font-size:12px;
  box-shadow:0 10px 24px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.55);transition:transform .18s ease,filter .18s ease,box-shadow .18s ease;
}
.bj-bottom button::after{content:"";position:absolute;inset:0;background:linear-gradient(110deg,transparent 20%,rgba(255,255,255,.5) 48%,transparent 72%);transform:translateX(-140%);transition:transform .55s ease}
.bj-bottom button:hover:not(:disabled){transform:translateY(-2px);filter:saturate(1.12);box-shadow:0 15px 30px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,255,255,.65)}
.bj-bottom button:hover:not(:disabled)::after{transform:translateX(140%)}
.bj-bottom button:active:not(:disabled){transform:translateY(1px) scale(.98)}
.bj-bottom button.sec{
  background:linear-gradient(180deg,#2a2118,#14110e);color:#e7c98a;
  box-shadow:inset 0 0 0 1px rgba(198,161,90,.55);
}
.bj-bottom button:disabled{opacity:.4;cursor:not-allowed}
.resultado-gano .bj-resultado{animation:bj-ganar .8s ease both}.resultado-empate .bj-resultado{color:#d7e6ea}.resultado-perdio .bj-resultado{color:#d69a9a}
.resultado-gano .bj-aro{animation:bj-premio 1.6s ease-in-out infinite}
.resultado-gano .bj-ambiente b{animation:bj-lluvia 1.8s ease-out infinite;opacity:.9}
@keyframes bj-ganar{0%{opacity:0;transform:scale(.8)}65%{transform:scale(1.08)}100%{opacity:1;transform:none}}
@keyframes bj-premio{50%{filter:brightness(1.45);transform:scale(1.035)}}
@keyframes bj-lluvia{0%{transform:translateY(-18vh) rotate(0);opacity:0}25%{opacity:.9}100%{transform:translateY(72vh) rotate(180deg);opacity:0}}
.mov-reducido *{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}
.bj-error{color:#ffb4b4;text-align:center;margin:0;width:100%}
@media(max-width:600px){
  .bj-pano{border-width:10px}
  .bj-pozo{width:130px;height:54px}
  .bj-reglas{font-size:7px;gap:7px;letter-spacing:.12em}
  .bj-bottom{width:min(94vw,420px);gap:8px}.bj-bottom button{min-width:100px;padding:11px 15px}
  .bj-vineta{box-shadow:inset 0 0 80px rgba(0,0,0,.48)}
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
