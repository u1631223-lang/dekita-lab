import { describe, expect, it } from 'vitest';

import { canPlayCard } from './config';
import type { Card } from './types';

const createCard = (value: number, color: Card['color']): Card => ({
  id: `${color}-${value}`,
  color,
  value
});

describe('canPlayCard', () => {
  it('allows play when pile is empty', () => {
    const card = createCard(5, 'red');
    expect(canPlayCard(card, null)).toBe(true);
  });

  it('allows same value regardless of suit', () => {
    const card = createCard(9, 'red');
    const pile = createCard(9, 'blue');
    expect(canPlayCard(card, pile)).toBe(true);
  });

  it('allows adjacent ranks including wrap between king and ace', () => {
    expect(canPlayCard(createCard(7, 'yellow'), createCard(6, 'green'))).toBe(true);
    expect(canPlayCard(createCard(1, 'green'), createCard(13, 'blue'))).toBe(true);
  });

  it('rejects non-adjacent ranks even if suit matches', () => {
    expect(canPlayCard(createCard(10, 'red'), createCard(3, 'red'))).toBe(false);
  });

  it('rejects non-adjacent ranks with different suits', () => {
    expect(canPlayCard(createCard(12, 'blue'), createCard(8, 'yellow'))).toBe(false);
  });
});
