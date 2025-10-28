import { ShichiNarabeDifficultyMap } from './types';

export const SHICHI_NARABE_DIFFICULTY: ShichiNarabeDifficultyMap = {
  lv1: { passLimit: 3, opponentCount: 1, hintDelayMs: 1500, autoHintOnStall: true },
  lv2: { passLimit: 3, opponentCount: 2, hintDelayMs: 1400, autoHintOnStall: true },
  lv3: { passLimit: 2, opponentCount: 2, hintDelayMs: 1300, autoHintOnStall: true },
  lv4: { passLimit: 2, opponentCount: 3, hintDelayMs: 1200, autoHintOnStall: false },
  lv5: { passLimit: 1, opponentCount: 3, hintDelayMs: 1100, autoHintOnStall: false },
  lv6: { passLimit: 1, opponentCount: 4, hintDelayMs: 1000, autoHintOnStall: false }
};
