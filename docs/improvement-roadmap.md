# 改善ロードマップ - Dekita Lab を次のレベルへ

## 🎯 このドキュメントの目的

`project-review.md` で指摘された課題を踏まえ、プロジェクトを「設計の見本」から「動く証拠」へ変換するための具体的な改善計画を示します。

**レビュアー (Claude) としての改善提案**

---

## 📋 改善の全体戦略

### コアコンセプト: **3V アプローチ**

1. **Verify (検証)**: 既存の主張を実証する
2. **Validate (妥当性確認)**: ユーザーでテストする
3. **Vitalize (活性化)**: 実装を完成させる

### 優先順位の原則

```
P0 (緊急・重要) > P1 (重要) > P2 (望ましい) > P3 (将来)
```

---

## 🚀 フェーズ1: 現実チェック (1-2週間)

**目標**: ドキュメントの主張を実装で裏付ける

### P0-1: 実装状況の全数調査

**現状の問題**:
- tickets.md で DONE とマークされているが、実装が不完全な項目が存在

**改善アクション**:

```bash
# 各チケットに対して以下を実行
1. 該当コードの実装を確認
2. 単体テストの存在を確認
3. 動作確認の実施
4. 結果を記録
```

**成果物**:
- `docs/implementation-status.md` (実装状況マトリックス)
- 各チケットのステータス更新

**受け入れ基準**:
- すべてのDONEチケットが実装済みであることを確認
- または、未完成の場合は IN PROGRESS / TODO に戻す

---

### P0-2: ミニゲームの実装完成

**現状の問題**:
- Sequence Spark の `evaluate` が単なるパススルー
- Shape Builder の実装詳細が不明

**改善アクション**:

#### Sequence Spark の完成

```typescript
// front/src/modules/sequence-spark/module.ts
export const createSequenceSparkModule = (): GameModule<SequenceSparkRoundState, RoundResult> => ({
  id: 'sequence-spark',
  titleKey: 'hub.sequence',
  icon: '✨',
  baseDifficulty: 'lv1',
  createRound: ({ difficulty, randomizer }) => generateSequence(difficulty, randomizer),

  // TODO: 実際の評価ロジックを実装
  evaluate: ({ input, roundState }) => {
    // 1. プレイヤーの入力シーケンスと正解シーケンスを比較
    // 2. 一致率を計算
    // 3. 反応時間を測定
    // 4. 成功/失敗を判定
    const { playerSequence, correctSequence } = input;
    const accuracy = calculateAccuracy(playerSequence, correctSequence);
    const reactionTime = calculateReactionTime(input.timestamps);

    return {
      success: accuracy >= 0.8,
      score: accuracy * 100,
      reactionTimeMs: reactionTime,
      metadata: { accuracy }
    };
  }
});
```

#### Shape Builder の完成

```typescript
// 同様に実装を完成させる
evaluate: ({ input, roundState }) => {
  const { placedShapes, targetSilhouette } = input;
  const matchScore = calculateShapeMatch(placedShapes, targetSilhouette);

  return {
    success: matchScore >= 0.9,
    score: matchScore * 100,
    reactionTimeMs: input.completionTime,
    metadata: { matchScore }
  };
}
```

**成果物**:
- 完全に動作する4つのミニゲーム
- 各ゲームの評価ロジックの単体テスト

**受け入れ基準**:
- すべてのゲームが開始から完了まで動作する
- evaluate ロジックが適切にスコアを返す
- テストカバレッジ > 80%

---

### P0-3: パフォーマンス実測

**現状の問題**:
- 「0.5秒以内の報酬フィードバック」という主張の実測データなし

**改善アクション**:

```typescript
// front/src/core/rewards/performanceMonitor.ts (新規作成)
export class PerformanceMonitor {
  private measurements: Map<string, number[]> = new Map();

  startMeasure(label: string) {
    performance.mark(`${label}-start`);
  }

  endMeasure(label: string) {
    performance.mark(`${label}-end`);
    performance.measure(label, `${label}-start`, `${label}-end`);

    const measure = performance.getEntriesByName(label)[0];
    this.recordMeasurement(label, measure.duration);
  }

  getStats(label: string) {
    const values = this.measurements.get(label) || [];
    return {
      avg: average(values),
      p50: percentile(values, 50),
      p95: percentile(values, 95),
      p99: percentile(values, 99)
    };
  }
}

// 使用例
const perfMonitor = new PerformanceMonitor();

function triggerReward(type: RewardType) {
  perfMonitor.startMeasure('reward-feedback');

  // 音声再生
  playSoundEffect(type);
  // アニメーション開始
  showAnimation(type);
  // ボイス再生
  playVoice(type);

  perfMonitor.endMeasure('reward-feedback');
}

// セッション終了時に統計を出力
console.log(perfMonitor.getStats('reward-feedback'));
// { avg: 234, p50: 220, p95: 450, p99: 580 }
```

