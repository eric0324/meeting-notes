# google-drive-upload

## ADDED Requirements

### Requirement: Folder management by meeting room
系統 SHALL 依會議室名稱在 Google Drive 中建立或使用對應資料夾。

#### Scenario: Folder exists
- **WHEN** Google Drive 中已有該會議室名稱的資料夾，上傳會議記錄
- **THEN** 將檔案上傳至該既有資料夾

#### Scenario: Folder does not exist
- **WHEN** Google Drive 中尚無該會議室名稱的資料夾，上傳會議記錄
- **THEN** 先建立資料夾，再上傳檔案至該資料夾

### Requirement: Upload as Google Doc
系統 SHALL 將會議記錄以 Google Doc 格式上傳至 Google Drive。

#### Scenario: Upload meeting notes
- **WHEN** 系統上傳會議記錄至 Google Drive
- **THEN** 建立 Google Doc，檔名包含日期與會議室名稱，內容為結構化的會議記錄

### Requirement: Share with attendees
系統 SHALL 在上傳後自動開啟編輯權限給所有與會者。

#### Scenario: Grant permissions
- **WHEN** Google Doc 已上傳
- **THEN** 所有與會者的 email 獲得該文件的編輯權限

### Requirement: Display drive link
系統 SHALL 在上傳完成後顯示 Google Drive 連結。

#### Scenario: Upload success
- **WHEN** 檔案上傳且權限設定完成
- **THEN** 頁面顯示 Google Doc 的可點擊連結

#### Scenario: Upload failure
- **WHEN** 上傳過程中發生錯誤
- **THEN** 顯示錯誤訊息並提供重試按鈕
