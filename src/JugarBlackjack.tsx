import { useCallback, useMemo, useState } from 'react';
import { fetchJson } from './juego/recursos.ts';
import { cfgBlackjack } from './juego/blackjack.ts';
import { MesaBlackjack, type CartaBj } from './BlackjackMesa.tsx';
import type { DatosJuego } from './types.ts';

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
  const [saldo, setSaldo] = useState(saldoInicial);
  const [apuesta, setApuesta] = useState(Math.max(Number(juego.min_bet) || 1000, Number(juego.paso_apuesta) || 1000));
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
      if (Number.isFinite(Number(r.saldo))) setSaldo(Number(r.saldo));
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
      nombre={juego.nombre}
      saldo={dinero(saldo)}
      mensaje={mensaje}
      dealer={partida?.dealer || []}
      valorDealer={partida?.valorDealer ?? null}
      jugador={partida?.jugador || []}
      valorJugador={partida ? partida.valorJugador : null}
      piel={piel}
      error={error}
    >
      {!activa && (
        <>
          <label className="bj-apuesta">
            Apuesta
            <input type="number" min={juego.min_bet} max={juego.max_bet} step={juego.paso_apuesta || 100} value={apuesta} onChange={(e) => setApuesta(Number(e.target.value))} />
          </label>
          <button disabled={cargando} onClick={iniciar}>{cargando ? 'Repartiendo…' : 'Repartir'}</button>
        </>
      )}
      {activa && (
        <>
          <button className="sec" disabled={cargando} onClick={() => accion('pedir')}>Pedir</button>
          <button disabled={cargando} onClick={() => accion('plantar')}>Plantarse</button>
          {partida?.puedeDoblar && <button className="sec" disabled={cargando || saldo < partida.apuesta} onClick={() => accion('doblar')}>Doblar</button>}
        </>
      )}
    </MesaBlackjack>
  );
}
