-- ============================================================
-- 電子報訂閱名單 newsletter_subscribers
--
-- 用途：文章專欄的訂閱表單（src/components/NewsletterSignup.astro）送出後，
-- api/subscribe.ts 以 service key 寫入本表。名單以本表為準；正式站另外同步到 Kit
-- 寄確認信與新文章通知。
--
-- Kit 同步的兩個欄位：
--   kit_sync_attempted_at：呼叫 Kit 之前的原子搶位（null → 現在）。只有搶到的請求能呼叫 Kit，
--                          同一 email 不論同時送幾次、失敗後重送幾次，Kit 最多被呼叫一次。
--   kit_synced_at        ：Kit 呼叫成功後寫入。
-- 兩者皆 null：preview／本機產生的列，或正式站未設定 Kit 金鑰時的列。
--
-- 手動補同步（Kit 呼叫失敗，使用者重送也不會自動重試）：
--   select email, source, kit_sync_attempted_at
--   from public.newsletter_subscribers
--   where env = 'prod' and kit_sync_attempted_at is not null and kit_synced_at is null
--   order by kit_sync_attempted_at;
-- 在 Kit 後台手動加入後，執行 update ... set kit_synced_at = now() where email = '<email>';
--
-- 執行方式：Supabase Dashboard → SQL Editor → 貼上整段 → Run
--
-- 統計注意：preview 部署與正式站共用同一個資料庫，
-- 計算真實訂閱數一律加 where env = 'prod'。
-- ============================================================

create table if not exists public.newsletter_subscribers (
  id            bigint generated always as identity primary key,
  email         text not null unique,
  source        text not null default 'unknown'
                check (source in ('article-end', 'articles-list', 'newsletter-page', 'unknown')),
  env           text not null
                check (env in ('prod', 'preview')),
  kit_sync_attempted_at timestamptz,
  kit_synced_at timestamptz,
  created_at    timestamptz not null default now()
);

comment on table public.newsletter_subscribers is
  '電子報訂閱名單。由 api/subscribe.ts 寫入；統計時以 env = ''prod'' 過濾。';

-- 只允許後端 service_role 存取。啟用 RLS 但不建立任何 policy，
-- 前端的 anon / authenticated 角色就完全讀寫不到這張表。
alter table public.newsletter_subscribers enable row level security;

-- 全域限流查詢（近 10 分鐘、當前 env 的新列數）用
create index if not exists newsletter_subscribers_env_created_idx
  on public.newsletter_subscribers (env, created_at);
