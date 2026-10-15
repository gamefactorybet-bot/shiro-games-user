import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FondoLoop } from './FondoLoop.tsx';
import { cargarFuenteKeno } from './juego/keno-temas.ts';
import { columnasKeno } from './juego/keno.ts';
import type { TemaKeno } from './juego/keno-temas.ts';
import type { Escenario } from './juego/escenario.ts';
import type { EstadoKeno, Juego, KenoCfg, PosControlesKeno } from './types.ts';

const fmt = (n: number) => Math.round(n).toLocaleString('es-PY');

interface KenoTableroProps {
  escenario: Escenario;
  juego: Juego;
  cfg: KenoCfg;
  tema: TemaKeno;
  pos: PosControlesKeno;
  estado: EstadoKeno;
  /** Tocar un número (marcar / desmarcar). */
  onToggle: (n: number) => void;
  /** Monto de demo para ubicar el cartel de la ganancia desde ⚙ Ajustar. */
  premioDemo?: number | null;
}

// El tablero de números del Keno: la grilla que el jugador marca y
// donde después se prenden los aciertos. Más el cartel de la ganancia,
// que vive en el escenario para poder ubicarlo en cualquier lado.
export function KenoTablero({ escenario, juego, cfg, tema, pos, estado, onToggle, premioDemo }: KenoTableroProps) {
  const fondoPantalla = (juego.fondo_url as string) || null;
  const cols = columnasKeno(cfg.tablero);
  const filas = Math.ceil(cfg.tablero / cols);

  // ---- tema ----
  useEffect(() => {
    cargarFuenteKeno(tema);
    const el = escenario.el;
    const prevBg = el.style.background;
    if (tema.stageBg && !fondoPantalla) el.style.background = tema.stageBg;
    const claves = Object.keys(tema.vars);
    for (const k of claves) el.style.setProperty(k, tema.vars[k]);
    if (tema.font) el.style.setProperty('--kn-body', tema.font.family);
    return () => {
      el.style.background = prevBg;
      for (const k of claves) el.style.removeProperty(k);
      el.style.removeProperty('--kn-body');
    };
  }, [tema, escenario, fondoPantalla]);

  // ---- contador de la ganancia ----
  const [contador, setContador] = useState(0);
  const rafRef = useRef(0);
  const res = estado.res;
  useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    if (!res || res.mult <= 0) { setContador(0); return; }
    const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dur = reduce ? 0 : Number((juego.contador_ms as number) ?? 900);
    if (dur <= 0) { setContador(res.amount); return; }
    const t0 = performance.now();
    const paso = (ahora: number) => {
      const t = Math.min(1, (ahora - t0) / dur);
      setContador(res.amount * (1 - Math.pow(1 - t, 3)));
      if (t < 1) rafRef.current = requestAnimationFrame(paso);
      else setContador(res.amount);
    };
    rafRef.current = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(rafRef.current);
  }, [res, juego.contador_ms]);

  const drawnSet = new Set(estado.drawn);
  const pickedSet = new Set(estado.picked);
  const T = pos.tablero;
  const P = pos.premio;

  return createPortal(
    <>
      {fondoPantalla && <FondoLoop url={fondoPantalla} />}

      <style>{`
        .kn-host{ position:absolute; transform:translate(-50%,-50%); z-index:9; container-type:inline-size; }
        .kn-board-head{display:flex;align-items:center;justify-content:space-between;margin:0 4px 7px;padding:0 3px;
          color:var(--text-dim,#9da6b5);font-family:var(--kn-body,inherit);font-size:9px;font-weight:800;letter-spacing:.14em;text-transform:uppercase}
        .kn-board-head strong{color:var(--text,#fff);font-family:var(--kn-font-display,var(--kn-body,inherit));font-size:10px;letter-spacing:.08em}
        .kn-board-shell{position:relative;padding:8px;border:1px solid var(--border,#2a3242);border-radius:18px;
          background:var(--kn-panel,rgba(5,8,14,.62));box-shadow:0 18px 42px rgba(0,0,0,.32),inset 0 1px rgba(255,255,255,.06);backdrop-filter:blur(10px)}
        .kn-board-shell::before{content:"";position:absolute;inset:3px;border:1px solid color-mix(in srgb,var(--kn-frame,var(--accent)) 45%,transparent);border-radius:14px;pointer-events:none}
        .kn-host .kn-grid{ display:grid; gap:2.1cqw; width:100%; position:relative; z-index:1 }
        .kn-host.denso .kn-grid{gap:1.45cqw}
        .kn-cell{
          min-width:0; min-height:0; border:1px solid color-mix(in srgb,var(--kn-frame,var(--border,#2a3242)) 46%,transparent); border-radius:24%;
          background:var(--kn-cell,var(--surface-alt,rgba(255,255,255,.05))); cursor:pointer; position:relative;overflow:hidden;
          font-family:var(--kn-font-display,var(--kn-body,monospace)); color:var(--text-dim,#8b95a6);
          display:grid; place-items:center; font-size:min(5cqw, 17px); font-weight:600;
          box-shadow:inset 0 1px rgba(255,255,255,.07),0 2px 5px rgba(0,0,0,.18);
          transition:transform .14s, border-color .18s, background .18s,box-shadow .18s,color .18s; -webkit-tap-highlight-color:transparent;
        }
        .kn-cell::before{content:"";position:absolute;inset:0;background:linear-gradient(145deg,rgba(255,255,255,.11),transparent 38%);opacity:.55;pointer-events:none}
        .kn-cell:not(:disabled):hover{transform:translateY(-1px);border-color:var(--kn-frame,var(--accent));color:var(--text,#fff);box-shadow:0 4px 12px rgba(0,0,0,.28),0 0 9px var(--kn-glow,transparent),inset 0 1px rgba(255,255,255,.12)}
        .kn-cell:not(:disabled):active{transform:scale(.94)}
        .kn-cell:disabled{ cursor:default }
        .kn-cell.pick{ background:color-mix(in srgb,var(--accent,#6b8afd) 28%,var(--kn-cell,#10141c)); border-color:var(--accent,#6b8afd); color:#fff; font-weight:800;
          box-shadow:0 0 0 1px color-mix(in srgb,var(--accent) 52%,transparent),0 0 14px var(--kn-glow,var(--accent-soft)),inset 0 0 12px var(--accent-soft)}
        .kn-cell.pick::after{content:"";position:absolute;width:4px;height:4px;right:8%;top:9%;border-radius:50%;background:var(--accent);box-shadow:0 0 6px var(--accent)}
        .kn-cell.drawn{ background:color-mix(in srgb,var(--kn-bola,#e6b354) 24%,var(--kn-cell,#10141c)); border-color:var(--kn-bola,#e6b354); color:#fff;animation:kn-numero-revela .38s cubic-bezier(.2,1.35,.35,1) }
        .kn-cell.hit{ background:color-mix(in srgb,var(--kn-acierto,#37d08b) 34%,var(--kn-cell,#10141c)); border-color:var(--kn-acierto,#37d08b); color:#fff; font-weight:800; transform:scale(1.055);
          box-shadow:0 0 0 1px color-mix(in srgb,var(--kn-acierto) 72%,#fff),0 0 18px color-mix(in srgb,var(--kn-acierto) 65%,transparent),inset 0 0 14px color-mix(in srgb,var(--kn-acierto) 35%,transparent)}
        .kn-cell.miss{ border-color:var(--danger,#e5686b); color:var(--danger,#e5686b) }
        .kn-cell.miss::after{ content:""; position:absolute; inset:14%; border-radius:4px;
          background:linear-gradient(135deg,transparent 44%,var(--danger,#e5686b) 45%,var(--danger,#e5686b) 55%,transparent 56%); opacity:.5 }
        .kn-premio{ position:absolute; transform:translate(-50%,-50%); z-index:16; pointer-events:none; }
        .kn-premio-in{
          display:flex; flex-direction:column; align-items:center; gap:2px; text-align:center;
          background:rgba(0,0,0,.5); padding:10px 22px; border-radius:16px;
          border:1px solid color-mix(in srgb, var(--kn-acierto,#37d08b) 55%, transparent);
          animation:kn-premio-pop .38s cubic-bezier(.2,1.3,.4,1);
        }
        .kn-premio .kn-monto{
          font-family:var(--kn-font-display,var(--kn-body,inherit)); font-weight:800; font-size:34px; line-height:1;
          color:var(--kn-acierto,#37d08b); font-variant-numeric:tabular-nums; text-shadow:0 2px 12px rgba(0,0,0,.55);
        }
        .kn-premio .kn-sub{ font-family:var(--kn-body,monospace); font-size:12px; font-weight:600;
          color:color-mix(in srgb, var(--kn-acierto,#37d08b) 80%, #fff); opacity:.85; }
        @keyframes kn-premio-pop{ 0%{transform:scale(.7);opacity:0} 100%{transform:scale(1);opacity:1} }
        @keyframes kn-numero-revela{0%{transform:scale(.65);filter:brightness(2)}100%{transform:scale(1);filter:brightness(1)}}
        .kn-host.premium .kn-board-shell{border-color:color-mix(in srgb,var(--kn-frame) 72%,transparent);box-shadow:0 22px 55px rgba(0,0,0,.48),0 0 22px var(--kn-glow),inset 0 1px rgba(255,255,255,.1)}
        .kn-host.premium .kn-board-head strong{text-shadow:0 0 12px var(--kn-glow)}
        @media (prefers-reduced-motion: reduce){ .kn-premio-in,.kn-cell.drawn{ animation:none } }
      `}</style>

      <div
        className={`kn-host${tema.premium ? ' premium' : ''}${cfg.tablero === 80 ? ' denso' : ''}`}
        data-tema={tema.id}
        style={{
          left: `${T.x}%`, top: `${T.y}%`, width: T.ancho,
          ['--kn-bola' as string]: tema.bola, ['--kn-acierto' as string]: tema.acierto,
        }}
      >
        <div className="kn-board-head"><span>Keno · {cfg.tablero}</span><strong>{pickedSet.size}/{cfg.maxMarcar} seleccionados</strong></div>
        <div className="kn-board-shell">
          <div className="kn-grid" style={{
            gridTemplateColumns: `repeat(${cols},1fr)`,
            gridTemplateRows: `repeat(${filas},1fr)`,
            aspectRatio: `${cols} / ${filas}`,
          }}>
            {Array.from({ length: cfg.tablero }, (_, i) => i + 1).map((n) => {
              let cls = 'kn-cell';
              if (estado.res) {
                if (pickedSet.has(n) && drawnSet.has(n)) cls += ' hit';
                else if (pickedSet.has(n)) cls += ' miss';
                else if (drawnSet.has(n)) cls += ' drawn';
              } else {
                if (pickedSet.has(n)) cls += ' pick';
                if (drawnSet.has(n)) cls += ' drawn';
              }
              return (
                <button key={n} className={cls} aria-pressed={pickedSet.has(n)} aria-label={`Número ${n}`}
                  disabled={estado.fase !== 'idle'} onClick={() => onToggle(n)}>{n}</button>
              );
            })}
          </div>
        </div>
      </div>

      {res && res.mult > 0 && (
        <div className="kn-premio" style={{ left: `${P.x}%`, top: `${P.y}%`, ['--kn-acierto' as string]: tema.acierto }}>
          <div className="kn-premio-in">
            <strong className="kn-monto">+{fmt(contador)}</strong>
            <span className="kn-sub">{res.aciertos} aciertos · ×{res.mult}</span>
          </div>
        </div>
      )}

      {premioDemo != null && premioDemo > 0 && !res && (
        <div className="kn-premio" style={{ left: `${P.x}%`, top: `${P.y}%`, ['--kn-acierto' as string]: tema.acierto }}>
          <div className="kn-premio-in">
            <strong className="kn-monto">+{fmt(premioDemo)}</strong>
            <span className="kn-sub">4 aciertos · ×12</span>
          </div>
        </div>
      )}
    </>,
    escenario.el,
  );
}
