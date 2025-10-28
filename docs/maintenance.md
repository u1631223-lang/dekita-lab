# ドキュメント保守ガイド

- 設計や仕様の更新を行った際は、関連する資料 (`docs/project.md`, `docs/requirements.md`, `docs/experience-design.md` など) を同じブランチで更新し、チケットのメモ欄にも変更概要を残すこと。
- 新しい機能や設定を追加した場合は、`AGENTS.md` と `README.md` に開発者向けの手順を追記し、`docs/development-cautions.md` に注意事項があれば反映する。
- トラブルシュートの知見は `docs/troubleshooting-log.md` に追記し、重要なパターンを `docs/troubleshooting.md` の「よくある問題」に反映する。
- Phase が進む際は、必ず `docs/tickets.md` のステータスを更新し、Serena メモリ（`project_overview.md` など）が最新化されているか確認する。
