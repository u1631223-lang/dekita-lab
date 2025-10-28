# Repository Guidelines

## Project Structure & Module Organization
- `docs/`: プロジェクトビジョン、要件、技術スタック、アーキテクチャ、チケット一覧を収録。まずここで目的と進捗を確認してください。
- `front/`: Webクライアント実装予定。`src/app` にアプリシェル、`src/core` にエンジン・適応・報酬ロジック、`src/modules` に各ミニゲーム、`src/ui` に共通UIを配置します。ミニゲームは `GameModule` として登録 (`src/modules/registerModules.ts`) し、セッションエンジンから共通インターフェースで扱います。
- `backend/`: 将来の分析APIや保護者ダッシュボード向けサーバーコード置き場として予約済みです。
- `ops/`: CI/CDやデプロイ設定を格納する想定です。

## Build, Test & Development Commands
実装後は以下をpnpmで実行します。
- `pnpm install`: 依存関係を導入。
- `pnpm dev`: Viteの開発サーバー起動（ホットリロード対応）。
- `pnpm build`: PWA対応の本番ビルド生成。
- `pnpm test`: Vitestによる単体テスト。
- `pnpm run lint` / `pnpm run format`: ESLint・Stylelint・Prettierを実行。
- `pnpm exec playwright test`: 操作・アクセシビリティのスモークテスト。
- `pnpm run storybook`: UIコンポーネントカタログを起動。

## Coding Style & Naming Conventions
- TypeScript＋Reactを前提にESLintルールとPrettier整形を適用。インデントはスペース2。
- Zustandストア名は `useXxxStore`、ミニゲームは `front/src/modules/<game-name>` に配置し `init/startRound/evaluate/cleanup` を実装。
- i18nテキストは `react-i18next` のキーで管理し、JP/EN両対応を維持。
- UIはWCAG 2.1 AA基準のコントラストと大型タッチ領域を確保。

## Testing Guidelines
- 単体テストはVitest＋React Testing Libraryでファイル末尾に `*.test.ts(x)` として配置。
- Playwrightはユーザーフローとアクセシビリティ検証を担当。重要シナリオにはスクリーンショット比較を推奨。
- 成功率や反応時間の計算ロジックには境界ケースを追加し、セルフエフィカシーを損なわないことを確認。
- コード調査時は Serena の `find_symbol` / `search_for_pattern` / `get_symbols_overview` を活用し、必要最小限の断片のみを読み込んでコンテキストを節約する。

## Commit & Pull Request Guidelines
- コミットメッセージは英語の現在形で簡潔に（例: `feat: implement adaptive difficulty hooks`）。
- プルリクでは目的、主要変更点、テスト結果、関連チケット（`docs/tickets.md`）へのリンクを記載。
- UI変更時はスクリーンショットや短い動画を添付し、保護者UXへの影響を明示。

## Security & Configuration Tips
- MVPでは個人情報を保持しない方針。開発時もダミーデータを使用すること。
- 環境変数は `.env.local` に保管し、Git管理から除外する。
- 将来の分析連携では保護者の明示的同意フローを必ず実装してください。
- ネットワーク通信や外部サービス連携は依頼者の指示があるまで無効化し、ローカルストレージ内データも最小限に留める。
- 依頼者によるローカルテストで合格通知が出るまでは、デプロイ準備やフェーズ移行のタスクを起票・実施しない。
- 保護者向け設定（報酬演出や音量調整など）は `CaregiverGateModal` を経由するため、変更時はゲートの動作確認と i18n を忘れないこと。
- グローバルスターとマイルストーン演出があるため、成功判定時には `useProgressStore` の `addStars` を忘れずに呼び出し、演出体験を損なわないようにする。
