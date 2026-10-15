import { useState } from 'react';
import { Rango } from './AjustePanel.tsx';
import { mesaDe } from '../motor/blackjack.js';
import { encolarBlackjack, TEMAS_BLACKJACK } from './juego/blackjack.ts';
import { supabase } from './supabase.ts';
import type { AjusteBlackjackElem, DisenoBlackjack, Juego, PiezaBlackjack } from './types.ts';

const PIEZAS: { id: AjusteBlackjackElem; etiqueta: string }[] = [
  { id: 'pano', etiqueta: 'Paño' },
  { id: 'cartas', etiqueta: 'Cartas' },
  { id: 'crupier', etiqueta: 'Crupier' },
  { id: 'jugador', etiqueta: 'Jugador' },
  { id: 'aro', etiqueta: 'Centro' },
  { id: 'mazo', etiqueta: 'Mazo' },
  { id: 'nombre', etiqueta: 'Nombre' },
  { id: 'saldo', etiqueta: 'Saldo' },
  { id: 'controles', etiqueta: 'Botones' },
  { id: 'fichas', etiqueta: 'Fichas' },
];

const ES_ZONA = new Set<AjusteBlackjackElem>(['nombre', 'saldo', 'mazo', 'crupier', 'aro', 'jugador', 'controles']);

// Panel de la vista previa del 21. Mueve y escala cada pieza, y guarda
// el diseño en `blackjack_cfg.mesa` sin pisar las reglas ni las cartas.
export function AjusteBlackjack({ juego, mesa, onChange, elem, onElem, onGuardada }: {
  juego: Juego;
  mesa: DisenoBlackjack;
  onChange: (mesa: DisenoBlackjack) => void;
  elem: AjusteBlackjackElem;
  onElem: (id: AjusteBlackjackElem) => void;
  onGuardada?: (cfg: Juego['blackjack_cfg']) => void;
}) {
  const [msg, setMsg] = useState('');
  const zona = ES_ZONA.has(elem) ? mesa[elem as PiezaBlackjack] : null;

  const setZona = (prop: 'x' | 'y' | 'escala', n: number) => {
    if (!ES_ZONA.has(elem)) return;
    const id = elem as PiezaBlackjack;
    onChange({ ...mesa, [id]: { ...mesa[id], [prop]: n } });
  };

  const guardar = () => {
    setMsg('Guardando...');
    void encolarBlackjack(juego.id, async () => {
      const { data, error: lectura } = await supabase.from('juegos').select('blackjack_cfg').eq('id', juego.id).single();
      if (lectura) throw lectura;
      const base = (data?.blackjack_cfg && typeof data.blackjack_cfg === 'object') ? data.blackjack_cfg as Record<string, unknown> : {};
      const next = { ...base, mesa };
      const { error } = await supabase.from('juegos').update({ blackjack_cfg: next }).eq('id', juego.id);
      if (error) throw error;
      juego.blackjack_cfg = next;
      onGuardada?.(next);
    }).then(() => setMsg('Guardado ✓'), (e: { message?: string }) => setMsg(e?.message || 'No se pudo guardar'));
  };

  return (
    <div className="card" style={{ width: 280, maxHeight: 'min(860px, 92vh)', overflow: 'auto', position: 'relative', zIndex: 50 }}>
      <strong>Mesa de 21</strong>
      <p className="hint" style={{ margin: '4px 0 10px' }}>
        Elegí una pieza y movela con los controles, o arrastrala en la mesa.
        El tamaño está en la escala o en el ancho de la carta.
      </p>

      <div className="grupo-nav" style={{ marginBottom: 10 }}>
        {TEMAS_BLACKJACK.map((t) => (
          <button key={t.id} type="button" className={`grupo-btn ${mesa.tema === t.id ? 'on' : ''}`}
            style={{ flex: 1, justifyContent: 'center', fontSize: 12 }}
            onClick={() => onChange({ ...mesa, tema: t.id })}>{t.nombre}</button>
        ))}
      </div>

      <div className="grupo-nav" style={{ marginBottom: 12 }}>
        {PIEZAS.map((p) => (
          <button key={p.id} type="button" className={`grupo-btn ${elem === p.id ? 'on' : ''}`}
            style={{ flex: '1 1 30%', fontSize: 12, justifyContent: 'center' }}
            onClick={() => onElem(p.id)}>{p.etiqueta}</button>
        ))}
      </div>

      {elem === 'pano' && (
        <>
          <Rango etiqueta="Posición X" min={0} max={100} valor={mesa.pano.x} onInput={(n) => onChange({ ...mesa, pano: { ...mesa.pano, x: n } })} />
          <Rango etiqueta="Posición Y" min={0} max={100} valor={mesa.pano.y} onInput={(n) => onChange({ ...mesa, pano: { ...mesa.pano, y: n } })} />
          <Rango etiqueta="Ancho" min={40} max={100} valor={mesa.pano.ancho} onInput={(n) => onChange({ ...mesa, pano: { ...mesa.pano, ancho: n } })} />
          <Rango etiqueta="Alto" min={32} max={96} valor={mesa.pano.alto} onInput={(n) => onChange({ ...mesa, pano: { ...mesa.pano, alto: n } })} />
        </>
      )}

      {elem === 'cartas' && (
        <>
          <Rango etiqueta="Ancho de la carta" min={48} max={150} unidad="px" valor={mesa.cartaAncho} onInput={(n) => onChange({ ...mesa, cartaAncho: n })} />
          <Rango etiqueta="Alto de la carta" min={68} max={210} unidad="px" valor={mesa.cartaAlto} onInput={(n) => onChange({ ...mesa, cartaAlto: n })} />
        </>
      )}

      {elem === 'fichas' && (
        <p className="hint" style={{ margin: '4px 0 0' }}>
          Arrastrá las fichas sobre la mesa. En fila se mueve cada una. En abanico y columna se mueve el botón cerrado.
          El valor y la imagen se cargan en <b>Jugabilidad → Fichas de apuesta rápida</b>.
        </p>
      )}

      {zona && 'escala' in zona && (
        <>
          <Rango etiqueta="Posición X" min={0} max={100} valor={zona.x} onInput={(n) => setZona('x', n)} />
          <Rango etiqueta="Posición Y" min={0} max={100} valor={zona.y} onInput={(n) => setZona('y', n)} />
          <Rango etiqueta="Escala" min={40} max={180} unidad="%" valor={zona.escala} onInput={(n) => setZona('escala', n)} />
        </>
      )}

      <button type="button" style={{ width: '100%', marginTop: 8 }} onClick={() => onChange(mesaDe(null) as DisenoBlackjack)}>Volver al diseño inicial</button>
      <button type="button" className="primary" style={{ width: '100%', marginTop: 8 }} onClick={guardar}>Guardar mesa</button>
      <p className="hint">{msg}</p>
    </div>
  );
}
