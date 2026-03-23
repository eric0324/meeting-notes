# meeting-setup

## ADDED Requirements

### Requirement: Attendee selection
系統 SHALL 提供與會者搜尋功能，從 Google Workspace Directory API 搜尋公司員工並加入與會者清單。

#### Scenario: Search attendees
- **WHEN** 使用者在與會者欄位輸入關鍵字
- **THEN** 系統從 Google Workspace Directory 搜尋匹配的員工並顯示結果

#### Scenario: Add attendee
- **WHEN** 使用者從搜尋結果中點選一位員工
- **THEN** 該員工加入與會者清單，顯示姓名與 email

#### Scenario: Remove attendee
- **WHEN** 使用者點擊已選與會者的移除按鈕
- **THEN** 該員工從與會者清單中移除

### Requirement: Meeting room selection
系統 SHALL 提供會議室下拉選單，資料來源為 PostgreSQL 資料庫中的 meeting_rooms table。

#### Scenario: Display room list
- **WHEN** 使用者點擊會議室下拉選單
- **THEN** 顯示資料庫中所有會議室選項

### Requirement: Start meeting
系統 SHALL 在與會者和會議室都已選擇時，允許使用者開始會議記錄。

#### Scenario: Start meeting with valid input
- **WHEN** 使用者已選擇至少一位與會者且已選擇會議室，點擊「開始會議記錄」
- **THEN** 導向錄音頁面，帶入與會者和會議室資訊

#### Scenario: Start meeting with incomplete input
- **WHEN** 使用者未選擇與會者或未選擇會議室，點擊「開始會議記錄」
- **THEN** 顯示提示訊息，要求填寫完整
