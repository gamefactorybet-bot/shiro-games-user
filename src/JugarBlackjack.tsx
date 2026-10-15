import { useCallback, useMemo, useState } from 'react';
import { fetchJson } from './juego/recursos.ts';
import { cfgBlackjack, nombreEnMesa } from './juego/blackjack.ts';
import { sonidoBlackjack } from './juego/blackjack-audio.ts';
import { fichasDe, fichasSinCajaDe } from '../motor/fichas.js';
import { FichasEnMesa, IconoBj, MesaBlackjack, type CartaBj } from './BlackjackMesa.tsx';
import type { DatosJuego, Ficha } from './types.ts';

type Partida = {
  roundId: string;
  estado: 'en_curso' | 'gano' | 'perdio' | 'empate';
  apuesta: number;
  jugador: CartaBj[];
  dealer: CartaBj[];
  valorJugador: number;
  valorDealer: number | null;
  puedeDoblar: boolean;
  ganancia: number | null;
  saldo?: number | null;
};

const dinero = (n: number) => new Intl.NumberFormat('es-PY', { maximumFractionDigits: 0 }).format(Math.round(n));

export function JugarBlackjack({ datos, saldoInicial, slug, token }: { datos: DatosJuego; saldoInicial: number; slug: string; token: string }) {
  const juego = datos.juego;
  const piel = useMemo(() => cfgBlackjack(juego.blackjack_cfg), [juego]);
  const fichas = useMemo(() => fichasDe(juego) as Ficha[], [juego]);
  const [host, setHost] = useState<HTMLElement | null>(null);
  const [saldo, setSaldo] = useState(saldoInicial);
  const [apuesta, setApuesta] = useState(() => {
    const lista = fichasDe(juego) as Ficha[];
    if (lista.length) return lista[0].valor;
    return Math.max(Number(juego.min_bet) || 1000, Number(juego.paso_apuesta) || 1000);
  });
  const [partida, setPartida] = useState<Partida | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const llamar = useCallback(async (body: Record<string, unknown>) => {
    setCargando(true);
    setError('');
    try {
      const r = await fetchJson<Partida>('/api/blackjack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, slug, ...body }),
      });
      setPartida(r);
      sonidoBlackjack(r.estado === 'gano' ? 'gano' : r.estado === 'empate' ? 'empate' : r.estado === 'perdio' ? 'perdio' : 'carta', piel.sonido);
      // Sin saldo nuevo (pedir, o perder) el servidor manda null. Number(null)
      // es 0, y la mesa lo mostraba como si el jugador se hubiera quedado en cero.
      if (r.saldo != null && Number.isFinite(Number(r.saldo))) setSaldo(Number(r.saldo));
    } catch (e) {
      setError((e as Error).message || 'No se pudo resolver la mano.');
    } finally {
      setCargando(false);
    }
  }, [slug, token, piel.sonido]);

  const iniciar = () => { sonidoBlackjack('ficha', piel.sonido); void llamar({ accion: 'iniciar', apuesta, clientId: crypto.randomUUID() }); };
  const accion = (a: 'pedir' | 'plantar' | 'doblar') => { if (!partida) return; sonidoBlackjack(a === 'plantar' ? 'voltear' : 'boton', piel.sonido); void llamar({ accion: a, roundId: partida.roundId }); };
  const activa = partida?.estado === 'en_curso';
  const mensaje = partida && !activa
    ? (partida.estado === 'gano'
      ? `Ganaste ${dinero(partida.ganancia || 0)}`
      : partida.estado === 'empate' ? 'Empate: recuperás tu apuesta' : 'La casa gana esta mano')
    : activa ? `Tu mano: ${partida?.valorJugador}` : 'Hacé tu apuesta para repartir';

  return (
    <MesaBlackjack
      anclaRef={setHost}
      nombre={juego.nombre}
      saldo={dinero(saldo)}
      apuesta={dinero(apuesta)}
      mensaje={mensaje}
      resultado={partida?.estado || null}
      dealer={partida?.dealer || []}
      jugador={partida?.jugador || []}
      piel={piel}
      mesa={piel.mesa}
      movimiento={piel.movimiento}
      ambiente={piel.ambiente}
      mostrarNombre={nombreEnMesa(juego)}
      error={error}
      acciones={(
        <div className="bj-control-stack">
          {!(fichas.length > 0 && fichasSinCajaDe(juego)) && (
            <label className="bj-apuesta bj-stepper">
              <button type="button" aria-label="Bajar apuesta" disabled={!!activa || cargando} onClick={() => setApuesta((v) => Math.max(Number(juego.min_bet), v - Number(juego.paso_apuesta || 100)))}><IconoBj tipo="menos" /></button>
              <span>Apuesta</span>
              <input aria-label="Monto de la apuesta" type="number" disabled={!!activa || cargando} min={juego.min_bet} max={juego.max_bet} step={juego.paso_apuesta || 100} value={apuesta} onChange={(e) => setApuesta(Number(e.target.value))} />
              <button type="button" aria-label="Subir apuesta" disabled={!!activa || cargando} onClick={() => setApuesta((v) => Math.min(Number(juego.max_bet), v + Number(juego.paso_apuesta || 100)))}><IconoBj tipo="mas" /></button>
            </label>
          )}
          {activa ? (
            <div className="bj-actionbar">
              <button className="accion-pedir" disabled={cargando} onClick={() => accion('pedir')}><span><IconoBj tipo="pedir" /></span>Pedir</button>
              <button className="accion-plantar" disabled={cargando} onClick={() => accion('plantar')}><span><IconoBj tipo="plantar" /></span>Plantarse</button>
              <button className="accion-doblar" disabled={cargando || !partida?.puedeDoblar || saldo < partida.apuesta} onClick={() => accion('doblar')}><span><IconoBj tipo="doblar" /></span>Doblar</button>
            </div>
          ) : (
            <div className="bj-actionbar solo">
              <button className="accion-repartir" disabled={cargando || saldo < apuesta} onClick={iniciar}><span><IconoBj tipo="repartir" /></span>{cargando ? 'Repartiendo…' : 'Repartir'}</button>
            </div>
          )}
        </div>
      )}
    >
      <FichasEnMesa juego={juego} host={host} fichas={fichas} tema={piel.mesa.tema} apuesta={apuesta} onElegir={setApuesta} bloqueado={!!activa || cargando} />
    </MesaBlackjack>
  );
}
