# Project Context

## Purpose
客製化會議記錄工具，供公司內部使用。自動錄音、即時語音轉文字（含講話者辨識）、AI 會議摘要，並自動上傳至 Google Drive 分享給與會者。

## Tech Stack
- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL（同台 EC2）
- **Auth**: 密碼保護 + JWT (httpOnly cookie, 1 年效期)
- **STT**: AWS Transcribe batch (speaker diarization) + S3
- **AI**: Claude API (會議記錄摘要)
- **通訊錄**: Google Workspace Directory API
- **儲存**: Google Drive API
- **部署**: AWS

## Project Conventions

### Code Style
- TypeScript strict mode
- 偏好簡單直接的解法，避免過度抽象
- 單一檔案實作為預設，除非複雜度明確需要拆分
- 新增程式碼控制在 100 行以內

### Architecture Patterns
- Next.js App Router (server components by default)
- API Routes 處理後端邏輯
- 環境變數管理所有 secrets

### Testing Strategy
- TDD：先寫測試，再寫實作
- Unit test 優先，需要時補 integration test
- 測試命名描述行為，非實作細節

### Git Workflow
- Commit message 格式：`type(scope): description`
- 常用 type：feat、fix、test、refactor、docs、chore

## Domain Context
- 公司內部工具，不對外開放
- 使用者為公司員工，透過 Google Workspace 管理
- 會議室為固定清單（可設定）

## Important Constraints
- 網址公開但需密碼保護
- AWS Transcribe streaming 中文支援需實測驗證
- Google Workspace Directory API 需管理員權限的 service account
- 瀏覽器麥克風權限需使用者主動授權

## External Dependencies
- AWS Transcribe Streaming API
- Claude API (Anthropic)
- Google Workspace Directory API
- Google Drive API
- Google Cloud Service Account
