# Design: 會議記錄工具 MVP

## 架構概覽

單台 EC2 上跑 Next.js (App Router) + PostgreSQL，整合外部服務處理 STT、AI 摘要、檔案儲存。

```
┌─────────────────────────────────────────┐
│                EC2                       │
│  ┌───────────────┐  ┌───────────────┐   │
│  │   Next.js     │  │  PostgreSQL   │   │
│  │  (App Router) │──│               │   │
│  └──────┬────────┘  └───────────────┘   │
└─────────┼───────────────────────────────┘
          │
    ┌─────┼──────────────────────────┐
    │     │    External Services     │
    ├─────┼──────────────────────────┤
    │  S3 + AWS Transcribe          │
    │  Claude API                    │
    │  Google Workspace Directory    │
    │  Google Drive API              │
    └────────────────────────────────┘
```

## 資料庫設計

### meeting_rooms
| Column     | Type         | Note           |
|------------|-------------|----------------|
| id         | SERIAL PK   |                |
| name       | VARCHAR(100) | 會議室名稱     |
| created_at | TIMESTAMP   | 建立時間       |

MVP 只需要這一張 table。會議記錄本身不存資料庫（上傳 Google Drive 後即完成）。

## 頁面結構

```
/login          → 登入頁（密碼輸入）
/               → 會議設定頁（選與會者、選會議室、開始按鈕）
/meeting        → 錄音頁（錄音控制、狀態顯示）
/meeting/summary → 會議記錄預覽/編輯/上傳
```

## 關鍵流程

### 1. 登入
- POST `/api/auth/login` → 驗證密碼 → 回傳 JWT httpOnly cookie
- Middleware 檢查 JWT，未登入導向 `/login`

### 2. 會議設定
- GET `/api/directory/search?q=keyword` → proxy Google Workspace Directory API
- GET `/api/rooms` → 從 PostgreSQL 取會議室清單

### 3. 錄音與轉文字
- 前端用 MediaRecorder API 錄音，存在 memory 中
- 結束後 POST `/api/meeting/transcribe`：
  1. 上傳音訊至 S3
  2. 啟動 AWS Transcribe job（啟用 ShowSpeakerLabels）
  3. Polling 等待完成（或前端 polling）
  4. 回傳含 speaker label 的逐字稿

### 4. 會議記錄整理
- POST `/api/meeting/summarize` → 逐字稿送 Claude API → 回傳結構化摘要
- 前端顯示可編輯的預覽

### 5. Google Drive 上傳
- POST `/api/meeting/upload` → 建立/找到資料夾 → 建立 Google Doc → 開權限 → 回傳連結

## 技術決策

| 決策 | 選擇 | 理由 |
|------|------|------|
| 錄音方式 | MediaRecorder API | 瀏覽器原生支援，不需額外套件 |
| STT | AWS Transcribe batch | 不需即時顯示，batch 更穩定且支援 diarization |
| 音訊暫存 | S3 | Transcribe 需要 S3 來源 |
| ORM | Prisma | Next.js 生態系主流，type-safe |
| AI 摘要 | Claude API | 使用者指定 |
| 檔案格式 | Google Doc | 方便協作編輯 |
