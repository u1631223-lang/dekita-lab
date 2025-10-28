# Dekita Lab

Neuroscience-informed learning game prototype for children aged 4–7. Phase 1 delivers two web-based mini-games (Rhythm Tap, Pair Match) with adaptive difficulty, multi-sensory rewards, and caregiver-facing progress summaries.

## プロジェクト構成
- `front/` – Vite + React(TypeScript) クライアント。PWA 対応、Zustand 状態管理、Tailwind ベースのスタイル、Vitest/Playwright/Storybook を同梱。
- `docs/` – 要件、アーキテクチャ、チケット管理、トラブルシュートガイドなど設計資料。
- `package.json`（ルート） – pnpm ワークスペーススクリプト。

## セットアップ
```bash
pnpm install # front/ への依存も自動でインストール
pnpm --filter front dev
```

## 開発コマンド
| コマンド | 説明 |
| --- | --- |
| `pnpm --filter front dev` | 開発サーバー (Vite) を起動。 |
| `pnpm --filter front build` | 本番ビルド (PWA) を生成。 |
| `pnpm --filter front lint` | ESLint / Stylelint / Prettier チェック。 |
| `pnpm --filter front test` | Vitest 単体テスト。 |
| `pnpm --filter front test:ui` | Playwright スモークテスト。 |
| `pnpm --filter front storybook` | Storybook ドキュメントサーバー。 |

## プロトタイプ機能
- **保護者設定 & ゲート**: 初回に報酬演出や音量を保護者が調整し、再設定時も算数クイズゲートで子どもの誤操作を防止。
- **滑らかな難易度上昇**: どちらのゲームも小さな成功を積み重ねながら徐々にテンポ／カード枚数が上がるため、自然に「できた！」体験が増えていく。
- **目標とコレクション**: HUDに「次のごほうび」カウンターを表示し、連続成功でミニバッジを獲得。保護者モーダルから進捗リセットも可能。
- **新ミニゲーム**: 「キラキラパターン (Sequence Spark)」「かたちビルダー (Shape Builder)」を追加。光のパターン再現とシルエット完成で認知領域を拡張。
- **スター＆マイルストーン**: グローバルスターを集めるとワールドマップに演出が解放され、全画面のお祝いと進捗パネルでやる気を高めます。
- **適応学習ループ**: 成功率70〜85%帯を目標に難易度を自動調整。反応時間トレンドも指数平滑で計測。
- **多感覚報酬 & セッションタイマー**: 0.5秒以内の効果発火に加え、15分経過で優しい休憩リマインド。保護者向けにハブで最新統計を表示。
- **PWA 基盤**: `vite-plugin-pwa` によるサービスワーカー登録と IndexedDB 永続化でオフライン継続を想定。

## テスト & 品質
- Vitest でコアロジック（セッションマシン、適応、テレメトリ等）をカバー。
- Playwright 設定を追加し、将来的にUI フローを自動検証可能。
- Storybook で共通UI (HubCard) の状態確認が可能。

## 次のステップ
1. 実機検証: `pnpm --filter front dev` でローカル試遊し、レスポンスや演出を確認。
2. `pnpm --filter front lint` / `pnpm --filter front test` / `pnpm --filter front test:ui` を実行して品質確認。
3. 問題がなければ Phase 1 のローカルチェックを完了し、指示をもって Phase 2 以降へ進む。

> デプロイ・マネタイズは依頼者のローカルテスト合格指示が出るまで着手しません。
