# auth

## ADDED Requirements

### Requirement: Password login
系統 SHALL 提供密碼保護的登入頁面，使用一組共用密碼驗證身份，驗證成功後發出 JWT token（httpOnly cookie，效期 1 年）。

#### Scenario: Correct password
- **WHEN** 使用者輸入正確的共用密碼並送出
- **THEN** 系統發出 JWT httpOnly cookie（效期 1 年）並導向會議設定頁

#### Scenario: Wrong password
- **WHEN** 使用者輸入錯誤的密碼並送出
- **THEN** 顯示「密碼錯誤」提示，停留在登入頁面

### Requirement: Route protection
系統 SHALL 保護登入頁以外的所有路由，未持有有效 JWT 的使用者 MUST 被導向登入頁。

#### Scenario: Unauthenticated access
- **WHEN** 未持有有效 JWT token 的使用者嘗試存取受保護頁面
- **THEN** 自動導向登入頁面

#### Scenario: Expired JWT
- **WHEN** 使用者持有已過期的 JWT token 並嘗試存取受保護頁面
- **THEN** 自動導向登入頁面