**測定項目**:
1. 報酬フィードバック時間 (目標: < 500ms)
2. 初回アセット読込時間 (目標: < 3秒)
3. Canvas描画 fps (目標: > 30fps)
4. ラウンド遷移時間 (目標: < 200ms)

**成果物**:
- `docs/performance-metrics.md` (実測値の記録)
- パフォーマンスモニタリングクラス

**受け入れ基準**:
- 主要な主張に対する実測データが揃っている
- 目標値を達成しているか、達成していない場合は改善計画がある

---

### P0-4: テストカバレッジの向上

**現状の問題**:
- カバレッジ約12% (7テスト / 57ファイル)

**改善アクション**:

#### 目標設定
```
短期目標: 30% (コアロジックのみ)
中期目標: 50% (コア + 主要UI)
長期目標: 70% (全体)
```

#### 優先テスト対象

**Phase 1.1: コアロジック (1週間)**
```
✅ SessionMachine      (完了)
✅ AdaptiveEngine      (完了)
✅ RewardScheduler     (完了)
✅ MetricsStore        (完了)
❌ ProgressStore       (未実装) → 追加
❌ RandomSeedManager   (未実装) → 追加
```

**Phase 1.2: ゲームモジュール (1週間)**
```
✅ rhythm-tap/module   (完了)
✅ pair-match/module   (完了)
❌ sequence-spark/module (未実装) → 追加
❌ shape-builder/module  (未実装) → 追加
```

**Phase 1.3: UI コンポーネント (1週間)**
```
❌ GameHub            (未実装) → 追加
❌ CaregiverGateModal (未実装) → 追加
❌ GameHud            (未実装) → 追加
❌ RewardToast        (未実装) → 追加
```

**実装例**:

```typescript
// front/src/core/state/progressStore.test.ts (新規)
import { describe, it, expect, beforeEach } from 'vitest';
import { useProgressStore } from './progressStore';

describe('ProgressStore', () => {
  beforeEach(() => {
    useProgressStore.getState().resetProgress();
  });

  it('should track streak correctly', () => {
    const store = useProgressStore.getState();

    store.recordRound({ success: true });
    expect(store.currentStreak).toBe(1);

    store.recordRound({ success: true });
    expect(store.currentStreak).toBe(2);

    store.recordRound({ success: false });
    expect(store.currentStreak).toBe(0);
  });

  it('should calculate success rate correctly', () => {
    const store = useProgressStore.getState();

    store.recordRound({ success: true });
    store.recordRound({ success: true });
    store.recordRound({ success: false });

    expect(store.successRate).toBeCloseTo(0.666, 2);
  });
});
```

**成果物**:
- 各優先モジュールの単体テスト
- `vitest.config.ts` にカバレッジ設定を追加
- CI での自動テスト実行

**受け入れ基準**:
- テストカバレッジ > 30%
- すべてのテストがパスする
- CI が緑

---

## 🧪 フェーズ2: ユーザビリティ検証 (2-3週間)

**目標**: 実際のユーザーでテストし、仮説を検証する

### P1-1: プレイアブルデモの準備

**改善アクション**:

#### デモ環境の構築
```bash
# 本番ビルドの作成
pnpm --filter front build

# プレビュー環境の起動
pnpm --filter front preview

# または Vercel などにデプロイ
vercel deploy
```

#### チェックリスト
- [ ] すべてのゲームが開始できる
- [ ] 保護者ゲートが機能する
- [ ] オンボーディングが表示される
- [ ] 報酬演出が発火する
- [ ] セッション統計が表示される
- [ ] PWA としてインストールできる

**成果物**:
- デプロイ済みのデモURL
- デモ操作マニュアル

---

### P1-2: ユーザビリティテストの実施

**現状の問題**:
- 4-7歳の子どもによる実機テストが未実施

**改善アクション**:

#### テスト設計

**参加者**: 5-10名の子ども (4-7歳) + 保護者

**テストシナリオ**:
1. 初回起動とオンボーディング (保護者操作)
2. ゲームハブからゲーム選択 (子ども操作)
3. Rhythm Tap を3ラウンドプレイ
4. Pair Match を3ラウンドプレイ
5. 保護者ダッシュボードの確認

