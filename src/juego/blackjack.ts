import { cfgConDefaults } from '../../motor/blackjack.js';
import type { BlackjackCfg, TemaBlackjack } from '../types.ts';

type TemaBlackjackVista = {
  id: TemaBlackjack;
  nombre: string;
  subtitulo: string;
  colores: [string, string];
  fondo: string;
  miniatura: string;
};

const tema = (id: TemaBlackjack, nombre: string, subtitulo: string, colores: [string, string], archivo: string): TemaBlackjackVista => ({
  id, nombre, subtitulo, colores,
  fondo: `/blackjack/themes/${archivo}.webp`,
  miniatura: `/blackjack/themes/${archivo}-thumb.webp`,
});

export const TEMAS_BLACKJACK: TemaBlackjackVista[] = [
  tema('noche', 'Royal Emerald', 'Casino clásico · todo el año', ['#0d4934', '#d8b76b'], 'royal-emerald'),
  tema('burdeos', 'Halloween Manor', 'Halloween · octubre', ['#241126', '#dd873d'], 'halloween-manor'),
  tema('havana', "Saint Patrick’s Vault", 'San Patricio · marzo', ['#145c37', '#d6ad4e'], 'saint-patricks-vault'),
  tema('monaco', 'Christmas Grand Hall', 'Navidad · diciembre', ['#17402d', '#b92d34'], 'christmas-grand-hall'),
  tema('carbon', 'New Year Midnight', 'Año Nuevo · medianoche', ['#101116', '#ddb853'], 'new-year-midnight'),
  tema('imperial', 'Chinese New Year', 'Año Nuevo chino', ['#841521', '#e6b34d'], 'chinese-new-year'),
  tema('neon', 'Día de Muertos', 'Tradición mexicana · noviembre', ['#075e5c', '#db5d9d'], 'dia-de-muertos'),
  tema('perla', 'Valentine Noir', 'San Valentín · febrero', ['#6e1628', '#d4a06c'], 'valentine-noir'),
  tema('artdeco', 'Venetian Carnival', 'Carnaval de Venecia', ['#102d56', '#d5ad58'], 'venetian-carnival'),
  tema('caoba', 'Oktoberfest Lodge', 'Festival bávaro · septiembre', ['#31513a', '#ba7b35'], 'oktoberfest-lodge'),
  tema('artico', 'Winter Palace', 'Temporada de invierno', ['#607e9d', '#e2f4ff'], 'winter-palace'),
  tema('zafiro', 'Summer Riviera', 'Temporada de verano', ['#074d6b', '#d6a34f'], 'summer-riviera'),
];

export function fondoTemaBlackjack(id: TemaBlackjack): string {
  return TEMAS_BLACKJACK.find((t) => t.id === id)?.fondo || TEMAS_BLACKJACK[0].fondo;
}

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
