import { useRef, useState, type CSSProperties, type ReactNode, type Ref } from 'react';
import { nombreProveedor } from './marca.ts';
import { claveCarta } from './juego/blackjack.ts';
import { Fichas } from './Fichas.tsx';
import { fichasDe, fichasVistaDe } from '../motor/fichas.js';
import type { BlackjackCfg, Ficha, Juego } from './types.ts';

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

export function MesaBlackjack({
  nombre, saldo, mensaje, dealer, valorDealer, jugador, valorJugador, piel, error, demo, anclaRef, children,
}: {
  nombre: string;
  saldo: string;
  mensaje: string;
  dealer: CartaBj[];
  valorDealer: number | null;
  jugador: CartaBj[];
  valorJugador: number | null;
  piel: Pick<BlackjackCfg, 'reversoUrl' | 'cartas'>;
  error?: string;
  demo?: boolean;
  anclaRef?: Ref<HTMLElement>;
  children: ReactNode;
}) {
  const fx = useReparto(dealer, jugador);
  return (
    <main ref={anclaRef} className={`blackjack${demo ? ' demo' : ''}`}>
      <style>{ESTILOS}</style>
      <header className="bj-top">
        <div>
          <div className="bj-brand">{nombreProveedor()}</div>
          <strong>{nombre}</strong>
        </div>
        <div className="bj-saldo">Saldo <b>{saldo}</b></div>
      </header>
      <section className="bj-mesa">
        <div className="bj-riel" />
        <div className="bj-mazo" aria-hidden>
          {[0, 1, 2].map((n) => (
            piel.reversoUrl
              ? <i key={n} className="bj-foto" style={{ backgroundImage: `url("${piel.reversoUrl}")` }} />
              : <i key={n} />
          ))}
        </div>
        <div>
          <div className="bj-label">Crupier {valorDealer != null ? `· ${valorDealer}` : ''}</div>
          <div className="bj-mano">
            {dealer.map((c, i) => (
              <CartaVista key={`d-${i}-${firmaCarta(c)}`} carta={c} oculta={!c} piel={piel} clase={fx.dealer[i]?.clase} delay={fx.dealer[i]?.delay} />
            ))}
          </div>
        </div>
        <div className="bj-centro">
          <div className="bj-aro">Apuesta</div>
          <div className="bj-resultado">{mensaje}</div>
        </div>
        <div>
          <div className="bj-label">Jugador {valorJugador != null ? `· ${valorJugador}` : ''}</div>
          <div className="bj-mano">
            {jugador.map((c, i) => (
              <CartaVista key={`j-${i}-${firmaCarta(c)}`} carta={c} piel={piel} clase={fx.jugador[i]?.clase} delay={fx.jugador[i]?.delay} />
            ))}
          </div>
        </div>
      </section>
      <footer className="bj-bottom">
        {children}
        {error && <p className="bj-error">{error}</p>}
      </footer>
    </main>
  );
}

