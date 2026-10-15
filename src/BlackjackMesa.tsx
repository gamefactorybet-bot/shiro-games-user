import { useEffect, useLayoutEffect, useRef, useState, type AnimationEvent as ReactAnimationEvent, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode, type Ref } from 'react';
import { nombreProveedor } from './marca.ts';
import { claveCarta, fondoTemaBlackjack } from './juego/blackjack.ts';
import { Fichas } from './Fichas.tsx';
import { fichasDe, fichasVistaDe } from '../motor/fichas.js';
import { valor } from '../motor/blackjack.js';
import type { AjusteBlackjackElem, BlackjackCfg, DisenoBlackjack, Ficha, Juego, PiezaBlackjack } from './types.ts';

export type CartaBj = { rango: string; palo: string } | null;
type PielBj = Pick<BlackjackCfg, 'fondoUrl' | 'reversoUrl' | 'cartas'>;

const roja = (palo?: string) => palo === '♥' || palo === '♦';

export function IconoBj({ tipo }: { tipo: 'pedir' | 'plantar' | 'doblar' | 'repartir' | 'mas' | 'menos' | 'pica' }) {
  if (tipo === 'pedir') return (
    <svg className="bj-icono" viewBox="0 0 24 24" aria-hidden>
      <rect x="4" y="7" width="10" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-4" /><path d="M9 11v5M6.5 13.5h5" />
    </svg>
  );
  if (tipo === 'plantar') return (
    <svg className="bj-icono" viewBox="0 0 24 24" aria-hidden>
      <path d="M7.5 11V6.6a1.4 1.4 0 0 1 2.8 0V10 5.3a1.4 1.4 0 0 1 2.8 0V10 6.1a1.4 1.4 0 0 1 2.8 0v4.5-2.5a1.4 1.4 0 0 1 2.8 0v6.2c0 4.3-2.7 6.7-6.4 6.7h-.8c-2.3 0-3.8-1-5-2.7l-2.3-3.4a1.5 1.5 0 0 1 2.2-2l2.1 1.6" />
    </svg>
  );
  if (tipo === 'doblar') return (
    <svg className="bj-icono" viewBox="0 0 24 24" aria-hidden>
      <path d="M4 7h9M10 4l3 3-3 3M20 17h-9M14 14l-3 3 3 3" /><path d="m7 14 4-4M7 10l4 4" />
    </svg>
  );
  if (tipo === 'mas' || tipo === 'menos') return (
    <svg className="bj-icono" viewBox="0 0 24 24" aria-hidden><path d="M5 12h14" />{tipo === 'mas' && <path d="M12 5v14" />}</svg>
  );
  return (
    <svg className="bj-icono" viewBox="0 0 24 24" aria-hidden>
      <path className="relleno" d="M12 2.8C10.5 5.3 5.2 8.3 5.2 13a4.1 4.1 0 0 0 7 2.9c-.2 2.1-1 3.7-2.8 5.3h5.2c-1.8-1.6-2.6-3.2-2.8-5.3a4.1 4.1 0 0 0 7-2.9c0-4.7-5.3-7.7-6.8-10.2Z" />
    </svg>
  );
}

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
      <span className="bj-indice"><b>{carta.rango}</b><i>{carta.palo}</i></span>
      <span className="bj-palo-central">{carta.palo}</span>
      <span className="bj-indice invertido"><b>{carta.rango}</b><i>{carta.palo}</i></span>
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

