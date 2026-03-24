# recording-stt

## MODIFIED Requirements

### Requirement: Preserve audio blob for Drive upload
系統 SHALL 在錄音結束後保留音訊 blob，供後續上傳至 Google Drive 使用。

#### Scenario: Audio blob available after transcription
- **WHEN** 錄音結束並完成轉文字流程
- **THEN** 音訊 blob 仍保留在前端記憶體中，可供上傳流程使用

#### Scenario: Audio blob passed to upload
- **WHEN** 使用者觸發上傳至 Google Drive
- **THEN** 音訊 blob 作為 .webm 檔案一併上傳
