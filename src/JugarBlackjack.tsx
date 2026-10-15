import { useCallback, useMemo, useState } from 'react';
import { fetchJson } from './juego/recursos.ts';
import { cfgBlackjack } from './juego/blackjack.ts';
import { fichasDe, fichasSinCajaDe } from '../motor/fichas.js';
import { FichasEnMesa, MesaBlackjack, type CartaBj } from './BlackjackMesa.tsx';
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
      // Sin saldo nuevo (pedir, o perder) el servidor manda null. Number(null)
      // es 0, y la mesa lo mostraba como si el jugador se hubiera quedado en cero.
      if (r.saldo != null && Number.isFinite(Number(r.saldo))) setSaldo(Number(r.saldo));
    } catch (e) {
      setError((e as Error).message || 'No se pudo resolver la mano.');
    } finally {
      setCargando(false);
    }
  }, [slug, token]);

  const iniciar = () => llamar({ accion: 'iniciar', apuesta, clientId: crypto.randomUUID() });
  const accion = (a: 'pedir' | 'plantar' | 'doblar') => partida && llamar({ accion: a, roundId: partida.roundId });
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
      mensaje={mensaje}
      dealer={partida?.dealer || []}
      jugador={partida?.jugador || []}
      piel={piel}
      mesa={piel.mesa}
      mostrarNombre={(juego.mostrar_nombre ?? true) !== false}
      error={error}
      acciones={activa ? (
        <>
          <button className="sec" disabled={cargando} onClick={() => accion('pedir')}>Pedir</button>
          <button disabled={cargando} onClick={() => accion('plantar')}>Plantarse</button>
          {partida?.puedeDoblar && <button className="sec" disabled={cargando || saldo < partida.apuesta} onClick={() => accion('doblar')}>Doblar</button>}
        </>
      ) : (
        <>
          {!(fichas.length > 0 && fichasSinCajaDe(juego)) && (
            <label className="bj-apuesta">
              Apuesta
              <input type="number" min={juego.min_bet} max={juego.max_bet} step={juego.paso_apuesta || 100} value={apuesta} onChange={(e) => setApuesta(Number(e.target.value))} />
            </label>
          )}
          <button disabled={cargando} onClick={iniciar}>{cargando ? 'Repartiendo…' : 'Repartir'}</button>
        </>
      )}
    >
      <FichasEnMesa juego={juego} host={host} fichas={fichas} apuesta={apuesta} onElegir={setApuesta} bloqueado={!!activa || cargando} />
    </MesaBlackjack>
  );
}
