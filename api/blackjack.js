import crypto from 'node:crypto';
import { supabaseAdmin } from './_lib/supabaseAdmin.js';
import { apostar, premiar } from './_lib/proveedorCliente.js';
import { cfgConDefaults, crearMazo, sacar, valor, esBlackjack, jugarDealer, resolver } from '../motor/blackjack.js';

const idJugador = (token) => crypto.createHash('sha256').update(token).digest('hex');
const dinero = (n) => Number(Number(n).toFixed(2));
const vista = (p, ocultar = true) => ({
  roundId: p.id, estado: p.estado, apuesta: Number(p.apuesta_total),
  jugador: p.mano_jugador, dealer: ocultar && p.estado === 'en_curso' ? [null, p.mano_dealer[1]] : p.mano_dealer,
  valorJugador: valor(p.mano_jugador).total,
  valorDealer: ocultar && p.estado === 'en_curso' ? null : valor(p.mano_dealer).total,
  puedeDoblar: p.estado === 'en_curso' && p.mano_jugador.length === 2,
  ganancia: p.ganancia_final == null ? null : Number(p.ganancia_final),
});

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });
  try {
    const accion = req.body?.accion;
    if (accion === 'iniciar') return await iniciar(req, res);
    if (accion === 'pedir' || accion === 'plantar' || accion === 'doblar') return await jugar(req, res, accion);
    return res.status(400).json({ error: 'Acción de Blackjack desconocida' });
  } catch (err) { return res.status(400).json({ error: err.message || 'Error en Blackjack' }); }
}

async function juegoYPartida(body) {
  const { token, slug, roundId } = body;
  if (!token) throw new Error('Falta el token');
  const jugadorId = idJugador(token);
  const [{ data: juego }, { data: partida }] = await Promise.all([
    supabaseAdmin.from('juegos').select('*').eq('slug', slug).eq('motor', 'blackjack-clasico').maybeSingle(),
    supabaseAdmin.from('blackjack_partidas').select('*').eq('id', roundId).maybeSingle(),
  ]);
  if (!juego || !partida) throw new Error('Partida no encontrada');
  if (partida.juego_id !== juego.id || partida.jugador_id !== jugadorId) throw new Error('Esta partida no te pertenece');
  return { juego, partida, jugadorId };
}

async function iniciar(req, res) {
  const { token, slug, apuesta, clientId } = req.body || {};
  if (!token || !clientId) return res.status(400).json({ error: 'Falta token o clientId' });
  const jugadorId = idJugador(token);
  // Reintento de la misma petición: no crea ni cobra una segunda mano.
  const { data: porId } = await supabaseAdmin.from('blackjack_partidas').select('*').eq('id', clientId).maybeSingle();
  if (porId) {
    if (porId.jugador_id !== jugadorId) return res.status(403).json({ error: 'Ese identificador de ronda no te pertenece' });
    return res.status(200).json(vista(porId, porId.estado === 'en_curso'));
  }
  const { data: juego } = await supabaseAdmin.from('juegos').select('*').eq('slug', slug).eq('estado', 'listo').eq('motor', 'blackjack-clasico').maybeSingle();
  if (!juego) return res.status(404).json({ error: 'Juego no encontrado' });
  const { data: activa } = await supabaseAdmin.from('blackjack_partidas').select('*').eq('juego_id', juego.id).eq('jugador_id', jugadorId).eq('estado', 'en_curso').maybeSingle();
  if (activa) return res.status(200).json({ ...vista(activa), yaExistia: true });
  const monto = Number(apuesta);
  if (!Number.isFinite(monto) || monto < Number(juego.min_bet) || monto > Number(juego.max_bet)) return res.status(400).json({ error: 'Apuesta fuera de los límites del juego' });
  const cfg = cfgConDefaults(juego.blackjack_cfg); const mazo = crearMazo(cfg.mazos);
  const mano_jugador = [sacar(mazo), sacar(mazo)], mano_dealer = [sacar(mazo), sacar(mazo)];
  const { data: partida, error } = await supabaseAdmin.from('blackjack_partidas').insert({ id: clientId, juego_id: juego.id, jugador_id: jugadorId, apuesta: monto, apuesta_total: monto, mazo, mano_jugador, mano_dealer }).select().single();
  if (error) throw new Error(error.message);
  let saldo;
  try { saldo = Number((await apostar(token, clientId, monto)).balance); } catch (e) { await supabaseAdmin.from('blackjack_partidas').delete().eq('id', clientId); throw e; }
  if (esBlackjack(mano_jugador) || esBlackjack(mano_dealer)) {
    const resultado = esBlackjack(mano_jugador) && !esBlackjack(mano_dealer) ? 'gano' : esBlackjack(mano_dealer) && !esBlackjack(mano_jugador) ? 'perdio' : 'empate';
    const ganancia = resultado === 'gano' ? dinero(monto * (1 + cfg.pagoBlackjack)) : resultado === 'empate' ? monto : 0;
    const { data: fin } = await supabaseAdmin.from('blackjack_partidas').update({ estado: resultado, ganancia_final: ganancia }).eq('id', clientId).select().single();
    if (ganancia) saldo = Number((await premiar(token, clientId, ganancia)).balance);
    return res.status(200).json({ ...vista(fin, false), saldo, natural: true });
  }
  return res.status(200).json({ ...vista(partida), saldo, yaExistia: false });
}

async function jugar(req, res, accion) {
  const { token, roundId } = req.body || {}; const { juego, partida } = await juegoYPartida(req.body || {});
  if (partida.estado !== 'en_curso') return res.status(200).json(vista(partida, false));
  const cfg = cfgConDefaults(juego.blackjack_cfg); let mano = [...partida.mano_jugador], mazo = [...partida.mazo], apuestaTotal = Number(partida.apuesta_total);
  let saldo = null;
  if (accion === 'doblar') {
    if (!cfg.permitirDoblar || mano.length !== 2) throw new Error('No se puede doblar esta mano');
    saldo = Number((await apostar(token, `${roundId}:double`, Number(partida.apuesta))).balance); apuestaTotal += Number(partida.apuesta); mano.push(sacar(mazo));
  } else if (accion === 'pedir') mano.push(sacar(mazo));
  const debeResolver = accion === 'plantar' || accion === 'doblar' || valor(mano).total >= 21;
  let dealer = [...partida.mano_dealer], estado = 'en_curso', ganancia = null;
  if (debeResolver) { if (valor(mano).total <= 21) dealer = jugarDealer(mazo, dealer, cfg); const r = resolver(mano, dealer, cfg); estado = r.resultado; ganancia = dinero(apuestaTotal * r.multiplicador); }
  const { data: actual, error } = await supabaseAdmin.from('blackjack_partidas').update({ mano_jugador: mano, mano_dealer: dealer, mazo, apuesta_total: apuestaTotal, estado, ganancia_final: ganancia, version: partida.version + 1, updated_at: new Date().toISOString() }).eq('id', partida.id).eq('version', partida.version).select().single();
  if (error || !actual) throw new Error('La partida cambió; recargá para continuar');
  if (ganancia) saldo = Number((await premiar(token, roundId, ganancia)).balance);
  const cuerpo = { ...vista(actual, estado === 'en_curso') };
  if (saldo != null && Number.isFinite(saldo)) cuerpo.saldo = saldo;
  return res.status(200).json(cuerpo);
}
