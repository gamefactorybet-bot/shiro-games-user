import type { ReactNode } from 'react';
import { nombreProveedor } from './marca.ts';
import { claveCarta } from './juego/blackjack.ts';
import type { BlackjackCfg } from './types.ts';

export type CartaBj = { rango: string; palo: string } | null;

const roja = (palo?: string) => palo === '♥' || palo === '♦';

export function CartaVista({
  carta, oculta = false, piel,
}: {
  carta: CartaBj;
  oculta?: boolean;
  piel: Pick<BlackjackCfg, 'reversoUrl' | 'cartas'>;
}) {
  if (oculta || !carta) {
    return piel.reversoUrl
      ? <div className="bj-carta bj-foto" style={{ backgroundImage: `url("${piel.reversoUrl}")` }} />
      : <div className="bj-carta bj-oculta" aria-hidden><i /></div>;
  }
  const cara = piel.cartas[claveCarta(carta.rango, carta.palo)];
  if (cara) return <div className="bj-carta bj-foto" style={{ backgroundImage: `url("${cara}")` }} />;
  return (
    <div className={`bj-carta ${roja(carta.palo) ? 'roja' : ''}`}>
      <b>{carta.rango}</b>
      <span>{carta.palo}</span>
    </div>
  );
}

export function MesaBlackjack({
  nombre, saldo, mensaje, dealer, valorDealer, jugador, valorJugador, piel, error, demo, children,
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
  children: ReactNode;
}) {
  const crupier = dealer.length ? dealer : [null];
  return (
    <main className={`blackjack${demo ? ' demo' : ''}`}>
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
        <div>
          <div className="bj-label">Crupier {valorDealer != null ? `· ${valorDealer}` : ''}</div>
          <div className="bj-mano">
            {crupier.map((c, i) => <CartaVista key={i} carta={c} oculta={!c} piel={piel} />)}
          </div>
        </div>
        <div className="bj-centro">
          <div className="bj-aro">Apuesta</div>
          <div className="bj-resultado">{mensaje}</div>
        </div>
        <div>
          <div className="bj-label">Jugador {valorJugador != null ? `· ${valorJugador}` : ''}</div>
          <div className="bj-mano">
            {jugador.map((c, i) => <CartaVista key={i} carta={c} piel={piel} />)}
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
  min-height:100vh;box-sizing:border-box;padding:28px 20px 22px;color:#f6efe2;
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
.bj-mano{display:flex;justify-content:center;min-height:124px}
.bj-mano .bj-carta{margin:0 -6px}
.bj-carta{
  width:82px;height:118px;border-radius:11px;padding:8px 8px 6px;box-sizing:border-box;
  text-align:left;display:flex;flex-direction:column;justify-content:space-between;
  font-family:Georgia,"Times New Roman",serif;
  background:linear-gradient(180deg,#fffdf8 0%,#f4ead8 100%);
  color:#1a140f;
  box-shadow:0 12px 18px rgba(0,0,0,.45), inset 0 0 0 1px rgba(255,255,255,.7);
}
.bj-carta b{font-size:22px;line-height:1}
.bj-carta span{font-size:28px;line-height:.8;align-self:flex-end}
.bj-carta.roja{color:#9d1c2b}
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
.blackjack button{
  border:0;border-radius:999px;cursor:pointer;
  background:linear-gradient(180deg,#f0d48a,#b8883a);
  color:#1a120c;padding:12px 22px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;font-size:12px;
  box-shadow:0 8px 16px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.55);
}
.blackjack button.sec{
  background:linear-gradient(180deg,#2a2118,#14110e);color:#e7c98a;
  box-shadow:inset 0 0 0 1px rgba(198,161,90,.55);
}
.blackjack button:disabled{opacity:.4;cursor:not-allowed}
.bj-error{color:#ffb4b4;text-align:center;margin:0;width:100%}
@media(max-width:600px){
  .blackjack{padding:16px 10px}
  .blackjack.demo{padding-top:58px}
  .bj-mesa{border-width:10px;border-radius:90px 90px 22px 22px;min-height:460px;padding:22px 8px}
  .bj-carta{width:64px;height:94px}
  .bj-carta b{font-size:16px}
  .bj-carta span{font-size:20px}
  .bj-aro{width:120px;height:48px}
}
`;
