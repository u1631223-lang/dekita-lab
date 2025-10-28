import { ControlledRandomizer } from '@core/adaptive';
import { DifficultyLevel } from '@core/engine';
import {
  ShapeBuilderConfig,
  ShapeBuilderDifficultyMap,
  ShapeBuilderRoundState,
  ShapeCell,
  ShapeToken,
  ShapeTokenId
} from './types';

const TOKENS: ShapeToken[] = [
  { id: 'triangle', label: '▲', gradient: 'linear-gradient(135deg, #f472b6 0%, #ec4899 100%)' },
  { id: 'square', label: '■', gradient: 'linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)' },
  { id: 'circle', label: '●', gradient: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)' },
  { id: 'star', label: '★', gradient: 'linear-gradient(135deg, #facc15 0%, #f97316 100%)' },
  { id: 'hex', label: '⬣', gradient: 'linear-gradient(135deg, #a855f7 0%, #8b5cf6 100%)' }
];

export const SHAPE_BUILDER_DIFFICULTY: ShapeBuilderDifficultyMap = {
  lv1: {
    columns: 2,
    rows: 2,
    palette: ['triangle', 'square', 'circle'],
    autoReveal: true
  },
  lv2: {
    columns: 3,
    rows: 2,
    palette: ['triangle', 'square', 'circle', 'star'],
    autoReveal: true
  },
  lv3: {
    columns: 3,
    rows: 3,
    palette: ['triangle', 'square', 'circle', 'star', 'hex'],
    autoReveal: false
  },
  lv4: {
    columns: 4,
    rows: 3,
    palette: ['triangle', 'square', 'circle', 'star', 'hex'],
    autoReveal: false
  },
  lv5: {
    columns: 4,
    rows: 3,
    palette: ['triangle', 'square', 'circle', 'star', 'hex'],
    autoReveal: false
  },
  lv6: {
    columns: 4,
    rows: 3,
    palette: ['triangle', 'square', 'circle', 'star', 'hex'],
    autoReveal: false
  }
};

const pickToken = (randomizer: ControlledRandomizer, palette: ShapeTokenId[]) => {
  const index = Math.floor(randomizer.nextFloat() * palette.length);
  return palette[index];
};

export const buildRoundState = (
  difficulty: DifficultyLevel,
  randomizer: ControlledRandomizer
): ShapeBuilderRoundState => {
  const config: ShapeBuilderConfig = SHAPE_BUILDER_DIFFICULTY[difficulty] ?? SHAPE_BUILDER_DIFFICULTY.lv1;
  const tokens = TOKENS.filter((token) => config.palette.includes(token.id));
  const totalCells = config.columns * config.rows;
  const cells: ShapeCell[] = [];
  for (let i = 0; i < totalCells; i += 1) {
    const target = pickToken(randomizer, config.palette);
    cells.push({ id: `cell-${i}`, target });
  }
  return {
    config,
    cells,
    available: tokens
  };
};