const ESTILOS = `
.blackjack{
  --accent:#e7c98a;--accent-hover:#f6e7c1;
  position:relative;min-height:100vh;box-sizing:border-box;padding:28px 20px 22px;color:#f6efe2;
  font-family:Inter,system-ui,sans-serif;
  display:grid;grid-template-rows:auto 1fr auto;gap:18px;
  background:
    radial-gradient(ellipse at 50% -10%, rgba(140,28,36,.28), transparent 46%),
    radial-gradient(ellipse at 50% 120%, #000 0%, #07080c 62%);
}
.blackjack.demo{padding-top:64px}
.bj-top,.bj-bottom{max-width:1040px;width:100%;margin:auto;display:flex;align-items:center;justify-content:space-between;gap:12px}
.bj-brand{font-weight:800;letter-spacing:.22em;font-size:11px;color:#e7c98a;text-transform:uppercase}
.bj-top strong{display:block;margin-top:2px;font-size:18px;font-weight:650}
.bj-saldo{
  background:linear-gradient(180deg, rgba(28,22,16,.9), rgba(10,8,6,.92));
  border:1px solid rgba(212,175,90,.35);padding:8px 14px;border-radius:999px;
  font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#cbb992;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.06);
}
.bj-saldo b{color:#f3e2b8;font-weight:750;letter-spacing:0;font-size:15px;margin-left:6px}
.bj-mesa{
  position:relative;max-width:1040px;width:100%;margin:auto;box-sizing:border-box;
  min-height:520px;padding:36px 28px 32px;text-align:center;
  display:flex;flex-direction:column;justify-content:space-between;
  border-radius:220px 220px 36px 36px;
  background:
    radial-gradient(ellipse at 50% 42%, rgba(255,255,255,.05), transparent 28%),
    radial-gradient(ellipse at 50% 70%, #123526 0%, #07140f 68%);
  border:16px solid #140e0b;
  box-shadow:
    inset 0 0 0 2px #c6a15a,
    inset 0 0 0 10px #1c130f,
    inset 0 0 90px rgba(0,0,0,.62),
    0 28px 50px rgba(0,0,0,.55);
}
.bj-riel{
  pointer-events:none;position:absolute;inset:18px 22px 16px;
  border-radius:180px 180px 22px 22px;
  border:1px solid rgba(198,161,90,.28);
  box-shadow:inset 0 0 40px rgba(0,0,0,.25);
}
.bj-label{
  display:inline-block;margin-bottom:12px;padding:4px 12px;border-radius:999px;
  font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#e7d7b0;
  background:rgba(0,0,0,.35);border:1px solid rgba(198,161,90,.28);
}
.bj-mano{display:flex;justify-content:center;min-height:124px;perspective:900px}
.bj-mano .bj-carta,.bj-mano .bj-flip{margin:0 -6px}
.bj-carta{
  width:82px;height:118px;border-radius:11px;padding:8px 8px 6px;box-sizing:border-box;
  text-align:left;display:flex;flex-direction:column;justify-content:space-between;
  font-family:Georgia,"Times New Roman",serif;
  background:linear-gradient(180deg,#fffdf8 0%,#f4ead8 100%);
  color:#1a140f;
  box-shadow:0 12px 18px rgba(0,0,0,.45), inset 0 0 0 1px rgba(255,255,255,.7);
}
.bj-flip{
  width:82px;height:118px;position:relative;flex:0 0 auto;transform-style:preserve-3d;
  animation:bj-voltea .62s ease both;
}
.bj-flip .bj-carta{position:absolute;inset:0;width:100%;height:100%;margin:0;backface-visibility:hidden}
.bj-flip .bj-frente{transform:rotateY(180deg)}
.bj-carta b{font-size:22px;line-height:1}
.bj-carta span{font-size:28px;line-height:.8;align-self:flex-end}
.bj-carta.roja{color:#9d1c2b}
.bj-carta.entra{animation:bj-reparte .58s cubic-bezier(.16,.84,.28,1) both}
@keyframes bj-reparte{
  0%{opacity:0;transform:translate(30vw,-26vh) rotate(16deg) scale(.68)}
  70%{opacity:1;transform:translate(0,6px) rotate(-3deg) scale(1.04)}
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
.bj-mazo{position:absolute;top:28px;right:34px;width:54px;height:76px}
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
.bj-centro{display:flex;flex-direction:column;align-items:center;gap:8px}
.bj-aro{
  width:168px;height:64px;border-radius:50%;
  border:1px dashed rgba(198,161,90,.55);
  display:grid;place-items:center;
  color:rgba(231,201,138,.7);letter-spacing:.22em;text-transform:uppercase;font-size:10px;
  box-shadow:inset 0 0 0 6px rgba(0,0,0,.15);
}
.bj-resultado{min-height:24px;font-weight:750;color:#f0d48a;letter-spacing:.02em}
.bj-bottom{justify-content:center;flex-wrap:wrap}
.bj-apuesta{
  display:flex;align-items:center;gap:8px;
  background:rgba(8,6,5,.72);border:1px solid rgba(198,161,90,.3);
  padding:8px 14px;border-radius:999px;color:#e7d7b0;letter-spacing:.08em;font-size:12px;text-transform:uppercase;
}
.bj-apuesta input{width:110px;background:transparent;color:#fff8ea;border:0;font-weight:700;font-size:16px;letter-spacing:0}
.bj-bottom button{
  border:0;border-radius:999px;cursor:pointer;
  background:linear-gradient(180deg,#f0d48a,#b8883a);
  color:#1a120c;padding:12px 22px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;font-size:12px;
  box-shadow:0 8px 16px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.55);
}
.bj-bottom button.sec{
  background:linear-gradient(180deg,#2a2118,#14110e);color:#e7c98a;
  box-shadow:inset 0 0 0 1px rgba(198,161,90,.55);
}
.bj-bottom button:disabled{opacity:.4;cursor:not-allowed}
.bj-error{color:#ffb4b4;text-align:center;margin:0;width:100%}
@media(max-width:600px){
  .blackjack{padding:16px 10px}
  .blackjack.demo{padding-top:58px}
  .bj-mesa{border-width:10px;border-radius:90px 90px 22px 22px;min-height:460px;padding:22px 8px}
  .bj-carta,.bj-flip{width:64px;height:94px}
  .bj-flip .bj-carta{width:100%;height:100%}
  .bj-carta b{font-size:16px}
  .bj-carta span{font-size:20px}
  .bj-aro{width:120px;height:48px}
  .bj-mazo{right:12px;top:16px}
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
