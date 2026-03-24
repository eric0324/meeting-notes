## Why

目前會議記錄只上傳一個 Google Doc 到 Google Drive。新需求是每次會議建立一個獨立資料夾，裡面包含完整的會議產出物：音訊檔、逐字稿、摘要與會議紀錄，讓會議資料更有結構且方便回顧。

## What Changes

- 修改 Google Drive 上傳流程：每次會議在會議室資料夾下建立一個子資料夾
- 資料夾命名沿用現有規則：`{date} - {room}`（如 `2026/3/24 - 大會議室`）
- 上傳 3 個檔案至該子資料夾：
  1. `{date} - {room} 音訊.webm` — 原始錄音 .webm 檔案
  2. `{date} - {room} 逐字稿` — Google Doc，含 speaker label
  3. `{date} - {room} 會議記錄` — Google Doc，現有的結構化會議記錄
- 音訊 blob 需保留供後續上傳 Google Drive
- 所有檔案都開編輯權限給與會者

## Capabilities

### New Capabilities

### Modified Capabilities
- `google-drive-upload`: 從上傳單一 Google Doc 改為建立會議資料夾 + 上傳 3 個檔案
- `recording-stt`: 音訊 blob 需保留供後續上傳 Google Drive

## Impact

- 需修改 POST `/api/meeting/upload` 的邏輯（建立子資料夾、上傳多個檔案）
- 上傳完成頁需顯示資料夾連結（而非單一文件連結）
- Google Drive API 用量增加（每次會議從 1 個檔案變成 3 個檔案 + 1 個資料夾）
