import { useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  cfgConDefaults, crearMazo, esBlackjack, jugarDealer, resolver, sacar, valor,
} from '../motor/blackjack.js';
import type { BlackjackCfg, Juego } from './types.ts';

type Carta = { rango: string; palo: string };
type Estado = 'en_curso' | 'gano' | 'perdio' | 'empate';

interface Mano {
  jugador: Carta[];
  dealer: Carta[];
  apuesta: number;
  estado: Estado;
  ganancia: number | null;
}

const SALDO_DEMO = 10000;
const dinero = (n: number) => new Intl.NumberFormat('es-PY', { maximumFractionDigits: 0 }).format(Math.round(n));
const roja = (palo?: string) => palo === '♥' || palo === '♦';

function CartaVista({ carta, oculta = false }: { carta: Carta | null; oculta?: boolean }) {
  if (oculta || !carta) return <div className="bj-carta bj-oculta">SHIRO</div>;
  return (
    <div className={`bj-carta ${roja(carta.palo) ? 'roja' : ''}`}>
      <b>{carta.rango}</b>
      <span>{carta.palo}</span>
    </div>
  );
}

/**
 * Vista previa del 21. Este motor no tiene símbolos: la mesa se arma
 * con el mazo local y plata de mentira, sin pasar por la previa de rodillos.
 */
export function PreviewBlackjack({ juego, onClose }: { juego: Juego; onClose: () => void }) {
  const cfg = useMemo(
    () => cfgConDefaults(juego.blackjack_cfg || {}) as BlackjackCfg,
    [juego],
  );
  const minBet = Number(juego.min_bet) || 1000;
  const maxBet = Number(juego.max_bet) || 100000;
  const paso = Number(juego.paso_apuesta) || 100;
  const mazoRef = useRef<Carta[]>([]);
  const [saldo, setSaldo] = useState(SALDO_DEMO);
  const [apuesta, setApuesta] = useState(Math.min(maxBet, Math.max(minBet, minBet)));
  const [mano, setMano] = useState<Mano | null>(null);

  const activa = mano?.estado === 'en_curso';
  const dealerVisible = mano
    ? (activa ? [null, mano.dealer[1] ?? null] : mano.dealer)
    : [];
  const valorJugador = mano ? (valor(mano.jugador) as { total: number }).total : null;
  const valorDealer = mano && !activa ? (valor(mano.dealer) as { total: number }).total : null;
  const puedeDoblar = !!mano && activa && cfg.permitirDoblar && mano.jugador.length === 2 && saldo >= mano.apuesta;

  const cerrar = (jugador: Carta[], dealer: Carta[], apostado: number, natural = false) => {
    let estado: Estado;
    let ganancia: number;
    if (natural) {
      const jugador21 = esBlackjack(jugador) as boolean;
      const dealer21 = esBlackjack(dealer) as boolean;
      estado = jugador21 && !dealer21 ? 'gano' : dealer21 && !jugador21 ? 'perdio' : 'empate';
      ganancia = estado === 'gano' ? apostado * (1 + cfg.pagoBlackjack) : estado === 'empate' ? apostado : 0;
    } else {
      const r = resolver(jugador, dealer, cfg) as { resultado: Estado; multiplicador: number };
      estado = r.resultado;
      ganancia = apostado * r.multiplicador;
    }
    setSaldo((s) => s + ganancia);
    setMano({ jugador, dealer, apuesta: apostado, estado, ganancia });
  };

  const repartir = () => {
    const monto = Math.min(maxBet, Math.max(minBet, Math.round(apuesta) || minBet));
    if (saldo < monto) return;
    const mazo = crearMazo(cfg.mazos) as Carta[];
    const jugador = [sacar(mazo) as Carta, sacar(mazo) as Carta];
    const dealer = [sacar(mazo) as Carta, sacar(mazo) as Carta];
    mazoRef.current = mazo;
    setApuesta(monto);
    setSaldo((s) => s - monto);
    if ((esBlackjack(jugador) as boolean) || (esBlackjack(dealer) as boolean)) {
      cerrar(jugador, dealer, monto, true);
      return;
    }
    setMano({ jugador, dealer, apuesta: monto, estado: 'en_curso', ganancia: null });
  };

  const pedir = () => {
    if (!mano || !activa) return;
    const mazo = mazoRef.current;
    const jugador = [...mano.jugador, sacar(mazo) as Carta];
    if ((valor(jugador) as { total: number }).total >= 21) {
      const dealer = (valor(jugador) as { total: number }).total <= 21
        ? jugarDealer(mazo, [...mano.dealer], cfg) as Carta[]
        : mano.dealer;
      cerrar(jugador, dealer, mano.apuesta);
      return;
    }
    setMano({ ...mano, jugador });
  };

  const plantar = () => {
    if (!mano || !activa) return;
    const mazo = mazoRef.current;
    const dealer = jugarDealer(mazo, [...mano.dealer], cfg) as Carta[];
    cerrar(mano.jugador, dealer, mano.apuesta);
  };

  const doblar = () => {
    if (!mano || !puedeDoblar) return;
    const mazo = mazoRef.current;
    const extra = mano.apuesta;
    const jugador = [...mano.jugador, sacar(mazo) as Carta];
    const apostado = mano.apuesta + extra;
    setSaldo((s) => s - extra);
    const dealer = (valor(jugador) as { total: number }).total <= 21
      ? jugarDealer(mazo, [...mano.dealer], cfg) as Carta[]
      : mano.dealer;
    cerrar(jugador, dealer, apostado);
  };

  const mensaje = !mano
    ? 'Hacé tu apuesta para repartir'
    : activa
      ? `Tu mano: ${valorJugador}`
      : mano.estado === 'gano'
        ? `Ganaste ${dinero(mano.ganancia || 0)}`
        : mano.estado === 'empate'
          ? 'Empate: recuperás tu apuesta'
          : 'La casa gana esta mano';

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, overflow: 'auto' }}>
      <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 60, display: 'flex', gap: 8, alignItems: 'center' }}>
        <span className="hint">plata de mentira</span>
        <button onClick={onClose}>✕ Cerrar prueba</button>
      </div>
      <main className="blackjack">
        <style>{ESTILOS}</style>
        <header className="bj-top">
          <div>
            <div className="bj-brand">SHIRO GAMES</div>
            <strong>{juego.nombre}</strong>
          </div>
          <div className="bj-saldo">Saldo: {dinero(saldo)}</div>
        </header>
        <section className="bj-mesa">
          <div>
            <div className="bj-label">CRUPIER {valorDealer != null ? `· ${valorDealer}` : ''}</div>
            <div className="bj-mano">
              {dealerVisible.length
                ? dealerVisible.map((c, i) => <CartaVista key={i} carta={c} oculta={!c} />)
                : <CartaVista carta={null} oculta />}
            </div>
          </div>
          <div className="bj-resultado">{mensaje}</div>
          <div>
            <div className="bj-label">JUGADOR {valorJugador != null ? `· ${valorJugador}` : ''}</div>
            <div className="bj-mano">
              {mano?.jugador.map((c, i) => <CartaVista key={i} carta={c} />)}
            </div>
          </div>
        </section>
        <footer className="bj-bottom">
          {!activa && (
            <>
              <label className="bj-apuesta">
                Apuesta
                <input
                  type="number"
                  min={minBet}
                  max={maxBet}
                  step={paso}
                  value={apuesta}
                  onChange={(e) => setApuesta(Number(e.target.value))}
                />
              </label>
              <button disabled={saldo < minBet} onClick={repartir}>Repartir</button>
            </>
          )}
          {activa && (
            <>
              <button className="sec" onClick={pedir}>Pedir</button>
              <button onClick={plantar}>Plantarse</button>
              {puedeDoblar && <button className="sec" onClick={doblar}>Doblar</button>}
            </>
          )}
        </footer>
      </main>
    </div>,
    document.body,
  );
}