function estiloAbanico(i: number, total: number, jugador: boolean): CSSProperties {
  const centro = (total - 1) / 2;
  const distancia = i - centro;
  // Pila direccional: cada carta nueva se monta desde la derecha sobre la
  // anterior. Las primeras tres quedan prácticamente paralelas para que sus
  // bordes no se crucen; las manos largas reciben apenas un abanico.
  const pasoGiro = total <= 3 ? 0 : total === 4 ? 1.15 : 1.45;
  const giro = Math.max(-4.5, Math.min(4.5, distancia * pasoGiro * (jugador ? 1 : .72)));
  const caida = total <= 3 ? 0 : Math.abs(distancia) * (jugador ? 1.15 : .8);
  const solape = total <= 2 ? -12 : total === 3 ? -15 : total === 4 ? -19 : total === 5 ? -23 : -27;
  return {
    '--bj-fan-rot': `${giro}deg`,
    '--bj-fan-y': `${caida}px`,
    '--bj-fan-z': 20 + i,
    '--bj-fan-solape': `${solape}px`,
  } as CSSProperties;
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
  piel: Pick<BlackjackCfg, 'fondoUrl' | 'reversoUrl' | 'cartas'>;
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
  const [menuAbierto, setMenuAbierto] = useState(false);
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
      <div className="bj-fondo" style={{ backgroundImage: `url("${piel.fondoUrl || fondoTemaBlackjack(mesa.tema)}")` }} aria-hidden />
      <div className="bj-tinte" aria-hidden />
      <div className="bj-ambiente" aria-hidden><i /><i /><i /><i /><b /><b /></div>
      <div className="bj-vineta" aria-hidden />
      <button className={`bj-menu${menuAbierto ? ' abierto' : ''}`} type="button" aria-label="Información de la mesa" aria-expanded={menuAbierto} onClick={() => setMenuAbierto((v) => !v)}>
        <i /><i /><i />
      </button>
      {menuAbierto && (
        <aside className="bj-menu-panel">
          <b>Mesa Blackjack</b>
          <span>Blackjack paga 3 a 2</span>
          <span>El crupier se planta en 17</span>
          <small>{nombreProveedor()}</small>
        </aside>
      )}
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
        <div className="bj-reglas" aria-hidden>
          <span>BLACKJACK PAGA 3 A 2</span><i>•</i><span>CRUPIER SE PLANTA EN 17</span>
        </div>
      </section>

      {mostrarNombre && (
        <div className={`bj-zona bj-nombre${marca('nombre')}`} style={estiloZona(mesa.nombre)} {...arrastre('nombre')}>
          <span className="bj-emblema" aria-hidden><IconoBj tipo="pica" /></span>
          <div><strong>{nombre}</strong><div className="bj-brand">{nombreProveedor()}</div></div>
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
        <div className="bj-label"><span>Crupier</span>{totalD != null && <b>{totalD}</b>}</div>
        <div className="bj-mano dealer">
          {vista.d.map((c, i) => (
            <div className="bj-pos-carta" style={estiloAbanico(i, vista.d.length, false)} key={`d-${i}-${firmaCarta(c)}`}>
              <CartaVista carta={c} oculta={!c} piel={piel} clase={fx.dealer[i]?.clase} delay={fx.dealer[i]?.delay} />
            </div>
          ))}
        </div>
      </div>

      <div className={`bj-zona bj-centro${marca('aro')}`} style={estiloZona(mesa.aro)} {...arrastre('aro')}>
        <div className="bj-aro"><small>Apuesta</small>{apuesta && <b>{apuesta}</b>}</div>
        <div className="bj-resultado" aria-live="polite">{texto}</div>
      </div>

      <div className={`bj-zona${marca('jugador')}`} style={estiloZona(mesa.jugador)} {...arrastre('jugador')}>
        <div className="bj-label"><span>Tu mano</span>{totalJ != null && <b>{totalJ}</b>}</div>
        <div className="bj-mano jugador">
          {vista.j.map((c, i) => (
            <div className="bj-pos-carta" style={estiloAbanico(i, vista.j.length, true)} key={`j-${i}-${firmaCarta(c)}`}>
              <CartaVista carta={c} piel={piel} clase={fx.jugador[i]?.clase} delay={fx.jugador[i]?.delay} />
            </div>
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
  --bj-tinte:rgba(4,55,39,.06);
  --bj-ambiente: .8;--bj-velocidad:.78s;
  position:relative;width:min(100vw,66.667dvh,520px);height:100dvh;min-height:560px;margin:0 auto;
  box-sizing:border-box;color:var(--bj-text);
  overflow:hidden;font-family:"Avenir Next","Manrope","Inter",ui-sans-serif,system-ui,sans-serif;
  background:#070604;
  box-shadow:0 0 80px #000,0 0 0 1px rgba(213,175,99,.2);
  isolation:isolate;
}
.bj-fondo{position:absolute;inset:0;z-index:-3;background-position:center;background-size:cover;background-repeat:no-repeat;transform:scale(1.003)}
.bj-tinte{position:absolute;inset:0;z-index:-2;background:var(--bj-tinte);mix-blend-mode:color;pointer-events:none}
.blackjack.tema-burdeos{
  --bj-luz:rgba(141,54,190,.42);--bj-pano-a:#241126;--bj-pano-b:#09050b;
  --bj-madera:#120b13;--bj-oro:#e2944b;--bj-btn-a:#efa75d;--bj-btn-b:#8c3b28;
  --bj-tinte:rgba(74,15,78,.11);
}
.blackjack.tema-carbon{
  --bj-luz:rgba(219,182,91,.36);
  --bj-pano-a:#1c1e26;--bj-pano-b:#08090c;
  --bj-madera:#121318;--bj-oro:#c2b09a;--bj-oro-suave:rgba(194,176,154,.3);
  --bj-btn-a:#f3d488;--bj-btn-b:#9d702b;--bj-tinte:rgba(8,9,12,.08);
}
.blackjack.tema-caoba{
  --bj-luz:rgba(208,133,58,.4);--bj-pano-a:#25452f;--bj-pano-b:#0b170e;
  --bj-madera:#281407;--bj-oro:#d3944d;--bj-oro-suave:rgba(211,148,77,.36);
  --bj-btn-a:#e5b36d;--bj-btn-b:#775027;--bj-tinte:rgba(43,76,35,.08);
}
.blackjack.tema-zafiro{
  --bj-luz:rgba(53,151,191,.38);--bj-pano-a:#073c55;--bj-pano-b:#031723;
  --bj-madera:#15171b;--bj-oro:#d5a654;--bj-oro-suave:rgba(213,166,84,.34);
  --bj-btn-a:#edcc83;--bj-btn-b:#957039;--bj-btn-ink:#17120b;--bj-tinte:rgba(0,82,110,.08);
}
.blackjack.tema-monaco{
  --bj-luz:rgba(224,181,87,.44);--bj-pano-a:#163828;--bj-pano-b:#07140d;
  --bj-madera:#29160e;--bj-oro:#d9b063;--bj-oro-suave:rgba(217,176,99,.38);
  --bj-bg-a:#162a20;--bj-bg-b:#070b08;--bj-text:#f7efe1;
  --bj-btn-a:#d94a4f;--bj-btn-b:#71171d;--bj-btn-ink:#fff4df;--bj-tinte:rgba(20,79,45,.08);
}
.blackjack.tema-artdeco{
  --bj-luz:rgba(51,92,170,.42);--bj-pano-a:#102d56;--bj-pano-b:#050d1b;
  --bj-madera:#070b13;--bj-oro:#d7b35f;--bj-oro-suave:rgba(215,179,95,.4);
  --bj-bg-a:#0b1a30;--bj-bg-b:#02050a;--bj-btn-a:#e3c477;--bj-btn-b:#85652d;
  --bj-textura:repeating-linear-gradient(135deg,transparent 0 34px,rgba(227,189,94,.035) 35px 36px);
  --bj-motivo:linear-gradient(45deg,transparent 47%,rgba(227,189,94,.08) 48% 52%,transparent 53%),linear-gradient(-45deg,transparent 47%,rgba(227,189,94,.08) 48% 52%,transparent 53%);
  --bj-tinte:rgba(13,39,84,.09);
}
.blackjack.tema-neon{
  --bj-luz:rgba(223,76,151,.46);--bj-pano-a:#075b59;--bj-pano-b:#031d20;
  --bj-madera:#170b19;--bj-oro:#f09b41;--bj-oro-suave:rgba(240,155,65,.38);
  --bj-bg-a:#072f35;--bj-bg-b:#020d10;--bj-btn-a:#e979b2;--bj-btn-b:#7a2859;--bj-btn-ink:#fff5e7;
  --bj-textura:linear-gradient(rgba(89,223,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,90,236,.025) 1px,transparent 1px);
  --bj-motivo:linear-gradient(rgba(108,238,255,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(240,92,255,.06) 1px,transparent 1px);
  --bj-tinte:rgba(15,102,101,.1);
}
.blackjack.tema-artico{
  --bj-luz:rgba(140,226,255,.45);--bj-pano-a:#7897b3;--bj-pano-b:#243b51;
  --bj-madera:#a9c7d6;--bj-oro:#d9f5ff;--bj-oro-suave:rgba(217,245,255,.35);
  --bj-bg-a:#819dac;--bj-bg-b:#253d50;--bj-text:#f4fbff;
  --bj-btn-a:#ecfdff;--bj-btn-b:#72bbc9;--bj-btn-ink:#102b31;
  --bj-motivo:linear-gradient(120deg,transparent 35%,rgba(255,255,255,.13) 36% 37%,transparent 38% 66%,rgba(255,255,255,.09) 67% 68%,transparent 69%);
  --bj-tinte:rgba(154,220,239,.09);
}
.blackjack.tema-imperial{
  --bj-luz:rgba(218,34,48,.52);--bj-pano-a:#6e111c;--bj-pano-b:#200508;
  --bj-madera:#150405;--bj-oro:#e1b45b;--bj-oro-suave:rgba(225,180,91,.42);
  --bj-bg-a:#36070c;--bj-bg-b:#090102;--bj-btn-a:#f0c96e;--bj-btn-b:#ae7424;
  --bj-motivo:radial-gradient(circle,transparent 0 45%,rgba(225,180,91,.08) 46% 48%,transparent 49%);
  --bj-tinte:rgba(137,0,15,.1);
}
.blackjack.tema-havana{
  --bj-luz:rgba(211,171,64,.4);--bj-pano-a:#145c37;--bj-pano-b:#062317;
  --bj-madera:#2b180c;--bj-oro:#d9b75d;--bj-oro-suave:rgba(217,183,93,.38);
  --bj-bg-a:#103c28;--bj-bg-b:#04130c;--bj-btn-a:#e1c06c;--bj-btn-b:#7d5c22;
  --bj-motivo:repeating-linear-gradient(22deg,transparent 0 8px,rgba(255,240,205,.025) 9px 10px);
  --bj-tinte:rgba(10,91,48,.08);
}
.blackjack.tema-perla{
  --bj-luz:rgba(184,42,75,.44);--bj-pano-a:#651627;--bj-pano-b:#21070d;
  --bj-madera:#16090c;--bj-oro:#d3a36d;--bj-oro-suave:rgba(211,163,109,.3);
  --bj-bg-a:#3c0d17;--bj-bg-b:#0e0305;--bj-text:#fff2ec;
  --bj-btn-a:#d7a474;--bj-btn-b:#7d4934;--bj-btn-ink:#1b0c09;
  --bj-motivo:linear-gradient(135deg,rgba(255,255,255,.1),transparent 40%,rgba(35,44,42,.035));
  --bj-tinte:rgba(122,14,43,.09);
}
.bj-ambiente,.bj-vineta{position:absolute;inset:0;pointer-events:none;z-index:0}
.bj-vineta{z-index:8;box-shadow:inset 0 0 72px rgba(0,0,0,.5),inset 0 -72px 80px rgba(0,0,0,.28)}
.bj-ambiente{opacity:var(--bj-ambiente);overflow:hidden}
.bj-ambiente i{position:absolute;width:34vw;height:34vw;border-radius:50%;filter:blur(70px);background:var(--bj-luz);animation:bj-flotar 11s ease-in-out infinite alternate}
.bj-ambiente i:nth-child(1){left:-12%;top:-18%}.bj-ambiente i:nth-child(2){right:-12%;top:2%;animation-delay:-4s}.bj-ambiente i:nth-child(3){left:28%;bottom:-32%;animation-delay:-7s}.bj-ambiente i:nth-child(4){right:20%;bottom:-26%;animation-delay:-2s}
.bj-ambiente b{position:absolute;width:2px;height:2px;border-radius:50%;background:var(--bj-oro);box-shadow:12vw 8vh 0 var(--bj-oro),31vw 16vh 0 var(--bj-oro),54vw 7vh 0 var(--bj-oro),76vw 23vh 0 var(--bj-oro),88vw 12vh 0 var(--bj-oro),18vw 73vh 0 var(--bj-oro),68vw 81vh 0 var(--bj-oro);opacity:.36;animation:bj-destello 4s ease-in-out infinite}
.bj-ambiente b:nth-of-type(1){left:8%;top:16%}.bj-ambiente b:nth-of-type(2){left:2%;top:48%;animation-delay:-2s}
@keyframes bj-flotar{to{transform:translate(8vw,5vh) scale(1.18)}}
@keyframes bj-destello{50%{opacity:.08;transform:scale(.5)}}
.bj-zona{position:absolute;z-index:10;width:max-content;max-width:94%;text-align:center}
.bj-nombre{display:flex;align-items:center;gap:8px;text-align:center;filter:drop-shadow(0 4px 6px #000)}
.bj-nombre strong{display:block;font-family:"Iowan Old Style","Baskerville",Georgia,serif;font-size:clamp(22px,7vw,34px);font-weight:800;line-height:.86;letter-spacing:-.055em;color:#f0d89e;text-transform:uppercase;text-shadow:0 2px 0 #42270e,0 0 13px rgba(225,176,79,.38)}
.bj-brand{font-weight:750;letter-spacing:.34em;font-size:7px;color:#fff0c1;text-transform:uppercase;margin-top:5px}
.bj-emblema{width:32px;height:38px;display:grid;place-items:center;color:#1b1309;background:linear-gradient(145deg,#fff0b3,#9e6726);clip-path:polygon(50% 0,100% 48%,82% 100%,18% 100%,0 48%)}
.bj-emblema .bj-icono{width:21px;height:21px}
.bj-icono{display:block;width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.bj-icono .relleno{fill:currentColor;stroke:none}
.bj-marcada{outline:1px dashed var(--bj-oro);outline-offset:8px;cursor:grab;touch-action:none;z-index:6}
.bj-menu{position:absolute;z-index:30;left:13px;top:13px;width:38px;height:38px;border-radius:50%;border:1px solid rgba(225,181,95,.7);background:linear-gradient(#302113,#0a0806);box-shadow:0 5px 16px #000,inset 0 0 0 2px rgba(0,0,0,.8);display:grid;place-content:center;gap:4px;cursor:pointer}
.bj-menu i{display:block;width:17px;height:2px;border-radius:2px;background:#e3bc69;transition:.2s ease}
.bj-menu.abierto i:first-child{transform:translateY(6px) rotate(45deg)}.bj-menu.abierto i:nth-child(2){opacity:0}.bj-menu.abierto i:last-child{transform:translateY(-6px) rotate(-45deg)}
.bj-menu:focus-visible,.bj-bottom button:focus-visible{outline:2px solid #ffe3a0;outline-offset:3px}
.bj-menu-panel{position:absolute;z-index:29;left:13px;top:58px;width:190px;padding:15px 16px;border-radius:14px;border:1px solid rgba(218,176,91,.5);background:linear-gradient(145deg,rgba(28,20,12,.97),rgba(7,7,6,.97));box-shadow:0 18px 42px rgba(0,0,0,.7);display:flex;flex-direction:column;gap:7px;font-size:11px;color:#dfcda9}
.bj-menu-panel b{font-family:Georgia,serif;color:#f2d58e;font-size:15px}.bj-menu-panel small{padding-top:7px;border-top:1px solid rgba(255,255,255,.1);color:#9b896b;letter-spacing:.18em;text-transform:uppercase}
.bj-saldo{
  background:linear-gradient(180deg, rgba(18,14,12,.92), rgba(6,5,4,.94));
  border:1px solid var(--bj-oro-suave);padding:8px 14px;border-radius:999px;
  font-size:8px;letter-spacing:.13em;text-transform:uppercase;color:#cbb992;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.05), 0 10px 24px rgba(0,0,0,.45);
}
.bj-saldo b{display:block;color:#fff1c9;font-weight:800;letter-spacing:.03em;font-size:14px;margin:2px 0 0}
.bj-pano{
  position:absolute;z-index:1;transform:translate(-50%,-50%);box-sizing:border-box;overflow:visible;
  border:0;background:none;box-shadow:none;pointer-events:none;
}
.bj-pano::before{display:none}
.bj-reglas{position:absolute;left:50%;top:42%;transform:translateX(-50%);display:flex;align-items:center;gap:8px;white-space:nowrap;color:#c99e52;opacity:.78;font-family:Georgia,serif;font-size:7px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;text-shadow:0 2px 5px #00150f}
.bj-reglas i{font-style:normal;opacity:.55}
.bj-pano.bj-marcada{cursor:grab;z-index:1;pointer-events:auto}
.bj-riel{
  pointer-events:none;position:absolute;inset:16px 18px 14px;
  border-radius:42% 42% 12px 12px;
  border:1px solid var(--bj-oro-suave);
  box-shadow:inset 0 0 50px rgba(0,0,0,.35);
}
.bj-riel,.bj-esquina{display:none}
.bj-esquina{
  pointer-events:none;position:absolute;width:9px;height:9px;border:1px solid var(--bj-oro);opacity:.7;
  transform:rotate(45deg);box-shadow:0 0 8px rgba(0,0,0,.6);
}
.bj-esquina.a{top:18%;left:10%}
.bj-esquina.b{top:18%;right:10%}
.bj-esquina.c{bottom:12%;left:7%}
.bj-esquina.d{bottom:12%;right:7%}
.bj-label{
  display:inline-flex;align-items:center;gap:8px;margin-bottom:8px;padding:4px 7px 4px 11px;border-radius:999px;
  font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:#e7d7b0;
  background:linear-gradient(180deg,rgba(35,24,14,.92),rgba(7,7,6,.9));border:1px solid rgba(211,169,84,.58);box-shadow:0 4px 12px rgba(0,0,0,.42);
}
.bj-label b{display:grid;place-items:center;min-width:23px;height:23px;border-radius:50%;background:#080807;border:1px solid rgba(228,188,106,.5);color:#fff5d8;font-size:12px;letter-spacing:0}
.bj-mano{display:flex;justify-content:center;align-items:flex-start;min-height:100px;perspective:720px;transform-style:preserve-3d;isolation:isolate}
.bj-pos-carta{position:relative;z-index:var(--bj-fan-z);flex:0 0 auto;margin:0;transform-origin:50% 112%;transition:transform .35s cubic-bezier(.2,.75,.2,1)}
.bj-pos-carta+.bj-pos-carta{margin-left:var(--bj-fan-solape,-12px)}
.bj-mano.jugador .bj-pos-carta{transform:perspective(520px) translateY(var(--bj-fan-y)) rotateZ(var(--bj-fan-rot)) rotateX(5deg) scale(1.04)}
.bj-mano.dealer .bj-pos-carta{transform:perspective(650px) translateY(var(--bj-fan-y)) rotateZ(var(--bj-fan-rot)) rotateX(7deg) scale(.92)}
.bj-pos-carta .bj-carta,.bj-pos-carta .bj-flip{margin:0}
.bj-carta{
  width:var(--bj-carta-w);height:var(--bj-carta-h);border-radius:9px;padding:6px;box-sizing:border-box;
  position:relative;text-align:left;display:block;overflow:hidden;
  font-family:"Iowan Old Style","Baskerville",Georgia,serif;
  background:linear-gradient(145deg,#fff 0%,var(--bj-card-a) 42%,var(--bj-card-b) 100%);
  color:#1a140f;
  border:1px solid rgba(255,255,255,.86);box-shadow:0 10px 17px rgba(0,0,0,.48),inset 0 0 0 1px rgba(40,30,18,.1),inset 0 0 22px rgba(165,139,91,.09);
}
.bj-flip{
  width:var(--bj-carta-w);height:var(--bj-carta-h);position:relative;flex:0 0 auto;transform-style:preserve-3d;
  animation:bj-voltea .72s ease both;
}
.bj-flip .bj-carta{position:absolute;inset:0;width:100%;height:100%;margin:0;backface-visibility:hidden}
.bj-flip .bj-frente{transform:rotateY(180deg)}
.bj-indice{position:absolute;left:6px;top:5px;display:flex;flex-direction:column;align-items:center;line-height:.78}
.bj-indice b{font-size:calc(var(--bj-carta-h) * .15);line-height:.9;letter-spacing:-.08em}
.bj-indice i{font-size:calc(var(--bj-carta-h) * .105);font-style:normal;line-height:1}
.bj-indice.invertido{left:auto;top:auto;right:6px;bottom:5px;transform:rotate(180deg)}
.bj-palo-central{position:absolute;inset:0;display:grid;place-items:center;font-size:calc(var(--bj-carta-h) * .32);line-height:1;filter:drop-shadow(0 1px 0 #fff);opacity:.92}
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
  display:flex;
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
  display:none;
}
.bj-aro small{font-size:9px;letter-spacing:.22em}.bj-aro b{font-size:17px;letter-spacing:-.02em;color:var(--bj-oro)}
.bj-resultado{min-height:20px;padding:5px 12px;border-radius:999px;background:rgba(0,18,13,.46);font-size:11px;font-weight:700;color:#f0cf83;letter-spacing:.01em;text-shadow:0 2px 10px #000;box-shadow:inset 0 0 0 1px rgba(222,180,91,.16)}
.bj-bottom{display:block;width:min(96%,470px)}
.bj-control-stack{width:100%;display:flex;flex-direction:column;align-items:center;gap:8px}
.bj-actionbar{width:100%;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}
.bj-actionbar.solo{grid-template-columns:minmax(180px,260px);justify-content:center}
.bj-apuesta{
  display:flex;align-items:center;gap:8px;
  background:linear-gradient(180deg,rgba(34,23,14,.96),rgba(8,7,6,.96));border:1px solid rgba(217,174,86,.58);
  padding:4px 7px;border-radius:999px;color:#e7d7b0;letter-spacing:.12em;font-size:8px;text-transform:uppercase;box-shadow:0 7px 18px rgba(0,0,0,.52),inset 0 1px rgba(255,255,255,.06);
}
.bj-apuesta input{width:74px;padding:0;background:transparent;color:#fff8ea;border:0;text-align:center;font-weight:800;font-size:14px;letter-spacing:.02em;appearance:textfield}.bj-apuesta input::-webkit-inner-spin-button{display:none}
.bj-stepper{gap:5px}.bj-stepper span{margin:0 2px}.bj-stepper button{min-width:27px!important;width:27px;height:27px;padding:0!important;border-radius:50%!important;background:linear-gradient(#f1ce81,#9a6726)!important;color:#201309!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.72),0 2px 5px #000!important;font-size:16px!important}.bj-stepper button::after{display:none}
.bj-bottom button{
  position:relative;overflow:hidden;border:1px solid rgba(229,184,91,.65);border-radius:999px;cursor:pointer;min-width:0;
  background:linear-gradient(180deg,var(--bj-btn-a),var(--bj-btn-b));
  color:var(--bj-btn-ink);padding:10px 7px;font-weight:850;letter-spacing:.04em;text-transform:uppercase;font-size:10px;white-space:nowrap;
  box-shadow:0 7px 16px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.55),inset 0 0 0 2px rgba(20,12,5,.34);transition:transform .18s ease,filter .18s ease,box-shadow .18s ease;
}
.bj-bottom button > span{display:inline-grid;place-items:center;vertical-align:middle;min-width:20px;height:20px;margin:-3px 4px -3px 0;border-radius:50%;background:rgba(0,0,0,.2)}
.bj-bottom button > span .bj-icono{width:13px;height:13px;stroke-width:2}
.bj-stepper button .bj-icono{width:14px;height:14px;margin:auto;stroke-width:2.4}
.bj-bottom button::after{content:"";position:absolute;inset:0;background:linear-gradient(110deg,transparent 20%,rgba(255,255,255,.5) 48%,transparent 72%);transform:translateX(-140%);transition:transform .55s ease}
.bj-bottom button:hover:not(:disabled){transform:translateY(-2px);filter:saturate(1.12);box-shadow:0 15px 30px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,255,255,.65)}
.bj-bottom button:hover:not(:disabled)::after{transform:translateX(140%)}
.bj-bottom button:active:not(:disabled){transform:translateY(1px) scale(.98)}
.bj-bottom button.sec{
  background:linear-gradient(180deg,#2a2118,#14110e);color:#e7c98a;
  box-shadow:inset 0 0 0 1px rgba(198,161,90,.55);
}
.bj-bottom button.accion-pedir{background:linear-gradient(180deg,#36533d,#15251a);color:#f0e5c9}
.bj-bottom button.accion-plantar{background:linear-gradient(180deg,#8d2830,#3c0d12);color:#ffe9d2}
.bj-bottom button.accion-doblar{background:linear-gradient(180deg,#4b351d,#1c1209);color:#f5d894}
.bj-bottom button.accion-repartir{background:linear-gradient(180deg,#e2be6c,#966120);color:#1e1207}
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
  .bj-reglas{font-size:7px;gap:7px;letter-spacing:.12em}
  .bj-bottom{width:94%}.bj-bottom button{padding:10px 5px}
  .bj-vineta{box-shadow:inset 0 0 80px rgba(0,0,0,.48)}
}
@media(max-height:650px){
  .bj-nombre strong{font-size:22px}.bj-emblema{width:27px;height:32px;font-size:19px}
  .bj-control-stack{gap:5px}.bj-bottom button{padding-block:8px}
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
