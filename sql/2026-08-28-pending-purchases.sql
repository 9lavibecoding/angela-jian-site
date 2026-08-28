-- ============================================================
-- 修復「付款成功但沒有購買紀錄」的架構斷點
--
-- 背景：purchases 只在客人付款後、於 /exam/app 用 Google 登入時才寫入。
-- 客人若關掉分頁、換裝置，或當下登入失敗（2026-08-27 Supabase 暫停即為此例），
-- 錢收了但權限發不出去，且無從得知是誰付的。
--
-- 解法：綠界的 server-to-server 回呼一收到付款成功就先寫入 pending_purchases，
-- 與客人是否登入完全無關。之後客人用同一個 email 登入即可自動認領。
--
-- 執行方式：Supabase Dashboard → SQL Editor → 貼上整段 → Run
-- ============================================================

create table if not exists public.pending_purchases (
  trade_no   text primary key,
  email      text,
  amount     integer,
  paid_at    timestamptz not null default now(),
  claimed_at timestamptz,
  claimed_by uuid
);

comment on table public.pending_purchases is
  '綠界確認付款成功的訂單。客人登入後由 api/claim-purchase.ts 認領並轉為 purchases 紀錄。';

-- 依 email 找未認領訂單（認領流程的主要查詢路徑）
create index if not exists pending_purchases_unclaimed_email_idx
  on public.pending_purchases (lower(email))
  where claimed_at is null;

-- 只允許後端 service_role 存取。啟用 RLS 但不建立任何 policy，
-- 前端的 anon / authenticated 角色就完全讀不到這張表。
alter table public.pending_purchases enable row level security;

-- ------------------------------------------------------------
-- 一筆訂單只能開通一個帳號。應用層已有檢查，這裡加上資料庫層保險，
-- 避免同時送出的兩個請求都通過檢查（race condition）。
-- 若這行報錯，表示 purchases 已有重複的 trade_no，需先人工清理再執行。
-- ------------------------------------------------------------
create unique index if not exists purchases_trade_no_key
  on public.purchases (trade_no);
