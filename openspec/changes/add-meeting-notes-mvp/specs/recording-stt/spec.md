# recording-stt

## ADDED Requirements

### Requirement: Browser audio recording
系統 SHALL 透過瀏覽器 MediaRecorder API 擷取麥克風音訊。

#### Scenario: Microphone authorized
- **WHEN** 使用者進入錄音頁面並同意麥克風權限
- **THEN** 開始錄音並顯示錄音中狀態

#### Scenario: Microphone denied
- **WHEN** 使用者進入錄音頁面並拒絕麥克風權限
- **THEN** 顯示錯誤訊息，說明需要麥克風權限才能使用

### Requirement: Pause and resume
系統 SHALL 允許使用者暫停和繼續錄音。

#### Scenario: Pause recording
- **WHEN** 錄音進行中，使用者點擊「暫停」按鈕
- **THEN** 停止錄音並顯示暫停狀態

#### Scenario: Resume recording
- **WHEN** 錄音已暫停，使用者點擊「繼續」按鈕
- **THEN** 恢復錄音並顯示錄音中狀態

### Requirement: End meeting and transcribe
系統 SHALL 在使用者結束錄音後，將音訊上傳至 S3 並啟動 AWS Transcribe batch job（含 speaker diarization）。

#### Scenario: End meeting
- **WHEN** 使用者點擊「結束會議」按鈕
- **THEN** 停止錄音，將音訊檔上傳至 S3，啟動 AWS Transcribe job（啟用 ShowSpeakerLabels），顯示處理中狀態

#### Scenario: Transcription complete
- **WHEN** AWS Transcribe job 完成
- **THEN** 取得含 speaker label 的逐字稿，進入會議記錄整理流程

### Requirement: Speaker diarization
AWS Transcribe SHALL 辨識不同講話者並在逐字稿中標記 speaker label。

#### Scenario: Multiple speakers
- **WHEN** 會議中有多位講話者，AWS Transcribe 完成轉錄
- **THEN** 逐字稿中標示不同的 speaker label（如 spk_0、spk_1）
