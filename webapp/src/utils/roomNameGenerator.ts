/**
 * Room name generator that creates three-word combinations
 * Format: [ADJECTIVE] [MODIFIER] [NOUN]
 * Examples: "healthy night diner", "ecstatic underground park", "vintage upstyle cinema"
 */

const ADJECTIVES = [
  'healthy',
  'ecstatic',
  'vintage',
  'cosmic',
  'electric',
  'velvet',
  'golden',
  'mystic',
  'neon',
  'silver',
  'radiant',
  'dreamy',
  'vibrant',
  'ethereal',
  'funky',
  'groovy',
  'stellar',
  'sonic',
  'azure',
  'crimson',
  'peaceful',
  'wild',
  'ambient',
  'blazing',
];

const MODIFIERS = [
  'night',
  'underground',
  'upstyle',
  'morning',
  'sunset',
  'midnight',
  'downtown',
  'rooftop',
  'riverside',
  'ocean',
  'mountain',
  'desert',
  'forest',
  'urban',
  'cosmic',
  'retro',
  'future',
  'crystal',
  'twilight',
  'starlight',
  'moonlight',
  'skyline',
  'horizon',
  'galaxy',
];

const NOUNS = [
  'diner',
  'park',
  'cinema',
  'lounge',
  'studio',
  'theater',
  'cafe',
  'gallery',
  'stage',
  'club',
  'hall',
  'sanctuary',
  'palace',
  'arcade',
  'garden',
  'plaza',
  'bazaar',
  'workshop',
  'observatory',
  'pavilion',
];

/**
 * Generates a random room name with three words
 * Total combinations: 24 × 24 × 20 = 11,520 unique names
 */
export function generateRoomName(): string {
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const modifier = MODIFIERS[Math.floor(Math.random() * MODIFIERS.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];

  return `${adjective}-${modifier}-${noun}`;
}
