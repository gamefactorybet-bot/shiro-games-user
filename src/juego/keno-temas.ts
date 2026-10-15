// Temas visuales del Keno. Cosmético: no toca la matemática. Los
// colores de acierto / bola / fallo son semánticos (no por tema).
// `clasico` hereda del panel y es el default.

export interface TemaKeno {
  id: string;
  nombre: string;
  font: { href: string; family: string } | null;
  stageBg: string;
  vars: Record<string, string>;
  /** Color de la bola que sale del bolillero. */
  bola: string;
  /** Color del acierto (número marcado que salió). */
  acierto: string;
  /** Color de muestra para el selector de temas del editor. */
  acento: string;
  deco: string;
  /** Fondo vertical preparado para la mesa de Keno. */
  fondo?: string;
  /** Versión liviana usada por el selector del estudio. */
  miniatura?: string;
  /** Ficha incluida con el ambiente; una ficha subida por el estudio tiene prioridad. */
  ficha?: string;
  /** Los temas premium reciben tablero, bolas y controles con mayor profundidad. */
  premium?: boolean;
}

const capaAbs = 'position:absolute;inset:0;width:100%;height:100%';

export const TEMAS: TemaKeno[] = [
  {
    id: 'clasico', nombre: 'Clásico', font: null, stageBg: '', vars: {},
    bola: '#e6b354', acierto: '#37d08b', acento: '#6b8afd', deco: '',
  },
  {
    id: 'vegas', nombre: 'Vegas',
    font: { href: 'https://fonts.googleapis.com/css2?family=Orbitron:wght@600;800&family=Rajdhani:wght@500;600;700&display=swap', family: "'Rajdhani', system-ui, sans-serif" },
    stageBg: 'radial-gradient(130% 70% at 50% 0%, #1a1206, #0b0a08 72%)',
    vars: {
      '--accent': '#f5b638', '--accent-hover': '#ffc85a', '--accent-text': '#241a03', '--accent-soft': 'rgba(245,182,56,.15)',
      '--border': 'rgba(245,182,56,.28)', '--surface-alt': 'rgba(255,255,255,.045)',
      '--text': '#f6efdf', '--text-dim': '#b4a582', '--ok': '#4fd08a', '--danger': '#ff6a5f',
      '--kn-font-display': "'Orbitron', system-ui, sans-serif",
      '--kn-btn-bg': 'linear-gradient(180deg,#ffc85a,#f5b638)', '--kn-btn-ink': '#241a03',
    },
    bola: '#f5b638', acierto: '#4fd08a', acento: '#f5b638',
    deco: `<div style="${capaAbs};background-image:repeating-linear-gradient(90deg,rgba(255,255,255,.03) 0 1px,transparent 1px 46px)"></div>`,
  },
  {
    id: 'neon', nombre: 'Neón',
    font: { href: 'https://fonts.googleapis.com/css2?family=Orbitron:wght@600;800&family=Chakra+Petch:wght@500;600;700&display=swap', family: "'Chakra Petch', system-ui, sans-serif" },
    stageBg: 'radial-gradient(120% 70% at 15% 5%, rgba(255,62,165,.28), transparent 55%), radial-gradient(120% 70% at 90% 95%, rgba(75,224,230,.22), transparent 55%), #0a0712',
    vars: {
      '--accent': '#ff3ea5', '--accent-hover': '#ff64bb', '--accent-text': '#2a0418', '--accent-soft': 'rgba(255,62,165,.16)',
      '--border': 'rgba(255,255,255,.14)', '--surface-alt': 'rgba(255,255,255,.05)',
      '--text': '#fce9f5', '--text-dim': '#c79ab6', '--ok': '#4be0c4', '--danger': '#ff6a7d',
      '--kn-font-display': "'Orbitron', system-ui, sans-serif",
      '--kn-btn-bg': 'linear-gradient(180deg,#ff64bb,#ff3ea5)', '--kn-btn-ink': '#fff',
    },
    bola: '#4be0e6', acierto: '#4be0c4', acento: '#ff3ea5',
    deco: `<div style="${capaAbs};background-image:repeating-linear-gradient(0deg,rgba(255,255,255,.03) 0 1px,transparent 1px 34px),repeating-linear-gradient(90deg,rgba(255,255,255,.03) 0 1px,transparent 1px 34px)"></div>`,
  },
  {
    id: 'oceano', nombre: 'Océano',
    font: { href: 'https://fonts.googleapis.com/css2?family=Sora:wght@600;800&family=Manrope:wght@500;600;700&display=swap', family: "'Manrope', system-ui, sans-serif" },
    stageBg: 'linear-gradient(180deg, #0b2b3f, #071722 78%)',
    vars: {
      '--accent': '#38bdd8', '--accent-hover': '#54cee6', '--accent-text': '#04161c', '--accent-soft': 'rgba(56,189,216,.14)',
      '--border': 'rgba(56,189,216,.24)', '--surface-alt': 'rgba(255,255,255,.045)',
      '--text': '#e6f4f8', '--text-dim': '#8fb3bf', '--ok': '#3fd0a0', '--danger': '#ff7a6a',
      '--kn-font-display': "'Sora', system-ui, sans-serif",
      '--kn-btn-bg': 'linear-gradient(180deg,#54cee6,#38bdd8)', '--kn-btn-ink': '#04161c',
    },
    bola: '#8fe0ef', acierto: '#3fd0a0', acento: '#38bdd8',
    deco: '',
  },
  {
    id: 'royal-emerald', nombre: 'Royal Emerald', premium: true,
    font: { href: 'https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&family=Manrope:wght@500;600;700;800&display=swap', family: "'Manrope', system-ui, sans-serif" },
    fondo: '/keno/themes/royal-emerald.webp', miniatura: '/keno/themes/royal-emerald-thumb.webp', ficha: '/blackjack/skins/chips/royal-emerald.webp',
    stageBg: '#06150f center/cover no-repeat url("/keno/themes/royal-emerald.webp")',
    vars: {
      '--accent': '#e0b85b', '--accent-hover': '#f3d27b', '--accent-text': '#211704', '--accent-soft': 'rgba(224,184,91,.2)',
      '--border': 'rgba(224,184,91,.4)', '--surface-alt': 'rgba(5,23,16,.76)', '--text': '#fff8e8', '--text-dim': '#cbbf9e',
      '--ok': '#66e1a2', '--danger': '#ff786f', '--kn-font-display': "'Cinzel', Georgia, serif", '--kn-btn-bg': 'linear-gradient(180deg,#f4d47c,#ba8125)',
      '--kn-btn-ink': '#211704', '--kn-panel': 'linear-gradient(145deg,rgba(4,30,21,.9),rgba(1,12,9,.84))', '--kn-cell': 'linear-gradient(145deg,rgba(16,62,44,.94),rgba(4,28,20,.96))',
      '--kn-frame': '#d8ad51', '--kn-glow': 'rgba(224,184,91,.42)', '--kn-ball-hi': '#fff0a7', '--kn-ball-lo': '#b77a1f',
    },
    bola: '#d9aa43', acierto: '#66e1a2', acento: '#d9aa43', deco: '',
  },
  {
    id: 'cyberpunk-district', nombre: 'Cyberpunk District', premium: true,
    font: { href: 'https://fonts.googleapis.com/css2?family=Orbitron:wght@600;700;800&family=Inter:wght@500;600;700;800&display=swap', family: "'Inter', system-ui, sans-serif" },
    fondo: '/keno/themes/cyberpunk-district.webp', miniatura: '/keno/themes/cyberpunk-district-thumb.webp', ficha: '/blackjack/skins/chips/cyberpunk-district.webp',
    stageBg: '#070615 center/cover no-repeat url("/keno/themes/cyberpunk-district.webp")',
    vars: {
      '--accent': '#ff4bd8', '--accent-hover': '#ff83e7', '--accent-text': '#fff', '--accent-soft': 'rgba(255,75,216,.2)',
      '--border': 'rgba(67,226,255,.42)', '--surface-alt': 'rgba(7,8,29,.8)', '--text': '#f8f3ff', '--text-dim': '#b9acd1',
      '--ok': '#59ffd2', '--danger': '#ff5d78', '--kn-font-display': "'Orbitron', system-ui, sans-serif", '--kn-btn-bg': 'linear-gradient(100deg,#c82cff,#ff3da9 52%,#27dff4)',
      '--kn-btn-ink': '#fff', '--kn-panel': 'linear-gradient(145deg,rgba(7,8,29,.94),rgba(18,6,35,.88))', '--kn-cell': 'linear-gradient(145deg,rgba(25,21,59,.94),rgba(8,9,31,.96))',
      '--kn-frame': '#45e4ff', '--kn-glow': 'rgba(255,58,211,.52)', '--kn-ball-hi': '#c6fbff', '--kn-ball-lo': '#22bddc',
    },
    bola: '#42def2', acierto: '#59ffd2', acento: '#ff4bd8', deco: '',
  },
  {
    id: 'inferno-vault', nombre: 'Inferno Vault', premium: true,
    font: { href: 'https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&family=Inter:wght@500;600;700;800&display=swap', family: "'Inter', system-ui, sans-serif" },
    fondo: '/keno/themes/inferno-vault.webp', miniatura: '/keno/themes/inferno-vault-thumb.webp', ficha: '/blackjack/skins/chips/inferno-vault.webp',
    stageBg: '#100603 center/cover no-repeat url("/keno/themes/inferno-vault.webp")',
    vars: {
      '--accent': '#ff872f', '--accent-hover': '#ffab55', '--accent-text': '#260b01', '--accent-soft': 'rgba(255,99,29,.22)',
      '--border': 'rgba(255,133,47,.4)', '--surface-alt': 'rgba(25,7,3,.82)', '--text': '#fff2df', '--text-dim': '#d0ad91',
      '--ok': '#ffd56a', '--danger': '#ff5b46', '--kn-font-display': "'Cinzel', Georgia, serif", '--kn-btn-bg': 'linear-gradient(180deg,#ffb34d,#e14b16)',
      '--kn-btn-ink': '#260b01', '--kn-panel': 'linear-gradient(145deg,rgba(30,9,4,.94),rgba(8,5,4,.9))', '--kn-cell': 'linear-gradient(145deg,rgba(70,22,9,.92),rgba(20,8,5,.97))',
      '--kn-frame': '#f07827', '--kn-glow': 'rgba(255,87,24,.56)', '--kn-ball-hi': '#ffe49b', '--kn-ball-lo': '#e6511b',
    },
    bola: '#ff812e', acierto: '#ffd56a', acento: '#ff6b25', deco: '',
  },
  {
    id: 'lost-atlantis', nombre: 'Lost Atlantis', premium: true,
    font: { href: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Manrope:wght@500;600;700;800&display=swap', family: "'Manrope', system-ui, sans-serif" },
    fondo: '/keno/themes/lost-atlantis.webp', miniatura: '/keno/themes/lost-atlantis-thumb.webp', ficha: '/blackjack/skins/chips/lost-atlantis.webp',
    stageBg: '#03202a center/cover no-repeat url("/keno/themes/lost-atlantis.webp")',
    vars: {
      '--accent': '#69e4e2', '--accent-hover': '#9cffff', '--accent-text': '#032025', '--accent-soft': 'rgba(105,228,226,.2)',
      '--border': 'rgba(156,255,255,.42)', '--surface-alt': 'rgba(2,34,45,.76)', '--text': '#edffff', '--text-dim': '#acd4d5',
      '--ok': '#8fffb6', '--danger': '#ff8186', '--kn-font-display': "'Cormorant Garamond', Georgia, serif", '--kn-btn-bg': 'linear-gradient(180deg,#c4ffff,#4cc9cf)',
      '--kn-btn-ink': '#032025', '--kn-panel': 'linear-gradient(145deg,rgba(3,53,63,.86),rgba(2,25,36,.88))', '--kn-cell': 'linear-gradient(145deg,rgba(20,96,106,.9),rgba(4,43,54,.94))',
      '--kn-frame': '#a7ebe0', '--kn-glow': 'rgba(75,221,232,.48)', '--kn-ball-hi': '#efffff', '--kn-ball-lo': '#3fc5cf',
    },
    bola: '#71e4e7', acierto: '#8fffb6', acento: '#67dfe2', deco: '',
  },
  {
    id: 'galactic-horizon', nombre: 'Galactic Horizon', premium: true,
    font: { href: 'https://fonts.googleapis.com/css2?family=Orbitron:wght@600;700;800&family=Manrope:wght@500;600;700;800&display=swap', family: "'Manrope', system-ui, sans-serif" },
    fondo: '/keno/themes/galactic-horizon.webp', miniatura: '/keno/themes/galactic-horizon-thumb.webp', ficha: '/blackjack/skins/chips/galactic-horizon.webp',
    stageBg: '#07071c center/cover no-repeat url("/keno/themes/galactic-horizon.webp")',
    vars: {
      '--accent': '#ab7cff', '--accent-hover': '#c8a5ff', '--accent-text': '#fff', '--accent-soft': 'rgba(171,124,255,.2)',
      '--border': 'rgba(121,176,255,.42)', '--surface-alt': 'rgba(8,9,35,.8)', '--text': '#f5f3ff', '--text-dim': '#b7b5d7',
      '--ok': '#68f3d2', '--danger': '#ff728e', '--kn-font-display': "'Orbitron', system-ui, sans-serif", '--kn-btn-bg': 'linear-gradient(100deg,#6654ef,#a452e7 52%,#438ee9)',
      '--kn-btn-ink': '#fff', '--kn-panel': 'linear-gradient(145deg,rgba(9,10,43,.94),rgba(20,8,50,.88))', '--kn-cell': 'linear-gradient(145deg,rgba(33,32,87,.92),rgba(10,10,42,.96))',
      '--kn-frame': '#9ca8ff', '--kn-glow': 'rgba(144,91,255,.52)', '--kn-ball-hi': '#eee7ff', '--kn-ball-lo': '#765ce6',
    },
    bola: '#967cff', acierto: '#68f3d2', acento: '#a06eff', deco: '',
  },
];

const POR_ID = new Map(TEMAS.map((t) => [t.id, t]));
export const TEMA_KENO_DEFAULT = 'clasico';

export function temaKenoDe(id: string | undefined | null): TemaKeno {
  return POR_ID.get(id || '') || POR_ID.get(TEMA_KENO_DEFAULT)!;
}

export function cargarFuenteKeno(tema: TemaKeno): void {
  if (!tema.font || typeof document === 'undefined') return;
  const id = 'kn-font-' + tema.id;
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = tema.font.href;
  document.head.appendChild(link);
}