**測定項目**:
- タスク完了率
- 操作に迷った回数
- サポートを求めた回数
- プレイ時間
- 成功率
- 主観的満足度 (子ども・保護者別)

**データ収集フォーム**:

```markdown
## ユーザビリティテスト記録

### 参加者情報
- ID: UT-001
- 年齢: 5歳
- 性別: 女性
- デバイス: iPad (第9世代)

### 観察記録
| タスク | 完了 | 時間 | 迷った回数 | メモ |
|--------|------|------|-----------|------|
| オンボーディング | ✅ | 2分 | 0 | 保護者がスムーズに設定完了 |
| ゲーム選択 | ✅ | 30秒 | 1 | リズムゲームのアイコンを最初に選択 |
| Rhythm Tap | ✅ | 5分 | 2 | Lv1は簡単すぎた。Lv2で楽しそう |
| Pair Match | ✅ | 6分 | 0 | 集中してプレイ。笑顔が多い |
| 再プレイ意欲 | ✅ | - | - | 「もう一回やりたい!」と発言 |

### 成功率データ
- Rhythm Tap Lv1: 100% (6/6)
- Rhythm Tap Lv2: 80% (4/5)
- Pair Match Lv1: 100% (3/3)
- Pair Match Lv2: 75% (3/4)

### 発話記録
- 「これ楽しい!」(Rhythm Tap Lv2 クリア時)
- 「星が出た!」(報酬演出時)
- 「もっとやりたい」(セッション終了時)

### 保護者フィードバック
- 「難易度が自動で調整されるのが良い」
- 「進捗が見えるのが安心」
- 「音量調整できるのが助かる」
- 「もう少しバリエーションが欲しい」

### 問題点
1. Lv1 が簡単すぎる (即 Lv2 に上げるべき?)
2. 報酬演出が単調 (3回目で飽きた様子)
3. ゲームハブの説明文が読めない (ひらがな対応?)
```

**成果物**:
- `docs/usability-test-results.md` (テスト結果まとめ)
- ビデオ記録 (任意、同意取得が必要)
- 改善すべき点のリスト

**受け入れ基準**:
- 最低5名の子どもでテスト実施
- 主要な問題点を特定
- 改善の優先順位をつける

---

### P1-3: 成功率70-85%の検証

**現状の問題**:
- 「成功率70-85%を維持」という主張の実証データなし

**改善アクション**:

#### データ収集スクリプト

```typescript
// front/src/core/telemetry/successRateAnalyzer.ts (新規)
export class SuccessRateAnalyzer {
  analyzeSession(sessionData: SessionData) {
    const rates = sessionData.rounds.map((round, i) => {
      // 直近5ラウンドの成功率
      const recentRounds = sessionData.rounds.slice(Math.max(0, i - 4), i + 1);
      const successCount = recentRounds.filter(r => r.success).length;
      return successCount / recentRounds.length;
    });

    return {
      averageSuccessRate: average(rates),
      inTargetRange: rates.filter(r => r >= 0.7 && r <= 0.85).length / rates.length,
      timeline: rates.map((rate, i) => ({ round: i, rate }))
    };
  }

  generateReport(sessions: SessionData[]) {
    const analyses = sessions.map(s => this.analyzeSession(s));

    return {
      totalSessions: sessions.length,
      avgSuccessRate: average(analyses.map(a => a.averageSuccessRate)),
      timeInTargetRange: average(analyses.map(a => a.inTargetRange)),
      recommendation: this.generateRecommendation(analyses)
    };
  }

  private generateRecommendation(analyses: AnalysisResult[]) {
    const avgRate = average(analyses.map(a => a.averageSuccessRate));

    if (avgRate < 0.7) {
      return 'Difficulty is too high. Consider lowering baseline difficulty.';
    } else if (avgRate > 0.85) {
      return 'Difficulty is too low. Consider raising baseline difficulty.';
    } else {
      return 'Success rate is in target range. Continue monitoring.';
    }
  }
}
```

**分析項目**:
1. セッション全体の平均成功率
2. ターゲット範囲 (70-85%) に収まっている時間の割合
3. 難易度調整の頻度
4. 各難易度レベルの成功率分布

**成果物**:
- `docs/success-rate-analysis.md` (分析結果)
- グラフ (成功率の時系列推移)

**受け入れ基準**:
- 10セッション以上のデータを収集
- 平均成功率が70-85%に収まっているか確認
- 収まっていない場合、適応ロジックを調整

---

### P1-4: アセットの整備

