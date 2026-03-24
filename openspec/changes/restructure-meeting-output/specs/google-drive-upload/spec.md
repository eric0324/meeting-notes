# google-drive-upload

## MODIFIED Requirements

### Requirement: Meeting folder structure
系統 SHALL 在會議室資料夾下，為每次會議建立一個子資料夾，命名格式為 `{date} - {room}`。

#### Scenario: Create meeting subfolder
- **WHEN** 使用者觸發上傳流程
- **THEN** 在該會議室資料夾下建立子資料夾，命名為 `{date} - {room}`（如 `2026/3/24 - 大會議室`）

#### Scenario: Meeting subfolder already exists
- **WHEN** 同一天同一會議室已有同名子資料夾
- **THEN** 使用既有的子資料夾，不重複建立

### Requirement: Upload three files to meeting folder
系統 SHALL 將 3 個檔案上傳至會議子資料夾。

#### Scenario: Upload audio file
- **WHEN** 上傳流程執行
- **THEN** 將錄音 .webm 檔案上傳至會議子資料夾，檔名為 `{date} - {room} 音訊.webm`

#### Scenario: Upload transcript
- **WHEN** 上傳流程執行
- **THEN** 將逐字稿建立為 Google Doc 上傳至會議子資料夾，檔名為 `{date} - {room} 逐字稿`

#### Scenario: Upload meeting notes
- **WHEN** 上傳流程執行
- **THEN** 將會議記錄建立為 Google Doc 上傳至會議子資料夾，檔名為 `{date} - {room} 會議記錄`

### Requirement: Share all files with attendees
系統 SHALL 對會議子資料夾開啟編輯權限給所有與會者（資料夾層級，子檔案繼承）。

#### Scenario: Grant folder permissions
- **WHEN** 會議子資料夾及所有檔案上傳完成
- **THEN** 所有與會者的 email 獲得該資料夾的編輯權限，資料夾內所有檔案繼承此權限

### Requirement: Display folder link
系統 SHALL 在上傳完成後顯示會議資料夾的 Google Drive 連結。

#### Scenario: Upload success
- **WHEN** 所有檔案上傳且權限設定完成
- **THEN** 頁面顯示會議資料夾的可點擊連結

#### Scenario: Upload failure
- **WHEN** 上傳過程中發生錯誤
- **THEN** 顯示錯誤訊息並提供重試按鈕
