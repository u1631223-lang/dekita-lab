import { ControlledRandomizer } from '@core/adaptive';
import { DifficultyLevel } from '@core/engine';
import { RhythmDifficultyMap, RhythmStimulus } from './types';

export const RHYTHM_LIBRARY: RhythmStimulus[] = [
  { id: 'clap', glyph: '👏', audio: '/assets/sfx/clap.mp3', category: 'basic' },
  { id: 'drum', glyph: '🥁', audio: '/assets/sfx/drum.mp3', category: 'basic' },
  { id: 'triangle', glyph: '🔺', audio: '/assets/sfx/triangle.mp3', category: 'shapes' },
  { id: 'square', glyph: '🟥', audio: '/assets/sfx/square.mp3', category: 'shapes' },
  { id: 'circle', glyph: '🟡', audio: '/assets/sfx/circle.mp3', category: 'shapes' },
  { id: 'ichi', glyph: '１', audio: '/assets/sfx/one.mp3', category: 'numbers' },
  { id: 'ni', glyph: '２', audio: '/assets/sfx/two.mp3', category: 'numbers' },
  { id: 'a', glyph: 'あ', audio: '/assets/sfx/a.mp3', category: 'hiragana' },
  { id: 'i', glyph: 'い', audio: '/assets/sfx/i.mp3', category: 'hiragana' },
  { id: 'u', glyph: 'う', audio: '/assets/sfx/u.mp3', category: 'hiragana' }
];

export const RHYTHM_DIFFICULTY: RhythmDifficultyMap = {
  lv1: {
    patternLength: [3, 4],
    tempoMs: 720,
    playbackDelayMs: 600,
    categories: { basic: 2, shapes: 1 }
  },
  lv2: {
    patternLength: [4, 5],
    tempoMs: 620,
    playbackDelayMs: 520,
    categories: { basic: 2, shapes: 2, numbers: 1 }
  },
  lv3: {
    patternLength: [5, 6],
    tempoMs: 540,
    playbackDelayMs: 480,
    categories: { shapes: 2, numbers: 2, hiragana: 1 }
  },
  lv4: {
    patternLength: [6, 7],
    tempoMs: 480,
    playbackDelayMs: 400,
    categories: { shapes: 2, numbers: 2, hiragana: 2 }
  },
  lv5: {
    patternLength: [6, 7],
    tempoMs: 480,
    playbackDelayMs: 400,
    categories: { shapes: 2, numbers: 2, hiragana: 2 }
  },
  lv6: {
    patternLength: [6, 7],
    tempoMs: 480,
    playbackDelayMs: 400,
    categories: { shapes: 2, numbers: 2, hiragana: 2 }
  }
};

const weightedSample = (
  randomizer: ControlledRandomizer,
  library: RhythmStimulus[],
  categories: RhythmDifficultyMap[DifficultyLevel]['categories']
) => {
  const weights = Object.entries(categories).map(([category, weight]) => ({
    value: category,
    weight: weight ?? 1
  }));
  const chosenCategory = randomizer.next(weights as { value: string; weight: number }[]);
  const options = library.filter((item) => item.category === chosenCategory);
  const pick = randomizer.next(options.map((item) => ({ value: item.id, weight: 1 })));
  return library.find((item) => item.id === pick) ?? library[0];
};

export const generatePattern = (
  difficulty: DifficultyLevel,
  randomizer: ControlledRandomizer
) => {
  const settings = RHYTHM_DIFFICULTY[difficulty] ?? RHYTHM_DIFFICULTY.lv1;
  const [min, max] = settings.patternLength;
  const lengthChoice = randomizer.next([
    { value: 'short', weight: 1 },
    { value: 'long', weight: 1 }
  ]);
  const length = lengthChoice === 'long' ? max : min;

  const pattern: RhythmStimulus[] = [];
  while (pattern.length < length) {
    pattern.push(weightedSample(randomizer, RHYTHM_LIBRARY, settings.categories));
  }
  return pattern;
};