**現状の問題**:
- 音声・アニメーションアセットの配置が不明

**改善アクション**:

#### ディレクトリ構造の作成

```bash
front/public/assets/
├── sfx/
│   ├── success-1.mp3
│   ├── success-2.mp3
│   ├── success-3.mp3
│   ├── special-1.mp3
│   ├── tap.mp3
│   ├── match.mp3
│   └── hint.mp3
├── animations/
│   ├── confetti.json (Lottie)
│   ├── star-burst.json
│   └── rainbow.json
├── voices/
│   ├── ja/
│   │   ├── great.mp3
│   │   ├── excellent.mp3
│   │   └── try-again.mp3
│   └── en/
│       ├── great.mp3
│       ├── excellent.mp3
│       └── try-again.mp3
└── manifest.json
```

#### アセットメタデータ

```typescript
// front/src/core/rewards/assetManifest.ts (新規)
export const REWARD_ASSETS = {
  sounds: {
    'success-basic': '/assets/sfx/success-1.mp3',
    'success-good': '/assets/sfx/success-2.mp3',
    'success-excellent': '/assets/sfx/success-3.mp3',
    'success-special': '/assets/sfx/special-1.mp3',
  },
  animations: {
    'confetti': '/assets/animations/confetti.json',
    'star-burst': '/assets/animations/star-burst.json',
    'rainbow': '/assets/animations/rainbow.json',
  },
  voices: {
    'great': (lang: string) => `/assets/voices/${lang}/great.mp3`,
    'excellent': (lang: string) => `/assets/voices/${lang}/excellent.mp3`,
    'try-again': (lang: string) => `/assets/voices/${lang}/try-again.mp3`,
  }
} as const;

// 使用例
import { Howl } from 'howler';

const successSound = new Howl({
  src: [REWARD_ASSETS.sounds['success-good']],
  volume: 0.7
});
```

#### アセット制作ガイドライン

```markdown
## 音声ファイル仕様
- フォーマット: MP3 (44.1kHz, 192kbps)
- 長さ: 0.5-2秒 (効果音), 1-3秒 (ボイス)
- 音量: ピークを -3dB に正規化

## アニメーション仕様
- フォーマット: Lottie JSON
- サイズ: 512x512px
- フレームレート: 30fps
- 長さ: 1-3秒
```

**成果物**:
- 整理されたアセットディレクトリ
- アセットマニフェスト
- 制作ガイドライン

**受け入れ基準**:
- すべての報酬演出で適切なアセットが再生される
- アセット読込が3秒以内に完了する

---

## 🔧 フェーズ3: 実装の完成 (3-4週間)

**目標**: 未実装機能を完成させ、品質を向上させる

### P1-5: 15分タイマーリマインドの実装

**現状の問題**:
- FR3 で必須とされているが、実装が不明

**改善アクション**:

```typescript
// front/src/app/session/SessionTimer.tsx (新規)
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const SESSION_DURATION_MS = 15 * 60 * 1000; // 15分
const WARNING_BEFORE_MS = 2 * 60 * 1000;    // 2分前に警告

export const SessionTimer = () => {
  const { t } = useTranslation();
  const [elapsedMs, setElapsedMs] = useState(0);
  const [showReminder, setShowReminder] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedMs(prev => prev + 1000);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (elapsedMs >= SESSION_DURATION_MS - WARNING_BEFORE_MS && !showReminder) {
      setShowReminder(true);
    }
  }, [elapsedMs, showReminder]);

  const remaining = Math.max(0, SESSION_DURATION_MS - elapsedMs);
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);

  return (
    <div className="session-timer">
      <div className="timer-display">
        {minutes}:{seconds.toString().padStart(2, '0')}
      </div>

      {showReminder && (
        <div className="break-reminder">
          <p>{t('session.breakReminder')}</p>
          <button onClick={() => setShowReminder(false)}>
            {t('session.continueButton')}
          </button>
          <button onClick={() => window.location.href = '/'}>
            {t('session.takeBreakButton')}
          </button>
        </div>
      )}
    </div>
  );
};
```

**i18n 翻訳追加**:

```json
// front/public/locales/ja/translation.json
{
  "session": {
    "breakReminder": "そろそろ おやすみの じかんだよ。つづける？",
    "continueButton": "もうすこし あそぶ",
    "takeBreakButton": "おやすみする"
  }
}
```

**成果物**:
- SessionTimer コンポーネント
- 統合テスト
- i18n 翻訳

**受け入れ基準**:
- 15分経過時にリマインドが表示される
- 子どもにやさしい言葉で表示される
- 継続/休憩の選択ができる

