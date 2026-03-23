# meeting-summary

## ADDED Requirements

### Requirement: AI summary generation
系統 SHALL 將逐字稿透過 Claude API 產生結構化會議記錄，包含會議基本資訊、討論重點摘要、決議事項、待辦事項與負責人。

#### Scenario: Generate summary
- **WHEN** 逐字稿送至 Claude API
- **THEN** 回傳結構化會議記錄，包含會議基本資訊（日期、會議室、與會者）、討論重點摘要、決議事項、待辦事項（Action Items）與負責人

#### Scenario: Processing state
- **WHEN** 等待 Claude API 回應期間
- **THEN** 頁面顯示「整理會議記錄中...」loading 狀態

### Requirement: Preview and edit
系統 SHALL 允許使用者在上傳前預覽並編輯會議記錄。

#### Scenario: Preview summary
- **WHEN** Claude API 回傳會議記錄
- **THEN** 頁面顯示會議記錄內容供預覽

#### Scenario: Edit summary
- **WHEN** 使用者修改會議記錄內容
- **THEN** 頁面更新顯示修改後的內容

#### Scenario: Confirm upload
- **WHEN** 使用者預覽/編輯完成，點擊「上傳至 Google Drive」按鈕
- **THEN** 觸發 Google Drive 上傳流程
