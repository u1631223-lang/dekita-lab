# ババ抜き（Old Maid）モジュール実装メモ

## 目的
- トランプ 52 枚 + ジョーカー 1 枚で進行する心理戦要素付きカードゲームを学習セッションへ追加し、「表情を読む」「手札管理」「駆け引き」の練習機会を提供する。
- 既存の `GameModule` 契約に従い、ラウンド制・難易度制御・報酬演出を統合する。

## 使用カード
- 13 ランク × 4 スート + Joker（`rank: 'JOKER'`）。
- UI 表示は `"A".."K"` の英字表記＋ suit 絵文字、Joker は 🃏。
- `OldMaidCard` 型
  ```ts
  type OldMaidCard = {
    id: string; // 例: "H-7", "JOKER"
    suit: '♠' | '♥' | '♦' | '♣' | 'JOKER';
    rank: 'A' | '2' | ... | 'K' | 'JOKER';
    isJoker: boolean;
  };
  ```

## 初期化フロー
1. `createDeck(randomizer)` でカードをフェアシャッフル。
2. `dealHands(deck, totalPlayers)` でプレイヤーへ均等配布（余り 1 枚は最後のプレイヤーへ）。
3. 各手札から同ランク 2 枚を `stripPairs(hand)` で除去し、`discardedPairs` カウンタへ加算。
4. ラウンド開始時に `OldMaidRoundState` を構築。
   ```ts
   type OldMaidRoundState = {
     players: OldMaidPlayerState[]; // テーブル順
     turnIndex: number;             // 現在ターン
     jokerHolderId: string | null;  // UI 強調用
     discardedPairs: number;
     config: OldMaidConfig;
   };
   ```

## プレイヤー定義
- `OldMaidPlayerState`
  ```ts
  type OldMaidPlayerState = {
    id: string;             // "player", "ai-1"…
    displayNameKey: string; // i18n キー
    isHuman: boolean;
    hand: OldMaidCard[];
    status: 'playing' | 'finished';
  };
  ```
- 敵 AI は 2〜3 名。ターン処理はラウンドステートとは別に UI コンポーネント側で進行させる。

## ターン進行ロジック
- `turnIndex` のプレイヤーが `nextIndex = findNextActive(players, turnIndex)` の手札から 1 枚引く。
- 引いたカードを自分の手札へ追加 → `stripPairs` で同ランクを即除去。
- 手札が 0 枚になったプレイヤーは `status: 'finished'` に設定し、以降スキップ。
- Joker を含む手札が自分のみになった時点でゲーム終了。`success` 判定は人間プレイヤーがババを回避できたかで決定。

## 難易度パラメータ
| Difficulty | AI 人数 | Joker ヒント | AI 選択アルゴリズム | 開始メモ |
|------------|---------|---------------|----------------------|----------|
| `lv1`      | 2 名    | Joker を保持している AI のカード束を 1.6 秒点滅 | 完全ランダム | 児童向け導入 |
| `lv2`      | 2 名    | 前 3 ターンのヒント履歴をもとに 1 回のみ強調 | Joker を避ける確率 60% | 中核難度 |
| `lv3`      | 3 名    | ヒントなし | Joker を避ける確率 80%、プレイヤーのペア情報を参照 | チャレンジ |

`OldMaidConfig` で `aiPlayers`, `maxHints`, `aiDelayMs`, `jokerAvoidance` を指定。`ControlledRandomizer` を渡して deck shuffle の再現性を担保し、AI の手札選択は UI 側の `Math.random` で十分（演出重視）。

## UI & 状態遷移
1. `waiting`: ターン開始アナウンス。AI の手札は裏面で扇形表示。
2. `selecting`: 人間ターン。左隣（`nextIndex`）のカードから 1 枚をクリックするとアニメーションで引き抜く。
3. `checking`: `stripPairs` の結果に応じて
   - ペア成立 → カードが星屑へ変化し `addStars` トリガーは `recordRound(true)` 時に実行。
   - Joker を受け取った場合はカードが赤く発光する。
4. `result`: 勝敗確定後に `recordRound` へ結果送信。`reactionTimeMs` はターン開始から勝敗判定までの経過時間を測定。`hintsUsed` はヒントボタン利用回数。

UI コンポーネント: `OldMaidScreen.tsx` + `OldMaidScreen.css`
- `useSessionController` から `roundState` を受け取り、`useState` でローカル進行。
- `useAudioCue` で `pair` / `joker` / `success` シグナルを再生。
- `useEffect` で AI ターンを `setTimeout` 実行。プレイヤー勝利時は勝利演出 → 次ラウンド遷移。

## テレメトリ & 報酬
- `recordRound` に渡す `RoundResult`:
  - `success`: プレイヤーが Joker を手放した時点で `true`。
  - `reactionTimeMs`: ラウンド開始から決着まで。
  - `hintsUsed`: ヒント利用数。
- 成功時 `useProgressStore.addStars` が呼ばれる（SessionProvider が自動加算）。ヒント未使用なら +1 ボーナスは既存ロジックに準拠。

## 翻訳キー
- `hub.oldMaid`（ハブ表示名）
- `oldMaid.goal`, `oldMaid.hint`, `oldMaid.jokerWarning`, `oldMaid.victory`, `oldMaid.defeat`, `oldMaid.turn`, `oldMaid.resultMessage`
- AI プレイヤーの名前: `oldMaid.ai.sunny`, `oldMaid.ai.moon`, `oldMaid.ai.comet`

## 実装ファイル構成
```
front/src/modules/old-maid/
├── module.ts              // GameModule 実装
├── types.ts               // 型定義
├── config.ts              // 難易度マップ & 初期化ロジック
├── logic.ts               // ペア判定・ユーティリティ
├── OldMaidScreen.tsx      // UI 本体
├── OldMaidScreen.css      // レイアウト & 演出
└── module.test.ts         // createRound の deterministic テスト
```

## 追加対応
- `GameId` 型へ `'old-maid'` を追加。
- `registerModules`, `AppRouter`, `SessionProvider` のベース難易度マップ更新。
- i18n リソースに翻訳キーを追加（日本語/英語）。
- `docs/tickets.md` にチケットを追加し、完了後 `DONE` へ更新。