---

### P1-6: 保護者ダッシュボードの拡充

**現状の問題**:
- サマリーカードはあるが、詳細が不明

**改善アクション**:

```typescript
// front/src/app/CaregiverDashboard.tsx (新規または拡張)
export const CaregiverDashboard = () => {
  const { t } = useTranslation();
  const metrics = useMetricsStore(state => state.getAllMetrics());

  return (
    <div className="caregiver-dashboard">
      <h2>{t('dashboard.title')}</h2>

      {/* 成功率の推移グラフ */}
      <section>
        <h3>{t('dashboard.successRateTrend')}</h3>
        <LineChart
          data={metrics.successRateTimeline}
          targetRange={[0.7, 0.85]}
        />
      </section>

      {/* 反応時間の推移 */}
      <section>
        <h3>{t('dashboard.reactionTimeTrend')}</h3>
        <LineChart
          data={metrics.reactionTimeTimeline}
          showImprovement={true}
        />
      </section>

      {/* ゲーム別統計 */}
      <section>
        <h3>{t('dashboard.gameBreakdown')}</h3>
        {metrics.byGame.map(game => (
          <GameStatCard
            key={game.id}
            title={t(`hub.${game.id}`)}
            totalPlays={game.totalRounds}
            successRate={game.successRate}
            averageLevel={game.averageLevel}
          />
        ))}
      </section>

      {/* プレイ時間統計 */}
      <section>
        <h3>{t('dashboard.playTime')}</h3>
        <PlayTimeChart data={metrics.playTimeByDay} />
      </section>

      {/* 推奨事項 */}
      <section>
        <h3>{t('dashboard.recommendations')}</h3>
        <RecommendationList recommendations={generateRecommendations(metrics)} />
      </section>
    </div>
  );
};

function generateRecommendations(metrics: MetricsSummary): Recommendation[] {
  const recs: Recommendation[] = [];

  // 成功率が低すぎる
  if (metrics.overallSuccessRate < 0.6) {
    recs.push({
      type: 'warning',
      message: 'お子様が難しすぎると感じているかもしれません。基本レベルから始めることをお勧めします。'
    });
  }

  // プレイ時間が長い
  if (metrics.averageSessionDuration > 20 * 60 * 1000) {
    recs.push({
      type: 'info',
      message: 'プレイ時間が長めです。15分ごとに休憩を促すことをお勧めします。'
    });
  }

  // 特定のゲームに偏っている
  const gamePlays = metrics.byGame.map(g => g.totalRounds);
  const maxPlays = Math.max(...gamePlays);
  const minPlays = Math.min(...gamePlays);
  if (maxPlays > minPlays * 3) {
    recs.push({
      type: 'suggestion',
      message: '他のゲームも試してみると、バランスよく能力を伸ばせます。'
    });
  }

  return recs;
}
```

**成果物**:
- 拡充された保護者ダッシュボード
- グラフコンポーネント
- 推奨事項生成ロジック

**受け入れ基準**:
- 成功率、反応時間の推移が可視化される
- ゲーム別の統計が表示される
- 保護者向けの推奨事項が表示される

---

### P2-1: PWA機能の実証

**現状の問題**:
- vite-plugin-pwa の設定はあるが、動作確認記録なし

**改善アクション**:

#### PWA チェックリスト

```markdown
## PWA 動作確認

### Service Worker
- [ ] Service Worker が正常に登録される
- [ ] オフラインでアプリが起動する
- [ ] アセットがキャッシュされる
- [ ] バックグラウンド同期が動作する (将来)

### インストール
- [ ] iOS Safari から「ホーム画面に追加」できる
- [ ] Android Chrome から「ホーム画面に追加」できる
- [ ] デスクトップ Chrome からインストールできる
- [ ] インストール後、スタンドアロンで起動する

### オフライン動作
- [ ] ネットワーク切断後もゲームが動作する
- [ ] 進捗データがローカルに保存される
- [ ] 再接続時にデータが同期される (将来)

### パフォーマンス
- [ ] Lighthouse PWA スコア > 90
- [ ] ページ読込時間 < 3秒
- [ ] Time to Interactive < 5秒
```

#### 実装の改善

```typescript
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'assets/**/*'],
      manifest: {
        name: 'Dekita Lab',
        short_name: 'Dekita',
        description: '科学に基づいた幼児向け学習ゲーム',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,mp3,json}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          }
        ]
      }
    })
  ]
});
```

