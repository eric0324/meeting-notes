# Tasks: 會議記錄工具 MVP

## 前置作業
- [x] T0: 初始化 Next.js 專案 + TypeScript + Prisma + PostgreSQL 連線
- [x] T1: 設定環境變數結構（密碼、JWT secret、AWS、Google、Claude API keys）

## M1 - 登入與驗證
- [x] T2: 建立 POST `/api/auth/login`（驗證密碼、發 JWT cookie）
- [x] T3: 建立登入頁面 `/login`
- [x] T4: 建立 middleware（JWT 驗證、未登入導向 `/login`）

## M2 - 會議設定頁
- [x] T5: 建立 meeting_rooms table（Prisma schema）+ seed 資料
- [x] T6: 建立 GET `/api/rooms`（取會議室清單）
- [x] T7: 建立 GET `/api/directory/search`（proxy Google Workspace Directory API）
- [x] T8: 建立會議設定頁面 `/`（與會者搜尋選擇、會議室下拉、開始按鈕）

## M3 - 錄音與轉文字
- [x] T9: 建立前端錄音元件（MediaRecorder、暫停/繼續/結束）
- [x] T10: 建立 POST `/api/meeting/transcribe`（上傳 S3 → 啟動 Transcribe job → polling → 回傳逐字稿）

## M4 - 會議記錄整理
- [x] T11: 建立 POST `/api/meeting/summarize`（逐字稿送 Claude API → 回傳結構化摘要）
- [x] T12: 建立會議記錄預覽/編輯頁面 `/meeting/summary`

## M5 - Google Drive 上傳
- [x] T13: 建立 POST `/api/meeting/upload`（建立資料夾 → 建立 Google Doc → 開權限 → 回傳連結）
- [x] T14: 上傳成功頁面（顯示 Google Drive 連結）

## 依賴關係
- T2 → T3 → T4（auth 完成後其他頁面才能開發）
- T5 → T6 → T8
- T7 → T8
- T9 → T10（前端錄音 → 後端轉文字）
- T10 → T11 → T12（逐字稿 → 摘要 → 預覽）
- T12 → T13 → T14（預覽 → 上傳 → 完成頁）
- T8 可與 T9 並行

## 可並行的工作
- T5、T6、T7 可並行（都是獨立 API）
- T9（前端錄音）與 T5-T7 可並行
- T11（Claude API）與 T13（Google Drive API）的 API route 可並行開發，但流程上有先後
