import { useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  crearMazo, esBlackjack, jugarDealer, resolver, sacar, valor,
} from '../motor/blackjack.js';
import { cfgBlackjack } from './juego/blackjack.ts';
import { fichasDe, fichasSinCajaDe, parcheFichas } from '../motor/fichas.js';
import { supabase } from './supabase.ts';
import { AjusteBlackjack } from './AjusteBlackjack.tsx';
import { FichasEnMesa, MesaBlackjack, type CartaBj } from './BlackjackMesa.tsx';
import type { AjusteBlackjackElem, DisenoBlackjack, Ficha, Juego, PiezaBlackjack } from './types.ts';

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

/**
 * Vista previa del 21. Este motor no tiene símbolos: la mesa se arma
 * con el mazo local y plata de mentira, sin pasar por la previa de rodillos.
 */
export function PreviewBlackjack({ juego, onClose, onMesa, onMostrarNombre }: {
  juego: Juego;
  onClose: () => void;
  onMesa?: (cfg: Juego['blackjack_cfg']) => void;
  onMostrarNombre?: (v: boolean) => void;
}) {
  const cfg = useMemo(() => cfgBlackjack(juego.blackjack_cfg), [juego]);
  const [mesa, setMesa] = useState<DisenoBlackjack>(() => cfgBlackjack(juego.blackjack_cfg).mesa);
  const nombreEnJuego = (juego.mostrar_nombre ?? true) !== false;
  const [mostrarNombre, setMostrarNombre] = useState(nombreEnJuego);
  const [nombreVisto, setNombreVisto] = useState(nombreEnJuego);
  if (nombreEnJuego !== nombreVisto) {
    setNombreVisto(nombreEnJuego);
    setMostrarNombre(nombreEnJuego);
  }
  const [mostrarPanel, setMostrarPanel] = useState(false);
  const [elem, setElem] = useState<AjusteBlackjackElem>('crupier');
  const [host, setHost] = useState<HTMLElement | null>(null);
  const [fichas, setFichas] = useState<Ficha[]>(() => fichasDe(juego) as Ficha[]);
  const minBet = Number(juego.min_bet) || 1000;
  const maxBet = Number(juego.max_bet) || 100000;
  const paso = Number(juego.paso_apuesta) || 100;
  const mazoRef = useRef<Carta[]>([]);
  const [saldo, setSaldo] = useState(SALDO_DEMO);
  const [apuesta, setApuesta] = useState(() => {
    const lista = fichasDe(juego) as Ficha[];
    if (lista.length) return lista[0].valor;
    return Math.min(maxBet, Math.max(minBet, minBet));
  });
  const [mano, setMano] = useState<Mano | null>(null);

  const activa = mano?.estado === 'en_curso';
  const dealerVisible = mano
    ? (activa ? [null, mano.dealer[1] ?? null] : mano.dealer)
    : [];
  const valorJugador = mano ? (valor(mano.jugador) as { total: number }).total : null;
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

  const dealerVisto: CartaBj[] = dealerVisible.length ? dealerVisible : [];

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, overflow: 'auto' }}>
      <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 60, display: 'flex', gap: 8, alignItems: 'center' }}>
        <span className="hint">plata de mentira</span>
        <button onClick={() => setMostrarPanel((v) => !v)}>⚙ Ajustar</button>
        <button onClick={onClose}>✕ Cerrar prueba</button>
      </div>
      {mostrarPanel && (
        <div style={{ position: 'absolute', top: 56, right: 12, zIndex: 80 }}>
          <AjusteBlackjack
            juego={juego}
            mesa={mesa}
            onChange={setMesa}
            elem={elem}
            onElem={setElem}
            onGuardada={onMesa}
            mostrarNombre={mostrarNombre}
            onMostrarNombre={(v) => { setMostrarNombre(v); setNombreVisto(v); onMostrarNombre?.(v); }}
          />
        </div>
      )}
      <MesaBlackjack
        anclaRef={setHost}
        nombre={juego.nombre}
        saldo={dinero(saldo)}
        mensaje={mensaje}
        dealer={dealerVisto}
        jugador={mano?.jugador || []}
        piel={cfg}
        mesa={mesa}
        mostrarNombre={mostrarNombre}
        demo
        ajuste={mostrarPanel ? {
          elem,
          onMover: (x, y) => setMesa((m) => (
            elem === 'pano' ? { ...m, pano: { ...m.pano, x, y } }
              : (elem === 'cartas' || elem === 'fichas') ? m
                : { ...m, [elem]: { ...m[elem as PiezaBlackjack], x, y } }
          )),
        } : null}
        acciones={!activa ? (
          <>
            {!(fichas.length > 0 && fichasSinCajaDe(juego)) && (
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
            )}
            <button disabled={saldo < minBet} onClick={repartir}>Repartir</button>
          </>
        ) : (
          <>
            <button className="sec" onClick={pedir}>Pedir</button>
            <button onClick={plantar}>Plantarse</button>
            {puedeDoblar && <button className="sec" onClick={doblar}>Doblar</button>}
          </>
        )}
      >
        <FichasEnMesa
          juego={juego}
          host={host}
          fichas={fichas}
          apuesta={apuesta}
          onElegir={setApuesta}
          bloqueado={!!activa}
          editable={mostrarPanel && elem === 'fichas' && !activa}
          onMover={(i, x, y) => {
            const next = fichas.map((f, k) => (k === i ? { ...f, x, y } : f));
            setFichas(next);
            const guardado = parcheFichas(juego, next);
            supabase.from('juegos').update({ fichas_cfg: guardado }).eq('id', juego.id).then(() => {});
            juego.fichas_cfg = guardado;
          }}
        />
      </MesaBlackjack>
    </div>,
    document.body,
  );
}
