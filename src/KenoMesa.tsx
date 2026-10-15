import type { CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import type { Escenario } from './juego/escenario.ts';
import type { EstadoKeno, KenoCfg, PosControlesKeno } from './types.ts';

const fmt = (n: number) => Math.round(n).toLocaleString('es-PY');
const mx = (n: number) => (n >= 100 ? String(Math.round(n)) : n >= 10 ? n.toFixed(1) : n.toFixed(2)) + '×';

const centrado = (p: { x: number; y: number }): CSSProperties => ({
  position: 'absolute', left: `${p.x}%`, top: `${p.y}%`, transform: 'translate(-50%,-50%)',
});

interface KenoMesaProps {
  escenario: Escenario;
  cfg: KenoCfg;
  pos: PosControlesKeno;
  estado: EstadoKeno;
  minBet: number;
  maxBet: number;
  pasoApuesta: number;
  /** Tabla de multiplicadores para la cantidad marcada ahora. */
  tabla: number[];
  /** El juego usa fichas: se ocultan los −/+. */
  ocultarApuesta?: boolean;
  /** Además, ocultar del todo el recuadro de apuesta. */
  ocultarCaja?: boolean;
  onCambiarApuesta: (n: number) => void;
  onAuto: (cantidad?: number) => void;
  onLimpiar: () => void;
  /** Vuelve a edición conservando la selección y la apuesta. */
  onPreparar: () => void;
  onJugar: () => void;
}

// La "mesa" del Keno: saldo, historial, bolillero, apuesta, acciones y
// el botón, cada uno en una capa aparte (portal en el escenario) y
// posicionable desde ⚙ Ajustar.
export function KenoMesa({
  escenario, cfg, pos, estado, minBet, maxBet, pasoApuesta, tabla, ocultarApuesta, ocultarCaja,
  onCambiarApuesta, onAuto, onLimpiar, onPreparar, onJugar,
}: KenoMesaProps) {
  const { fase, picked, drawn, res } = estado;
  const jugando = fase === 'rolling';
  const btnDisabled = jugando || !picked.length || estado.saldo < estado.apuesta;
  const opcionesAzar = Array.from(new Set([3, 5, 8, 10, cfg.maxMarcar])).filter((n) => n <= cfg.maxMarcar);
  const pickedSet = new Set(picked);

  const nota = jugando ? 'Saliendo las bolas…'
    : res ? `${res.aciertos} de ${picked.length} aciertos` + (res.mult > 0 ? ` · paga ×${res.mult}` : ' · sin premio')
    : picked.length ? `${picked.length} marcados` + (picked.length >= cfg.maxMarcar ? ' · máximo' : '')
    : `Marcá entre 1 y ${cfg.maxMarcar} números`;

  const capa = (
    <div className="kn-layer" style={{ position: 'absolute', inset: 0, zIndex: 11, pointerEvents: 'none', fontFamily: 'var(--kn-body, inherit)' }}>
      <style>{`
        .kn-layer .kn-info-card{padding:7px 13px;border:1px solid var(--border);border-radius:13px;background:var(--kn-panel,var(--surface-alt));box-shadow:0 8px 24px rgba(0,0,0,.28),inset 0 1px rgba(255,255,255,.07);backdrop-filter:blur(10px)}
        .kn-bolillero{position:relative;display:flex;gap:5px;flex-wrap:wrap;justify-content:center;align-content:center;min-height:42px;padding:20px 10px 8px;border:1px solid var(--border);border-radius:15px;background:var(--kn-panel,var(--surface-alt));box-shadow:0 12px 30px rgba(0,0,0,.3),0 0 16px var(--kn-glow,transparent),inset 0 1px rgba(255,255,255,.08);backdrop-filter:blur(10px);overflow:hidden}
        .kn-bolillero-head{position:absolute;left:11px;right:11px;top:5px;display:flex;justify-content:space-between;font-size:8px;font-weight:800;letter-spacing:.13em;text-transform:uppercase;color:var(--text-dim)}
        .kn-bola{width:28px;height:28px;border-radius:50%;display:grid;place-items:center;flex-shrink:0;position:relative;font-family:var(--kn-font-display,var(--kn-body,monospace));font-size:11px;font-weight:800;color:#151006;background:radial-gradient(circle at 32% 27%,var(--kn-ball-hi,#fff2b2) 0 12%,var(--kn-bola,#e6b354) 40%,var(--kn-ball-lo,#a96819) 100%);border:1px solid rgba(255,255,255,.64);box-shadow:inset -4px -5px 7px rgba(0,0,0,.24),0 3px 8px rgba(0,0,0,.5);animation:kn-bola-pop .34s cubic-bezier(.2,1.4,.4,1)}
        .kn-bola.hit{color:#062217;box-shadow:inset -4px -5px 7px rgba(0,0,0,.2),0 0 0 2px var(--kn-acierto),0 0 14px var(--kn-acierto)}
        .kn-bola.actual{transform:scale(1.14);z-index:2;filter:brightness(1.08)}
        .kn-actions{display:flex;align-items:center;justify-content:center;gap:5px;padding:6px;border:1px solid var(--border);border-radius:14px;background:var(--kn-panel,var(--surface-alt));box-shadow:0 9px 22px rgba(0,0,0,.25);backdrop-filter:blur(9px)}
        .kn-actions-label{padding:0 4px;color:var(--text-dim);font-size:8px;font-weight:800;letter-spacing:.12em}
        .kn-quick{width:31px;height:31px;padding:0;border:1px solid var(--border);border-radius:9px;background:var(--surface-alt);color:var(--text);font:800 10px var(--kn-font-display,var(--kn-body));cursor:pointer;transition:.15s}
        .kn-quick:hover:not(:disabled){border-color:var(--accent);color:var(--accent);transform:translateY(-1px);box-shadow:0 0 10px var(--kn-glow,transparent)}
        .kn-action-text{min-width:76px;height:31px;padding:0 10px;border:1px solid var(--border);border-radius:9px;background:var(--surface-alt);color:var(--text-dim);font:700 10px var(--kn-body);cursor:pointer}
        .kn-play{isolation:isolate;overflow:hidden;transition:transform .15s,filter .15s,box-shadow .15s}
        .kn-play::before{content:"";position:absolute;inset:2px;border:1px solid rgba(255,255,255,.3);border-radius:calc(var(--kn-radius,14px) - 2px);pointer-events:none}
        .kn-play::after{content:"";position:absolute;top:-70%;left:-32%;width:25%;height:240%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.38),transparent);transform:rotate(18deg);animation:kn-btn-brillo 3.8s ease-in-out infinite;pointer-events:none}
        .kn-play:hover:not(:disabled){transform:translate(-50%,-52%) scale(1.015)!important;filter:brightness(1.08);box-shadow:0 12px 34px -7px var(--kn-glow,rgba(0,0,0,.5))!important}
        @keyframes kn-bola-pop{from{transform:translateY(-12px) scale(.25) rotate(-30deg);opacity:0}to{transform:translateY(0) scale(1) rotate(0);opacity:1}}
        @keyframes kn-btn-brillo{0%,62%{left:-32%}90%,100%{left:120%}}
        @media(prefers-reduced-motion:reduce){.kn-bola,.kn-play::after{animation:none}}
      `}</style>

      {/* Historial */}
      <div style={{
        ...centrado(pos.historial), display: 'flex', gap: 5, maxWidth: '86%', overflow: 'hidden',
        WebkitMaskImage: 'linear-gradient(90deg, transparent, #000 12px, #000 calc(100% - 12px), transparent)',
        maskImage: 'linear-gradient(90deg, transparent, #000 12px, #000 calc(100% - 12px), transparent)',
      }}>
        {estado.historial.slice(0, 10).map((v, i) => (
          <span key={i} style={{
            flexShrink: 0, fontSize: 11, fontWeight: 700, padding: '2px 6px', borderRadius: 6,
            fontVariantNumeric: 'tabular-nums',
            background: v > 0 ? 'var(--accent-soft)' : 'var(--surface-alt)',
            color: v >= 10 ? '#ff8a3d' : v > 0 ? 'var(--ok)' : 'var(--text-dim)',
          }}>{v > 0 ? mx(v) : '–'}</span>
        ))}
      </div>

      {/* Saldo */}
      <div className="kn-info-card" style={{ ...centrado(pos.saldo), textAlign: 'center', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
        <span className="hint" style={{ margin: 0, fontSize: 9, textTransform: 'uppercase' }}>Saldo</span>
        <strong style={{ display: 'block', fontSize: 14 }}>{fmt(estado.saldo)}</strong>
      </div>

      {/* Bolillero */}
      <div className="kn-bolillero" style={{ ...centrado(pos.bolillero), width: `${pos.bolillero.ancho}%` }}>
        <div className="kn-bolillero-head"><span>Sorteo</span><span>{drawn.length}/{cfg.bolas}</span></div>
        {drawn.length
          ? drawn.map((n, i) => (
            <span key={i} className={`kn-bola${pickedSet.has(n) ? ' hit' : ''}${i === drawn.length - 1 ? ' actual' : ''}`}>{n}</span>
          ))
          : <span className="hint" style={{ margin: 0, alignSelf: 'center', fontSize: 10 }}>Las bolas aparecerán en esta bandeja</span>}
      </div>

      {/* Tabla de pagos de la selección actual */}
      {picked.length > 0 && !res && (
        <div style={{
          position: 'absolute', left: `${pos.apuesta.x}%`, top: `calc(${pos.apuesta.y}% - 40px)`, transform: 'translate(-50%,-50%)',
          display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center', maxWidth: '90%',
        }}>
          {tabla.map((m, h) => (m > 0
            ? <span key={h} style={{
                fontFamily: 'var(--kn-font-display, monospace)', fontSize: 10.5, padding: '2px 6px', borderRadius: 6,
                background: 'var(--surface-alt)', border: '1px solid var(--border)', color: 'var(--text-dim)',
              }}>{h}→{mx(m)}</span>
            : null))}
        </div>
      )}

      {/* Apuesta */}
      {ocultarCaja ? null : ocultarApuesta ? (
        <div style={{ ...centrado(pos.apuesta), textAlign: 'center', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
          <span className="hint" style={{ display: 'block', fontSize: 9, margin: 0, textTransform: 'uppercase' }}>Apuesta</span>
          <strong style={{ fontSize: 15 }}>{fmt(estado.apuesta)}</strong>
        </div>
      ) : (
        <div style={{ ...centrado(pos.apuesta), display: 'flex', alignItems: 'center', gap: 8, pointerEvents: 'auto' }}>
          <button disabled={jugando} onClick={() => onCambiarApuesta(Math.max(minBet, estado.apuesta - pasoApuesta))} style={stepBtn}>−</button>
          <span style={{ minWidth: 92, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>
            <span className="hint" style={{ display: 'block', fontSize: 9, margin: 0, textTransform: 'uppercase' }}>Apuesta</span>
            <strong style={{ fontSize: 15 }}>{fmt(estado.apuesta)}</strong>
          </span>
          <button disabled={jugando} onClick={() => onCambiarApuesta(Math.min(maxBet, estado.apuesta + pasoApuesta))} style={stepBtn}>+</button>
        </div>
      )}

      {/* Acciones */}
      <div className="kn-actions" style={{ ...centrado(pos.acciones), pointerEvents: 'auto' }}>
        {res ? (
          <>
            <button onClick={onPreparar} className="kn-action-text">Cambiar</button>
            <button onClick={onLimpiar} className="kn-action-text">Limpiar</button>
          </>
        ) : (
          <>
            <span className="kn-actions-label">AZAR</span>
            {opcionesAzar.map((n) => <button key={n} disabled={fase !== 'idle'} onClick={() => onAuto(n)} className="kn-quick" aria-label={`Elegir ${n} números al azar`}>{n}</button>)}
            <button disabled={jugando || !picked.length} onClick={onLimpiar} className="kn-action-text">Limpiar</button>
          </>
        )}
      </div>

      {/* Botón principal */}
      <button
        className="jg-play kn-play"
        onClick={onJugar}
        disabled={btnDisabled}
        style={{
          position: 'absolute', left: `${pos.boton.x}%`, top: `${pos.boton.y}%`, transform: 'translate(-50%,-50%)',
          width: pos.boton.ancho, height: pos.boton.alto, pointerEvents: 'auto',
          border: 0, borderRadius: 'var(--kn-radius, 14px)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--kn-font-display, var(--kn-body, inherit))', fontWeight: 800, letterSpacing: 1, fontSize: 17,
          background: pos.boton.imagen_url
            ? `center/100% 100% no-repeat url("${pos.boton.imagen_url}")`
            : 'var(--kn-btn-bg, var(--accent))',
          color: pos.boton.imagen_url ? '#fff' : 'var(--kn-btn-ink, var(--accent-text, #fff))',
          boxShadow: pos.boton.imagen_url ? 'none' : '0 10px 26px -8px rgba(0,0,0,.35)',
          textShadow: pos.boton.imagen_url ? '0 1px 3px rgba(0,0,0,.6)' : undefined,
          opacity: btnDisabled ? 0.55 : 1,
        }}>
        {jugando ? 'Sorteando' : res ? 'Repetir jugada' : 'Jugar'}
      </button>

      {/* Nota / error */}
      <p style={{
        position: 'absolute', left: '50%', top: `${Math.min(98, pos.boton.y + 6)}%`, transform: 'translateX(-50%)',
        margin: 0, maxWidth: '86%', textAlign: 'center', fontSize: 12, fontWeight: 600,
        color: estado.error ? 'var(--danger)' : 'var(--text-dim)', zIndex: 13,
      }}>{estado.error || nota}</p>
    </div>
  );

  return createPortal(capa, escenario.el);
}

const stepBtn: CSSProperties = {
  width: 40, height: 44, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface-alt)',
  color: 'var(--text)', fontSize: 20, fontWeight: 700, cursor: 'pointer',
};
