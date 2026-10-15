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

type FuentePremium = 'clasica' | 'moderna' | 'futurista' | 'romantica';
type PaletaPremium = {
  acento: string; marco: string; oscuro: string; medio: string;
  bolaClara: string; bolaOscura: string; acierto: string;
  tinta?: string; fuente?: FuentePremium;
};

const FUENTES_PREMIUM: Record<FuentePremium, { href: string; body: string; display: string }> = {
  clasica: { href: 'https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&family=Manrope:wght@500;600;700;800&display=swap', body: "'Manrope', system-ui, sans-serif", display: "'Cinzel', Georgia, serif" },
  moderna: { href: 'https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Manrope:wght@500;600;700;800&display=swap', body: "'Manrope', system-ui, sans-serif", display: "'Sora', system-ui, sans-serif" },
  futurista: { href: 'https://fonts.googleapis.com/css2?family=Orbitron:wght@600;700;800&family=Inter:wght@500;600;700;800&display=swap', body: "'Inter', system-ui, sans-serif", display: "'Orbitron', system-ui, sans-serif" },
  romantica: { href: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Manrope:wght@500;600;700;800&display=swap', body: "'Manrope', system-ui, sans-serif", display: "'Cormorant Garamond', Georgia, serif" },
};

const temaPremium = (id: string, nombre: string, archivo: string, p: PaletaPremium): TemaKeno => {
  const f = FUENTES_PREMIUM[p.fuente || 'clasica'];
  const tinta = p.tinta || '#fff';
  return {
    id, nombre, premium: true,
    font: { href: f.href, family: f.body },
    fondo: `/keno/themes/${archivo}.webp`, miniatura: `/keno/themes/${archivo}-thumb.webp`, ficha: `/blackjack/skins/chips/${archivo}.webp`,
    stageBg: `${p.oscuro} center/cover no-repeat url("/keno/themes/${archivo}.webp")`,
    vars: {
      '--accent': p.acento, '--accent-hover': `color-mix(in srgb,${p.acento} 76%,#fff)`, '--accent-text': tinta,
      '--accent-soft': `color-mix(in srgb,${p.acento} 20%,transparent)`, '--border': `color-mix(in srgb,${p.marco} 42%,transparent)`,
      '--surface-alt': `color-mix(in srgb,${p.oscuro} 80%,transparent)`, '--text': '#fffaf1', '--text-dim': `color-mix(in srgb,${p.marco} 58%,#aab0bb)`,
      '--ok': p.acierto, '--danger': '#ff6f76', '--kn-font-display': f.display,
      '--kn-btn-bg': `linear-gradient(180deg,color-mix(in srgb,${p.acento} 70%,#fff),${p.acento})`, '--kn-btn-ink': tinta,
      '--kn-panel': `linear-gradient(145deg,color-mix(in srgb,${p.oscuro} 92%,transparent),color-mix(in srgb,#030509 86%,${p.oscuro}))`,
      '--kn-cell': `linear-gradient(145deg,color-mix(in srgb,${p.medio} 86%,#fff 5%),color-mix(in srgb,${p.oscuro} 94%,#000))`,
      '--kn-frame': p.marco, '--kn-glow': `color-mix(in srgb,${p.acento} 48%,transparent)`, '--kn-ball-hi': p.bolaClara, '--kn-ball-lo': p.bolaOscura,
    },
    bola: p.acento, acierto: p.acierto, acento: p.acento, deco: '',
  };
};

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
  temaPremium('royal-emerald', 'Royal Emerald', 'royal-emerald', { acento:'#d9aa43', marco:'#e0c276', oscuro:'#06150f', medio:'#164b37', bolaClara:'#fff0a7', bolaOscura:'#a96d19', acierto:'#66e1a2', tinta:'#211704' }),
  temaPremium('halloween-manor', 'Halloween Manor', 'halloween-manor', { acento:'#f08a35', marco:'#b96cff', oscuro:'#120718', medio:'#3b1642', bolaClara:'#ffe0a0', bolaOscura:'#a84720', acierto:'#80f0bd' }),
  temaPremium('saint-patricks-vault', 'Saint Patrick’s Vault', 'saint-patricks-vault', { acento:'#e0b949', marco:'#63d98b', oscuro:'#04170d', medio:'#125c35', bolaClara:'#fff2a1', bolaOscura:'#a77315', acierto:'#63f2a0', tinta:'#201704' }),
  temaPremium('christmas-grand-hall', 'Christmas Grand Hall', 'christmas-grand-hall', { acento:'#d8b453', marco:'#e7cc83', oscuro:'#071711', medio:'#164630', bolaClara:'#fff2b1', bolaOscura:'#a3701e', acierto:'#70e6a2', tinta:'#211704' }),
  temaPremium('new-year-midnight', 'New Year Midnight', 'new-year-midnight', { acento:'#e1bc59', marco:'#f0d58c', oscuro:'#08090d', medio:'#28231b', bolaClara:'#fff5c5', bolaOscura:'#9c721d', acierto:'#79e8c1', tinta:'#211704', fuente:'moderna' }),
  temaPremium('chinese-new-year', 'Chinese New Year', 'chinese-new-year', { acento:'#e7b74e', marco:'#ffd477', oscuro:'#220407', medio:'#78141d', bolaClara:'#fff1ad', bolaOscura:'#ac6218', acierto:'#75e7a0', tinta:'#271104' }),
  temaPremium('dia-de-muertos', 'Día de Muertos', 'dia-de-muertos', { acento:'#ed69bd', marco:'#39e1d0', oscuro:'#12091b', medio:'#4e1c55', bolaClara:'#ffd7f2', bolaOscura:'#a62e75', acierto:'#65f0c5', fuente:'moderna' }),
  temaPremium('valentine-noir', 'Valentine Noir', 'valentine-noir', { acento:'#d56379', marco:'#e5ae8a', oscuro:'#16070b', medio:'#4b1722', bolaClara:'#ffe1df', bolaOscura:'#9b3247', acierto:'#f3c68c', fuente:'romantica' }),
  temaPremium('venetian-carnival', 'Venetian Carnival', 'venetian-carnival', { acento:'#d4ad55', marco:'#79aaff', oscuro:'#061226', medio:'#153b70', bolaClara:'#fff0b0', bolaOscura:'#99701c', acierto:'#6ce2ca', tinta:'#211704', fuente:'romantica' }),
  temaPremium('oktoberfest-lodge', 'Oktoberfest Lodge', 'oktoberfest-lodge', { acento:'#d49a45', marco:'#b7d58b', oscuro:'#0d170f', medio:'#365a36', bolaClara:'#ffe8a2', bolaOscura:'#965a1e', acierto:'#76e6a0', tinta:'#241604' }),
  temaPremium('winter-palace', 'Winter Palace', 'winter-palace', { acento:'#9adfff', marco:'#e6f8ff', oscuro:'#071827', medio:'#245473', bolaClara:'#ffffff', bolaOscura:'#4c96bd', acierto:'#a6ffdf', tinta:'#06202b', fuente:'romantica' }),
  temaPremium('summer-riviera', 'Summer Riviera', 'summer-riviera', { acento:'#42cbea', marco:'#e3c37a', oscuro:'#032030', medio:'#096888', bolaClara:'#eaffff', bolaOscura:'#187a9b', acierto:'#7af0be', tinta:'#052029', fuente:'moderna' }),
  temaPremium('inferno-vault', 'Inferno Vault', 'inferno-vault', { acento:'#ff7929', marco:'#f09a49', oscuro:'#170603', medio:'#64210c', bolaClara:'#ffe49b', bolaOscura:'#c33d12', acierto:'#ffd56a', tinta:'#260b01' }),
  temaPremium('galactic-horizon', 'Galactic Horizon', 'galactic-horizon', { acento:'#a878ff', marco:'#91b5ff', oscuro:'#07071c', medio:'#272369', bolaClara:'#eee7ff', bolaOscura:'#6248cc', acierto:'#68f3d2', fuente:'futurista' }),
  temaPremium('emerald-jungle', 'Emerald Jungle', 'emerald-jungle', { acento:'#65c96f', marco:'#c6a45e', oscuro:'#04150b', medio:'#15502b', bolaClara:'#eaffb5', bolaOscura:'#297b35', acierto:'#7ff0b5', tinta:'#08210d' }),
  temaPremium('lost-atlantis', 'Lost Atlantis', 'lost-atlantis', { acento:'#69e4e2', marco:'#bcefe6', oscuro:'#03202a', medio:'#146a75', bolaClara:'#efffff', bolaOscura:'#279ba7', acierto:'#8fffb6', tinta:'#032025', fuente:'romantica' }),
  temaPremium('pharaohs-chamber', 'Pharaoh’s Chamber', 'pharaohs-chamber', { acento:'#ddb24d', marco:'#4e8fd7', oscuro:'#071124', medio:'#173d72', bolaClara:'#fff1a7', bolaOscura:'#9a691a', acierto:'#72e5ba', tinta:'#211704' }),
  temaPremium('cyberpunk-district', 'Cyberpunk District', 'cyberpunk-district', { acento:'#ff4bd8', marco:'#45e4ff', oscuro:'#070615', medio:'#271b59', bolaClara:'#c6fbff', bolaOscura:'#179ab9', acierto:'#59ffd2', fuente:'futurista' }),
  temaPremium('dragon-temple', 'Dragon Temple', 'dragon-temple', { acento:'#d99a42', marco:'#e5bf6c', oscuro:'#190609', medio:'#67151e', bolaClara:'#fff0a6', bolaOscura:'#a65516', acierto:'#74e7a5', tinta:'#211704' }),
  temaPremium('pirate-treasure-vault', 'Pirate Treasure Vault', 'pirate-treasure-vault', { acento:'#d29a48', marco:'#49b8b0', oscuro:'#041719', medio:'#125052', bolaClara:'#ffe9a5', bolaOscura:'#925d1b', acierto:'#69e6b7', tinta:'#211704' }),
  temaPremium('cloud-kingdom', 'Cloud Kingdom', 'cloud-kingdom', { acento:'#e2bd63', marco:'#d7f2ff', oscuro:'#1c334d', medio:'#739eb6', bolaClara:'#ffffff', bolaOscura:'#a47b25', acierto:'#8bf1d5', tinta:'#211704', fuente:'romantica' }),
  temaPremium('enchanted-forest', 'Enchanted Forest', 'enchanted-forest', { acento:'#8d7cff', marco:'#70d89d', oscuro:'#06140e', medio:'#253b63', bolaClara:'#eee9ff', bolaOscura:'#5941bd', acierto:'#74f0b4', fuente:'romantica' }),
  temaPremium('steampunk-foundry', 'Steampunk Foundry', 'steampunk-foundry', { acento:'#c87c3a', marco:'#dfa15f', oscuro:'#150d08', medio:'#57311b', bolaClara:'#ffe1a1', bolaOscura:'#854316', acierto:'#9bdc8b', tinta:'#211204' }),
  temaPremium('moonlit-castle', 'Moonlit Castle', 'moonlit-castle', { acento:'#8eaee8', marco:'#d0d9ed', oscuro:'#061126', medio:'#213e67', bolaClara:'#f4f7ff', bolaOscura:'#526fa9', acierto:'#75e4cc', fuente:'romantica' }),
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