**成果物**:
- PWA動作確認レポート
- Lighthouse レポート
- インストール手順書

**受け入れ基準**:
- Lighthouse PWA スコア > 90
- 主要デバイスでインストール確認
- オフライン動作を確認

---

### P2-2: E2Eテストの実装

**現状の問題**:
- Playwright 設定はあるが、テストシナリオが未実装

**改善アクション**:

```typescript
// front/e2e/game-flow.spec.ts (新規)
import { test, expect } from '@playwright/test';

test.describe('Game Flow', () => {
  test('should complete full game session', async ({ page }) => {
    // 1. アプリ起動
    await page.goto('http://localhost:5173');

    // 2. オンボーディング (初回のみ)
    const hasOnboarding = await page.locator('[data-testid="onboarding-modal"]').isVisible();
    if (hasOnboarding) {
      await page.locator('[data-testid="reward-volume-slider"]').fill('50');
      await page.locator('[data-testid="onboarding-complete"]').click();
    }

    // 3. ゲームハブが表示される
    await expect(page.locator('[data-testid="game-hub"]')).toBeVisible();

    // 4. Rhythm Tap を選択
    await page.locator('[data-testid="game-card-rhythm-tap"]').click();

    // 5. ゲームが開始される
    await expect(page.locator('[data-testid="rhythm-tap-screen"]')).toBeVisible();

    // 6. パターンが表示される
    await expect(page.locator('[data-testid="rhythm-pattern"]')).toBeVisible();

    // 7. タップボタンをクリック (自動プレイ)
    const tapButton = page.locator('[data-testid="tap-button"]');
    await tapButton.click();
    await tapButton.click();
    await tapButton.click();

    // 8. 報酬演出が表示される
    await expect(page.locator('[data-testid="reward-toast"]')).toBeVisible();

    // 9. 次のラウンドに進む
    await page.waitForTimeout(2000);
    await expect(page.locator('[data-testid="rhythm-pattern"]')).toBeVisible();

    // 10. ゲームを終了
    await page.locator('[data-testid="end-game-button"]').click();

    // 11. サマリー画面が表示される
    await expect(page.locator('[data-testid="summary-screen"]')).toBeVisible();

    // 12. ハブに戻る
    await page.locator('[data-testid="return-to-hub"]').click();
    await expect(page.locator('[data-testid="game-hub"]')).toBeVisible();
  });

  test('should show caregiver dashboard', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // 保護者ゲートを開く
    await page.locator('[data-testid="open-caregiver-gate"]').click();

    // 認証 (簡単な計算)
    const question = await page.locator('[data-testid="gate-question"]').textContent();
    const answer = evaluateMathQuestion(question); // Helper function
    await page.locator('[data-testid="gate-answer-input"]').fill(answer.toString());
    await page.locator('[data-testid="gate-submit"]').click();

    // ダッシュボードが表示される
    await expect(page.locator('[data-testid="caregiver-dashboard"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-rate-chart"]')).toBeVisible();
  });
});

function evaluateMathQuestion(question: string): number {
  // "3 + 5 = ?" のような質問を解析
  const match = question.match(/(\d+)\s*\+\s*(\d+)/);
  if (match) {
    return parseInt(match[1]) + parseInt(match[2]);
  }
  return 0;
}
```

**成果物**:
- E2E テストスイート
- CI での自動実行設定

**受け入れ基準**:
- 主要なユーザーフローがテストされている
- すべてのテストがパスする
- CI で自動実行される

---

### P2-3: コード品質の向上

**改善アクション**:

#### ESLint / Prettier の厳格化

```json
// .eslintrc.json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "prettier"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "react/prop-types": "off",
    "react-hooks/exhaustive-deps": "error"
  }
}
```

#### 型安全性の向上

```typescript
// front/src/core/engine/types.ts
// Before: any を使用
export interface GameModule {
  evaluate: (input: any) => RoundResult;
}

// After: 厳密な型定義
export interface GameModule<TRoundState = unknown, TInput = unknown> {
  evaluate: (input: TInput, roundState: TRoundState) => RoundResult;
}
```

#### 依存関係の整理

```bash
# 未使用の依存を検出
npx depcheck

# 結果例
Unused dependencies
* @tanstack/react-query

# 削除
pnpm remove @tanstack/react-query
```

**成果物**:
- Lint エラー 0
- 型エラー 0
- 不要な依存削除

---

## 📈 フェーズ4: 最適化と洗練 (2-3週間)

**目標**: パフォーマンスとUXを最適化する

### P2-4: パフォーマンス最適化

**改善アクション**:

