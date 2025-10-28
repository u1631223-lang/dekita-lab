import { ControlledRandomizer } from '@core/adaptive';
import { DifficultyLevel } from '@core/engine';
import { PairCard, PairMatchConfig, PairMatchDifficultyMap } from './types';

const CARD_LIBRARY: Omit<PairCard, 'id' | 'pairId' | 'revealed' | 'matched'>[] = [
  { glyph: '🍎', audio: '/assets/sfx/apple.mp3', category: 'fruits' },
  { glyph: '🍌', audio: '/assets/sfx/banana.mp3', category: 'fruits' },
  { glyph: '🍓', audio: '/assets/sfx/strawberry.mp3', category: 'fruits' },
  { glyph: '🐶', audio: '/assets/sfx/dog.mp3', category: 'animals' },
  { glyph: '🐱', audio: '/assets/sfx/cat.mp3', category: 'animals' },
  { glyph: '🐰', audio: '/assets/sfx/rabbit.mp3', category: 'animals' },
  { glyph: 'あ', audio: '/assets/sfx/a.mp3', category: 'hiragana' },
  { glyph: 'い', audio: '/assets/sfx/i.mp3', category: 'hiragana' },
  { glyph: 'う', audio: '/assets/sfx/u.mp3', category: 'hiragana' },
  { glyph: '１', audio: '/assets/sfx/one.mp3', category: 'numbers' },
  { glyph: '２', audio: '/assets/sfx/two.mp3', category: 'numbers' },
  { glyph: '３', audio: '/assets/sfx/three.mp3', category: 'numbers' }
];

export const PAIR_MATCH_DIFFICULTY: PairMatchDifficultyMap = {
  lv1: {
    columns: 2,
    rows: 2,
    maxMistakes: 3,
    revealMs: 2000,
    categories: { fruits: 1, animals: 1 }
  },
  lv2: {
    columns: 3,
    rows: 2,
    maxMistakes: 5,
    revealMs: 1600,
    categories: { fruits: 2, animals: 1 }
  },
  lv3: {
    columns: 4,
    rows: 3,
    maxMistakes: 6,
    revealMs: 1400,
    categories: { fruits: 2, animals: 2, numbers: 1 }
  },
  lv4: {
    columns: 4,
    rows: 4,
    maxMistakes: 7,
    revealMs: 1200,
    categories: { animals: 2, numbers: 2, hiragana: 1 }
  },
  lv5: {
    columns: 4,
    rows: 4,
    maxMistakes: 7,
    revealMs: 1200,
    categories: { animals: 2, numbers: 2, hiragana: 1 }
  },
  lv6: {
    columns: 4,
    rows: 4,
    maxMistakes: 7,
    revealMs: 1200,
    categories: { animals: 2, numbers: 2, hiragana: 1 }
  }
};

const pickSymbols = (
  randomizer: ControlledRandomizer,
  categories: PairMatchConfig['categories'],
  totalPairs: number
) => {
  const chosen: Omit<PairCard, 'id' | 'pairId' | 'revealed' | 'matched'>[] = [];
  while (chosen.length < totalPairs) {
    const weights = Object.entries(categories).map(([category, weight]) => ({
      value: category,
      weight: weight ?? 1
    }));
    const category = randomizer.next(weights as { value: string; weight: number }[]);
    const options = CARD_LIBRARY.filter((card) => card.category === category);
    const selected = randomizer.next(options.map((card) => ({ value: card.glyph, weight: 1 }))) as string;
    const card = options.find((item) => item.glyph === selected);
    if (!card || chosen.some((existing) => existing.glyph === card.glyph)) {
      continue;
    }
    chosen.push(card);
  }
  return chosen;
};

export const createDeck = (difficulty: DifficultyLevel, randomizer: ControlledRandomizer) => {
  const config = PAIR_MATCH_DIFFICULTY[difficulty] ?? PAIR_MATCH_DIFFICULTY.lv1;
  const totalCards = config.columns * config.rows;
  const totalPairs = totalCards / 2;
  const picked = pickSymbols(randomizer, config.categories, totalPairs);
  const deck: PairCard[] = [];

  picked.forEach((symbol, index) => {
    const pairId = `${symbol.glyph}-${index}`;
    deck.push(
      {
        id: `${pairId}-a`,
        glyph: symbol.glyph,
        audio: symbol.audio,
        pairId,
        revealed: false,
        matched: false,
        category: symbol.category
      },
      {
        id: `${pairId}-b`,
        glyph: symbol.glyph,
        audio: symbol.audio,
        pairId,
        revealed: false,
        matched: false,
        category: symbol.category
      }
    );
  });

  const buffer = [...deck];
  for (let i = buffer.length - 1; i > 0; i -= 1) {
    const j = Math.floor(randomizer.nextFloat() * (i + 1));
    [buffer[i], buffer[j]] = [buffer[j], buffer[i]];
  }

  return { deck: buffer, config };
};
