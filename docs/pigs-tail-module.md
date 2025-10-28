# ぶたのしっぽ（Pig’s Tail）モジュール仕様

## 概要

「ぶたのしっぽ」は、運と反射神経と笑いを引き出す定番カードゲームです。52枚のトランプを使い、同じマークが連続した瞬間に全員が素早く手を出し、最も遅かったプレイヤーが場のカードを引き取ります。デジタル版でも反射のドタバタ感を再現し、テンポの良さとハプニングを楽しめる構成とします。

本ドキュメントでは物理ルールの整理とアプリ実装における仕様・UI・状態管理方針をまとめます。

## 使用カード

- ジョーカーを除いた 52 枚のトランプ。
- 推奨人数は 2〜6 人。アプリ版では 1 人 + AI 複数名を基本とし、将来的にオンライン/ローカル複数人へ拡張可能な構造とする。

## 準備

1. カードを十分にシャッフルし、山札（`deck`）を生成する。
2. 現実では円形に裏向きで並べるが、アプリではランダムな円状配置 or 単一山札で表現する。
3. 初期状態ではすべてのプレイヤーの手札は 0。引き取ったカードのみ `playerHands` に蓄積される。
4. ラウンドの先攻（`turnIndex`）をランダムに決定。

## 目的

最終的に所持カードが最も少ないこと。全カードをめくり切った時点、または AI を含む残り 1 名以外が脱落した時点で勝敗を判定する。

## ラウンド進行

1. `turnIndex` のプレイヤーが山札から 1 枚引き、中央の場 `pile` に表向きで重ねる。UI では Flip ボタンを使い、リアルタイム演出にはカードスライド＆反転アニメを利用する。
2. `pile` の最上段カードと 1 つ前のカードが同じマークになった場合、リアクションフェーズへ遷移する。
3. リアクションフェーズ中は `reactionPhase.active = true` とし、各プレイヤーのタップ時刻を `reactionTime` として記録する。AI は難易度に応じた反応遅延を持つ。

## 「ぶたのしっぽ！」の条件とペナルティ

- 条件: 最新カードと直前カードのマークが一致。
- リアクション計測: `reactionWindowMs` 内にタップしたプレイヤーのみ有効。手を出さなかった場合は最大遅延扱い。
- 最も遅いプレイヤー (`slowestPlayerId`) が `pile` をすべて引き取り、`playerHands[id]` に追加。`penalty` 履歴に記録し、サマリー画面で振り返れるようにする。
- リアクション前に誤ってタップした場合（ジョーカーなど禁止タイミング）は即座にペナルティを課す。

## 続行

ペナルティを受けたプレイヤーが次のターンの先攻となり、手番を時計回りで継続。山札が尽きるか、終了条件を満たすまで繰り返す。

## 勝敗判定

- 山札が空になった時点で `playerHands` のカード枚数を比較し、最少枚数のプレイヤーを勝者とする。
- 同枚数で複数人が並んだ場合は全員勝利（アプリでは「同時勝利」演出）。
- ラウンド終了時、`recordRound` に以下を渡す:
  - `success`: プレイヤーが最小枚数かどうか。
  - `reactionTimeMs`: 直近の成功リアクションタイム中央値。
  - `penalties`: プレイヤーが引き取った山回数。
  - `endedAt`: 終了時刻。

## 補足ルール

| バリエーション | 内容 |
| --- | --- |
| ジョーカー禁止 | リアクション禁止の合図。誤タップしたプレイヤーがペナルティ。`reactionPhase.blocked = true` で表現。 |
| 色一致版 | 幼児向け。マーク一致だけでなく赤/黒一致でもリアクションを発生させる。難易度テーブルで切り替え。 |
| 数字一致版 | 上級者向け。同ランク一致でもリアクションを発生。複合条件は `matchCriteria` の配列で設定。 |
| タイムアタック | 制限時間内に山札を消費できるか競う。`roundTimerMs` を設定し、残タイムに応じて評価。 |

## 状態モデル

```ts
export interface PigsTailRoundState {
  deck: PlayingCard[];
  pile: PlayingCard[];
  players: PigsTailPlayerState[];
  turnIndex: number;
  reactionPhase: {
    active: boolean;
    startedAt: number | null;
    deadlineMs: number;
    hasPenalty: boolean;
    blockedByJoker: boolean;
  };
  config: PigsTailConfig;
}
```

### 補助型

- `PlayingCard`: `{ id: string; suit: 'spade' | 'heart' | 'club' | 'diamond'; rank: 'A' | ... | 'K'; }`
- `PigsTailPlayerState`: `{ id: string; displayNameKey: string; isHuman: boolean; collected: PlayingCard[]; reactionHistory: number[]; penalties: number; }`
- `PigsTailConfig`（難易度別設定）
  - `aiPlayers`: AI 人数
  - `reactionWindowMs`: リアクション受付時間
  - `aiReactionRangeMs`: `[min, max]` で AI の反応速度帯域
  - `jokerPenaltyEnabled`: ジョーカールール適用フラグ
  - `matchCriteria`: `['suit']` / `['suit', 'color']` / `['suit', 'rank']` など
  - `bonusStarsThreshold`: 連続成功で星付与する回数

## ロジック概要

```ts
function onCardFlip(state: PigsTailRoundState, playerId: string) {
  const card = state.deck.shift();
  if (!card) return state;

  state.pile.push(card);
  const match = isReactionTrigger(state.pile, state.config.matchCriteria);

  if (match) {
    state.reactionPhase = {
      active: true,
      startedAt: Date.now(),
      deadlineMs: Date.now() + state.config.reactionWindowMs,
      hasPenalty: false,
      blockedByJoker: card.rank === 'Joker' && state.config.jokerPenaltyEnabled
    };
    scheduleAiReactions(state);
  } else {
    advanceTurn(state);
  }
}

function resolveReaction(state: PigsTailRoundState) {
  const slowest = getSlowestResponder(state.players);
  assignPileToPlayer(state, slowest);
  resetReactionPhase(state, slowest);
}
```

## UI コンポーネント指針

- **レイアウト**: 中央に `pile`、右下に Flip ボタン、周囲にプレイヤー枠（反応エフェクト付）。
- **リアクション演出**: リアクションフェーズ突入時に円形ハイライトとカウントダウンを表示。タップで `useAudioCue('tap')`。
- **アクセシビリティ**: 大きなタップ領域（最小 64px）、色識別にはアイコンとテキスト併用。
- **フィードバック**: ペナルティ時は `useProgressStore` で `addStars(-1)` ではなく、所持枚数差を HUD に表示してモチベーションを維持。

## 教育・心理的ポイント

- 反射神経・視覚認知・集中力を同時に鍛える。
- 適度なハプニングで笑いが起き、セルフエフィカシーを下げすぎない。
- ペナルティ後のフォロー（励ましメッセージや軽いチュートリアル）を入れて、失敗を前向きに捉えられる演出を用意。

## 今後の拡張メモ

- 難易度別に AI 人数・反応速度・マッチ条件を調整し、学齢に合わせたモードを提供。
- マルチタップ対応デバイスでの協力/対戦プレイ、オンライン同期への発展。
- 成功時のスター演出、連続ノーミスでのごほうびムービー等、報酬設計を強化。
- ゲーム内チュートリアル（アニメーション付き）で「同じマーク」「禁止カード」などを説明。