#### Canvas 描画の最適化

```typescript
// Before: 毎フレームすべてを再描画
function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();
  drawAllGameObjects();
  requestAnimationFrame(render);
}

// After: Dirty rectangle で必要な部分のみ再描画
class CanvasRenderer {
  private dirtyRects: DOMRect[] = [];

  markDirty(rect: DOMRect) {
    this.dirtyRects.push(rect);
  }

  render() {
    if (this.dirtyRects.length === 0) return;

    // 変更された領域のみクリア&再描画
    this.dirtyRects.forEach(rect => {
      ctx.clearRect(rect.x, rect.y, rect.width, rect.height);
      this.drawInRect(rect);
    });

    this.dirtyRects = [];
    requestAnimationFrame(() => this.render());
  }
}
```

#### 音声プリロードの最適化

```typescript
// front/src/core/rewards/audioPreloader.ts (新規)
export class AudioPreloader {
  private preloadedSounds = new Map<string, Howl>();

  async preloadAll(manifest: typeof REWARD_ASSETS.sounds) {
    const promises = Object.entries(manifest).map(([key, src]) =>
      this.preload(key, src)
    );

    await Promise.all(promises);
  }

  private async preload(key: string, src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const sound = new Howl({
        src: [src],
        preload: true,
        onload: () => {
          this.preloadedSounds.set(key, sound);
          resolve();
        },
        onloaderror: (id, error) => reject(error)
      });
    });
  }

  play(key: string, volume = 1.0) {
    const sound = this.preloadedSounds.get(key);
    if (sound) {
      sound.volume(volume);
      sound.play();
    }
  }
}

// アプリ起動時にプリロード
const audioPreloader = new AudioPreloader();
audioPreloader.preloadAll(REWARD_ASSETS.sounds);
```

#### バンドルサイズの最適化

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'ui': ['zustand', 'react-i18next'],
          'audio': ['howler'],
        }
      }
    }
  }
});
```

**測定結果の目標**:
- 初回読込: < 3秒 (3G接続)
- バンドルサイズ: < 500KB (gzip)
- Canvas fps: > 30fps (低スペックタブレット)
- 報酬フィードバック: < 300ms (目標を 500ms → 300ms に引き上げ)

---

### P2-5: UX の洗練

**改善アクション**:

#### マイクロインタラクションの追加

```typescript
// ボタンタップ時の触覚フィードバック
function handleTap() {
  // 視覚フィードバック
  button.classList.add('tap-animation');
  setTimeout(() => button.classList.remove('tap-animation'), 300);

  // 触覚フィードバック (サポートされている場合)
  if ('vibrate' in navigator) {
    navigator.vibrate(10);
  }

  // 音声フィードバック
  playSound('tap');
}
```

#### ローディング状態の改善

```typescript
// Before: 無反応な読込画面
<div>Loading...</div>

// After: 楽しいローディングアニメーション
<LoadingScreen>
  <Lottie animation="loading-character" />
  <ProgressBar value={loadProgress} />
  <Message>ゲームを じゅんびちゅう...</Message>
</LoadingScreen>
```

#### エラーハンドリングの改善

```typescript
// 子どもにやさしいエラーメッセージ
function showError(error: Error) {
  const childFriendlyMessage = getChildFriendlyMessage(error);

  showModal({
    icon: '😅',
    title: 'ちょっと まってね',
    message: childFriendlyMessage,
    actions: [
      { label: 'もういちど', onClick: retry },
      { label: 'もどる', onClick: goBack }
    ]
  });
}

