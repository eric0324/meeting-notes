# Design: 重構會議輸出結構

## 變更概覽

從「上傳單一 Google Doc」改為「建立會議資料夾 + 上傳 3 個檔案」。同時移除手動預覽/編輯路徑（summary page + upload API + summarize API），統一由 transcribe route 的 background process 處理。

```
Google Drive
└── {會議室名稱}/                    ← 既有的會議室資料夾
    └── {date} - {room}/             ← 新增：每次會議一個子資料夾
        ├── {date} - {room} 音訊.webm
        ├── {date} - {room} 逐字稿   (Google Doc)
        └── {date} - {room} 會議記錄  (Google Doc)
```

## API 變更

### POST `/api/meeting/transcribe`（修改）
- `processInBackground` 新增 `audioBuffer` 參數
- 建立會議子資料夾，上傳 3 個檔案（音訊、逐字稿、會議記錄）
- 權限設在資料夾層級，檔案繼承

### 移除的 API
- DELETE `/api/meeting/upload` — 不再需要獨立上傳 API
- DELETE `/api/meeting/summarize` — 摘要已整合在 transcribe background process

## 前端變更

### 移除的頁面
- DELETE `/meeting/summary` — 不再需要手動預覽/編輯頁面

## 技術決策

| 決策 | 選擇 | 理由 |
|------|------|------|
| 權限層級 | 資料夾層級 | 一次設定，3 個檔案自動繼承，減少 API 呼叫 |
| 音訊傳遞 | 傳 audioBuffer 給 background process | 已在記憶體中，不需再從 S3 下載 |
| 統一流程 | 移除手動路徑 | 簡化架構，只保留自動一條龍流程 |
