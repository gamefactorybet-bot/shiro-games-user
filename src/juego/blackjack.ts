import { cfgConDefaults } from '../../motor/blackjack.js';
import type { BlackjackCfg, TemaBlackjack } from '../types.ts';

export const TEMAS_BLACKJACK: { id: TemaBlackjack; nombre: string; subtitulo: string; colores: [string, string] }[] = [
  { id: 'noche', nombre: 'Royal Emerald', subtitulo: 'Esmeralda y oro', colores: ['#0d4934', '#d8b76b'] },
  { id: 'burdeos', nombre: 'Burgundy Velvet', subtitulo: 'Terciopelo y latón', colores: ['#551527', '#e0b978'] },
  { id: 'carbon', nombre: 'Midnight Gold', subtitulo: 'Carbón y champagne', colores: ['#171a20', '#cdb78e'] },
  { id: 'caoba', nombre: 'Obsidian Copper', subtitulo: 'Caoba y cobre', colores: ['#3a1b0c', '#df914d'] },
  { id: 'zafiro', nombre: 'Sapphire Club', subtitulo: 'Zafiro y plata', colores: ['#112b59', '#cedbec'] },
  { id: 'monaco', nombre: 'Monaco Ivory', subtitulo: 'Marfil y champagne', colores: ['#d7c9ad', '#a67b38'] },
  { id: 'artdeco', nombre: 'Art Déco', subtitulo: 'Ébano geométrico', colores: ['#11100f', '#e5c268'] },
  { id: 'neon', nombre: 'Tokyo Neon', subtitulo: 'Índigo y magenta', colores: ['#10133c', '#f05cff'] },
  { id: 'artico', nombre: 'Arctic Glass', subtitulo: 'Cristal y hielo', colores: ['#d9eef4', '#64bace'] },
  { id: 'imperial', nombre: 'Imperial Red', subtitulo: 'Rojo y oro antiguo', colores: ['#6e101b', '#e1b55c'] },
  { id: 'havana', nombre: 'Havana Room', subtitulo: 'Cuero y nogal', colores: ['#354126', '#c68a4b'] },
  { id: 'perla', nombre: 'Pearl Minimal', subtitulo: 'Perla y grafito', colores: ['#e9e5dc', '#6e716f'] },
];

// La vista previa guarda la mesa y el formulario guarda reglas y cartas.
// Las dos escriben `blackjack_cfg` entero: si se cruzan, una pisa a la otra.
const colasBlackjack = new Map<string, Promise<void>>();

export function encolarBlackjack<T>(juegoId: string, tarea: () => Promise<T>): Promise<T> {
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

/** La previa mira la columna. La partida real también mira blackjack_cfg,
 *  porque un guardado de la columna puede no existir en la base. */
export function nombreEnMesa(juego: { mostrar_nombre?: unknown; blackjack_cfg?: unknown }): boolean {
  if (juego.mostrar_nombre === false) return false;
  return cfgBlackjack(juego.blackjack_cfg as Partial<BlackjackCfg> | null).mostrarNombre !== false;
}
