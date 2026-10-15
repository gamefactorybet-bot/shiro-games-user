import { cfgConDefaults } from '../../motor/blackjack.js';
import type { BlackjackCfg } from '../types.ts';

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