function getChildFriendlyMessage(error: Error): string {
  if (error.message.includes('network')) {
    return 'インターネットが つながっていないみたい。おうちのひとに きいてね。';
  } else if (error.message.includes('audio')) {
    return 'おとが でないみたい。ボリュームを たしかめてね。';
  } else {
    return 'なにか うまくいかなかったよ。もういちど やってみよう!';
  }
}
```

---

### P3-1: 将来の拡張準備

**改善アクション**:

#### バックエンド連携の準備

```typescript
// front/src/core/api/client.ts (新規)
export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl = import.meta.env.VITE_API_URL || '') {
    this.baseUrl = baseUrl;
  }

  async syncProgress(data: ProgressData): Promise<void> {
    if (!this.baseUrl) {
      // オフラインモード: ローカルにキュー
      await this.queueForLaterSync(data);
      return;
    }

    try {
      await fetch(`${this.baseUrl}/api/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } catch (error) {
      await this.queueForLaterSync(data);
    }
  }

  private async queueForLaterSync(data: ProgressData) {
    const queue = await this.getSyncQueue();
    queue.push({ data, timestamp: Date.now() });
    await this.saveSyncQueue(queue);
  }
}
```

#### A/Bテストフレームワーク

```typescript
// front/src/core/experiments/abTest.ts (新規)
export class ABTestManager {
  getVariant(experimentId: string): 'A' | 'B' {
    const userId = this.getUserId();
    const hash = this.hashCode(`${experimentId}-${userId}`);
    return hash % 2 === 0 ? 'A' : 'B';
  }

  trackEvent(experimentId: string, event: string, metadata?: object) {
    const variant = this.getVariant(experimentId);

    this.telemetry.record({
      type: 'experiment',
      experimentId,
      variant,
      event,
      metadata,
      timestamp: Date.now()
    });
  }
}

// 使用例: 報酬演出のA/Bテスト
const variant = abTest.getVariant('reward-animation-v2');
if (variant === 'A') {
  showStandardReward();
} else {
  showEnhancedReward();
}
abTest.trackEvent('reward-animation-v2', 'reward-shown', { streak });
```

---

## 🎯 成功指標とマイルストーン

### 短期目標 (1-2ヶ月)

- [ ] すべてのミニゲームが完全に動作
- [ ] テストカバレッジ > 30%
- [ ] パフォーマンス目標達成 (報酬 < 500ms など)
- [ ] 5名以上の子どもでユーザビリティテスト実施
- [ ] 成功率70-85%の実証

### 中期目標 (3-4ヶ月)

- [ ] テストカバレッジ > 50%
- [ ] 10名以上の子どもでテスト、フィードバック反映
- [ ] PWA として主要デバイスで動作確認
- [ ] 保護者ダッシュボードの拡充
- [ ] 新規ミニゲーム1-2個追加

### 長期目標 (6ヶ月+)

- [ ] マネタイズ機能の実装 (サブスク、フリーミアム)
- [ ] バックエンド統合 (クラウド同期、分析)
- [ ] ネイティブアプリ化 (React Native または PWA ストア配信)
- [ ] 多言語展開 (英語以外)
- [ ] 機関向けライセンス (幼稚園、保育園)

---

## 📊 改善効果の測定

### Before / After 比較

| 項目 | 現状 (Before) | 目標 (After) |
|------|--------------|--------------|
| テストカバレッジ | 12% | 50%+ |
| パフォーマンス実測データ | 0件 | 全項目で実測 |
| ユーザビリティテスト | 0名 | 10名+ |
| 動作するゲーム | 2-4個 (不完全) | 4個 (完全) |
| ドキュメント vs 実装ギャップ | 大きい | 小さい |
| PWA動作確認 | 未実施 | 主要デバイスで確認済み |

---

## 🚧 リスクと対策

### リスク1: 時間不足
**対策**: フェーズを優先順位順に実行。P0 → P1 → P2 の順で、途中で止めても価値がある形にする

### リスク2: ユーザビリティテスト参加者が集まらない
**対策**: オンラインプロトタイプツール (UserTesting.com など) を活用、または友人・家族に協力依頼

### リスク3: パフォーマンス目標未達
**対策**: 早期に実測し、達成困難な場合は目標値を現実的に調整 (ドキュメント更新)

### リスク4: 実装リソース不足
**対策**: 最小限の機能セットでMVPを完成させることを優先。拡張機能は後回し

---

## 🎓 学んだ教訓

このプロジェクトから得られる教訓:

1. **設計と実装は並行して進めるべき**: 設計だけが先行すると、実装の現実とのギャップが生まれる
2. **早期の検証が重要**: 理論的には正しくても、実際のユーザーでテストするまで分からない
3. **MVP の定義を明確に**: 「最小限」とは何かを常に問い続ける
4. **ドキュメントは実装の鏡**: 実装されていない機能をDONEにしない
5. **測定できないものは改善できない**: パフォーマンス、成功率などは必ず実測する

---

## 📝 最後に

このロードマップは、Dekita Lab を「素晴らしい設計書」から「動く証拠」に変換するための具体的な道筋です。

すべてを一度に実行する必要はありません。P0 から順番に、着実に進めることが成功への鍵です。

**次のアクション**:
1. このロードマップを読み、優先順位に同意する
2. P0-1 (実装状況の全数調査) から開始する
3. 1週間ごとに進捗を確認し、計画を調整する

---

**作成日**: 2025-10-23
**作成者**: Claude Code (改善提案エージェント)
**次回レビュー予定**: 2025-11-06
