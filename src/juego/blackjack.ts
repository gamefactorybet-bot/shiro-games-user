import { cfgConDefaults } from '../../motor/blackjack.js';
import type { BlackjackCfg, TemaBlackjack } from '../types.ts';

export const TEMAS_BLACKJACK: { id: TemaBlackjack; nombre: string }[] = [
  { id: 'noche', nombre: 'Noche' },
  { id: 'burdeos', nombre: 'Burdeos' },
  { id: 'carbon', nombre: 'Carbón' },
  { id: 'caoba', nombre: 'Caoba' },
  { id: 'zafiro', nombre: 'Zafiro' },
];

// La vista previa guarda la mesa y el formulario guarda reglas y cartas.
// Las dos escriben `blackjack_cfg` entero: si se cruzan, una pisa a la otra.
const colasBlackjack = new Map<string, Promise<void>>();

export function encolarBlackjack(juegoId: string, tarea: () => Promise<void>): Promise<void> {
  const previa = colasBlackjack.get(juegoId) ?? Promise.resolve();
  const tanda = previa.then(tarea, tarea);
  colasBlackjack.set(juegoId, tanda.then(() => undefined, () => undefined));
  return tanda;
}

export const RANGOS_BJ = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'] as const;
export const PALOS_BJ = [
  { palo: '♠', nombre: 'Picas' },
  { palo: '♥', nombre: 'Corazones' },
  { palo: '♦', nombre: 'Diamantes' },
  { palo: '♣', nombre: 'Tréboles' },
] as const;

export function claveCarta(rango: string, palo: string): string {
  return `${rango}${palo}`;
}

export function cfgBlackjack(raw: Partial<BlackjackCfg> | null | undefined): BlackjackCfg {
  return cfgConDefaults(raw || {}) as BlackjackCfg;
}
