// 電子報功能開關。關閉時：文章內頁、文章列表不渲染訂閱表單，/newsletter 頁不產出，sitemap 不收錄。
// 目前關閉的原因：Kit 電子報服務還沒申請，表單會顯示「請到信箱點確認連結」，實際卻不會寄任何信。
// 改成 true 之前必須先做：
//   1. 在 Vercel Production 設定 KIT_API_KEY、KIT_FORM_ID
//   2. 在正式資料庫跑 sql/2026-09-14-newsletter-subscribers.sql
// 程式碼（NewsletterSignup、api/subscribe.ts）都保留，只靠這個開關藏起來。
export const NEWSLETTER_ENABLED = false;
