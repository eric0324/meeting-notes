# OpenSpec Agent Instructions

## Project Overview
會議記錄工具 — 錄音、STT、AI 摘要、Google Drive 上傳。

## How to Use OpenSpec in This Project

### Creating Changes
1. 在 `openspec/changes/<change-id>/` 下建立 proposal
2. Change ID 使用動詞開頭的 kebab-case（如 `add-login-page`）
3. 每個 change 包含：`proposal.md`、`tasks.md`、`design.md`（需要時）、`specs/` 資料夾

### Spec Format
- Specs 放在 `openspec/specs/<capability>/spec.md`
- 使用 `## ADDED|MODIFIED|REMOVED Requirements` 區分變更類型
- 每個 requirement 至少一個 `#### Scenario:`

### Applying Changes
- 確認 proposal 後，依 `tasks.md` 順序逐一實作
- 遵循 TDD：先寫測試，再寫實作
- 完成後用 `openspec archive <id>` 歸檔

### CLI Commands
- `openspec list` — 列出進行中的 changes
- `openspec list --specs` — 列出所有 specs
- `openspec validate <id> --strict --no-interactive` — 驗證 change
- `openspec show <id>` — 查看 change 詳情
- `openspec archive <id> --yes` — 歸檔已完成的 change
