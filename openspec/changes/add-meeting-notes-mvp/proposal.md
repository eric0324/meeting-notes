## Why

公司需要一套內部會議記錄工具，能自動錄音、轉文字、辨識講話者、產生會議摘要，並自動歸檔到 Google Drive 分享給與會者。目前這些流程都是手動的，耗時且容易遺漏。

## What Changes

- 新增密碼保護的登入機制（共用密碼 + JWT httpOnly cookie，1 年效期）
- 新增會議設定頁面（從 Google Workspace Directory 選與會者、從 PostgreSQL 選會議室）
- 新增瀏覽器錄音功能（MediaRecorder API，支援暫停/繼續）
- 新增語音轉文字（音訊上傳 S3 → AWS Transcribe batch + speaker diarization）
- 新增 AI 會議摘要（Claude API 產生結構化會議記錄，支援預覽與編輯）
- 新增 Google Drive 上傳（依會議室分資料夾、建立 Google Doc、開權限給與會者）

## Capabilities

### New Capabilities
- `auth`: 密碼登入與 JWT 路由保護
- `meeting-setup`: 會議設定頁面（與會者選擇、會議室選擇）
- `recording-stt`: 瀏覽器錄音、S3 上傳、AWS Transcribe 轉文字含 speaker diarization
- `meeting-summary`: Claude API 產生結構化會議摘要，預覽與編輯
- `google-drive-upload`: Google Drive 上傳、資料夾管理、權限分享

### Modified Capabilities

## Impact

- 全新專案，無既有程式碼受影響
- 需要 AWS 資源：S3 bucket、Transcribe 權限、EC2
- 需要 Google Cloud：Service Account（Directory API + Drive API 權限）
- 需要 Anthropic Claude API key
- EC2 上需安裝 PostgreSQL
- 技術棧：Next.js (App Router) + TypeScript + Prisma + PostgreSQL
- 部署：單台 EC2