const ESTILOS = `
.blackjack{min-height:100vh;box-sizing:border-box;padding:24px;padding-top:58px;background:radial-gradient(circle at 50% 10%,#246346,#081b17 65%);color:#fff;font-family:Inter,system-ui,sans-serif;display:grid;grid-template-rows:auto 1fr auto;gap:18px}
.bj-top,.bj-bottom{max-width:980px;width:100%;margin:auto;display:flex;align-items:center;justify-content:space-between;gap:12px}
.bj-brand{font-weight:900;letter-spacing:.13em;color:#e7bf67}
.bj-saldo{background:#08140f99;padding:10px 15px;border-radius:10px;font-weight:700}
.bj-mesa{max-width:980px;width:100%;margin:auto;border:10px solid #5b351e;border-radius:48% 48% 16px 16px;background:linear-gradient(135deg,#1c7651,#0d422f);box-shadow:inset 0 0 0 3px #d7a94d,inset 0 0 50px #03140d;min-height:480px;text-align:center;display:flex;flex-direction:column;justify-content:space-around;padding:30px;box-sizing:border-box}
.bj-label{font-size:12px;letter-spacing:.15em;color:#d9c188;margin-bottom:12px}
.bj-mano{display:flex;justify-content:center;gap:10px;min-height:116px}
.bj-carta{width:75px;height:106px;border-radius:8px;background:#f8f2e6;color:#1c1c1c;padding:9px;box-sizing:border-box;text-align:left;box-shadow:0 4px 9px #0006;display:flex;flex-direction:column;font-family:Georgia,serif;font-size:20px}
.bj-carta span{font-size:29px;line-height:1}
.bj-carta.roja{color:#b51b28}
.bj-oculta{background:repeating-linear-gradient(45deg,#153b78 0 6px,#e3d4ac 6px 9px);color:#f5df99;align-items:center;justify-content:center;font-size:11px;letter-spacing:.12em}
.bj-resultado{min-height:25px;font-weight:800;color:#ffe193}
.bj-bottom{justify-content:center;flex-wrap:wrap}
.bj-apuesta{display:flex;align-items:center;gap:8px;background:#07140ecc;padding:8px 12px;border-radius:10px}
.bj-apuesta input{width:110px;background:transparent;color:white;border:0;font-weight:bold;font-size:16px}
.blackjack button{border:0;border-radius:9px;background:#d7a94d;color:#211506;padding:12px 20px;font-weight:800;cursor:pointer}
.blackjack button.sec{background:#efe0b7}
.blackjack button:disabled{opacity:.45;cursor:not-allowed}
@media(max-width:600px){.blackjack{padding:14px;padding-top:58px}.bj-mesa{border-radius:26px;min-height:430px;padding:20px 8px}.bj-carta{width:62px;height:90px}.bj-bottom{gap:7px}.blackjack button{padding:11px 13px}}
`;
