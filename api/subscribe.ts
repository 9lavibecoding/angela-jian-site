import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

/**
 * 電子報訂閱（src/components/NewsletterSignup.astro 的送出端點）。
 *
 * 1. 一律先寫進 Supabase 的 newsletter_subscribers（建表見 sql/2026-09-14-newsletter-subscribers.sql），
 *    名單以自家資料庫為準，不依賴 Kit。
 * 2. 只有正式站（VERCEL_ENV=production）且 KIT_API_KEY、KIT_FORM_ID 都有值時才同步到 Kit。
 * 3. 呼叫 Kit 前先「原子搶位」：把 kit_sync_attempted_at 從 null 設為現在，只有搶到的那個請求能呼叫 Kit。
 *    因此同一 email 不論同時送幾次、失敗後再送幾次，Kit 最多只被呼叫一次（不會重寄確認信）。
 *    Kit 失敗的列（attempted 有值、synced 為 null）不自動重試，由管理者查出後手動補。
 * 4. 新訂閱與重複訂閱回應完全相同，不透露 email 是否已在名單上。
 *
 * 依賴（Supabase、Kit、LINE、環境變數）以 createHandler 注入，scripts/check-revenue.mjs 用記憶體內的
 * 假 Supabase 實跑整條流程；default export 以真實依賴組成，Supabase client 在請求時才建立。
 */

// 全域限流：個人部落格正常情況 10 分鐘內不會有 30 個新訂閱。超過多半是有人拿表單批次灌 email，
// 每筆都會讓 Kit 寄確認信給不相干的人，所以寧可暫停收單。只算當前 env 的新列。
export const RATE_LIMIT_MAX = 30;
export const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
// LINE 告警節流：這段時間內已有其他 Kit 同步失敗的列，就不再推播，避免連續失敗洗版。
export const ALERT_THROTTLE_WINDOW_MS = 10 * 60 * 1000;

export const ALLOWED_SOURCES = ['article-end', 'articles-list', 'newsletter-page'] as const;
export type SubscribeSource = (typeof ALLOWED_SOURCES)[number] | 'unknown';

const TABLE = 'newsletter_subscribers';
const GENERIC_ERROR = '訂閱沒有成功，請稍後再試。';
const RATE_LIMIT_MESSAGE = '目前訂閱的人比較多，請稍後再試。';
const KIT_API = 'https://api.kit.com/v4';

/** trim + lowercase；不合法回 null。 */
export function normalizeEmail(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const email = input.trim().toLowerCase();
  if (email.length === 0 || email.length > 254) return null;
  // 基本格式：local@domain.tld，不含空白與多個 @
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return null;
  return email;
}

export function resolveSource(input: unknown): SubscribeSource {
  return typeof input === 'string' && (ALLOWED_SOURCES as readonly string[]).includes(input)
    ? (input as SubscribeSource)
    : 'unknown';
}

export function resolveEnv(vercelEnv: string | undefined): 'prod' | 'preview' {
  return vercelEnv === 'production' ? 'prod' : 'preview';
}

/** 這個環境是否啟用 Kit 同步（決定要不要去搶位）。 */
export function kitEnabled(vercelEnv: string | undefined, hasKitCredentials: boolean): boolean {
  return vercelEnv === 'production' && hasKitCredentials;
}

/** 是否呼叫 Kit：環境啟用，而且這個請求搶到了同步位（kit_sync_attempted_at 由 null 改為有值）。 */
export function shouldSyncKit(opts: {
  vercelEnv: string | undefined;
  hasKitCredentials: boolean;
  claimed: boolean;
}): boolean {
  return kitEnabled(opts.vercelEnv, opts.hasKitCredentials) && opts.claimed;
}

/** 非 null 的純物件才算 body；null、陣列、字串、數字一律當空物件。 */
export function readBody(raw: unknown): Record<string, unknown> {
  let b = raw;
  if (typeof b === 'string') {
    try { b = JSON.parse(b); } catch { return {}; }
  }
  if (b === null || typeof b !== 'object' || Array.isArray(b)) return {};
  return b as Record<string, unknown>;
}

export interface SubscribeEnv {
  VERCEL_ENV?: string;
  KIT_API_KEY?: string;
  KIT_FORM_ID?: string;
}

export interface SubscribeDeps {
  /** 回傳 Supabase client；設定不完整時回 null。 */
  getSupabase: () => any | null;
  callKit: (email: string, apiKey: string, formId: string) => Promise<void>;
  notifyLine: (text: string) => Promise<void>;
  getEnv: () => SubscribeEnv;
  now?: () => number;
}

export function createHandler(deps: SubscribeDeps) {
  const now = deps.now ?? (() => Date.now());

  return async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ ok: false, message: 'Method not allowed' });
    }

    const body = readBody(req.body);

    // honeypot：真人看不到這個欄位，有值就是機器人。回成功讓它以為得手，什麼都不寫。
    if (typeof body.website === 'string' && body.website.trim() !== '') {
      return res.status(200).json({ ok: true });
    }

    const email = normalizeEmail(body.email);
    if (!email) {
      return res.status(400).json({ ok: false, message: 'email 格式不正確' });
    }
    const source = resolveSource(body.source);
    const { VERCEL_ENV, KIT_API_KEY: apiKey, KIT_FORM_ID: formId } = deps.getEnv();
    const env = resolveEnv(VERCEL_ENV);

    const sb = deps.getSupabase();
    if (!sb) {
      console.error('subscribe: SUPABASE_URL / SUPABASE_SECRET_KEY 未設定');
      return res.status(500).json({ ok: false, message: GENERIC_ERROR });
    }

    // ── 全域限流 ──
    const windowStart = new Date(now() - RATE_LIMIT_WINDOW_MS).toISOString();
    const { count: recent, error: countError } = await sb
      .from(TABLE)
      .select('id', { count: 'exact', head: true })
      .eq('env', env)
      .gt('created_at', windowStart);
    if (countError) {
      console.error('subscribe: 限流查詢失敗:', countError.message);
      return res.status(500).json({ ok: false, message: GENERIC_ERROR });
    }
    if ((recent ?? 0) >= RATE_LIMIT_MAX) {
      console.error(`subscribe: 觸發限流（${env} 近 10 分鐘 ${recent} 筆）`);
      return res.status(429).json({ ok: false, message: RATE_LIMIT_MESSAGE });
    }

    // ── 寫入名單：email 衝突時不覆寫（ON CONFLICT DO NOTHING） ──
    const { error: insertError } = await sb
      .from(TABLE)
      .upsert({ email, source, env }, { onConflict: 'email', ignoreDuplicates: true })
      .select('id');
    if (insertError) {
      console.error('subscribe: 寫入失敗:', insertError.message);
      return res.status(500).json({ ok: false, message: GENERIC_ERROR });
    }

    const hasKitCredentials = !!apiKey && !!formId;
    if (kitEnabled(VERCEL_ENV, hasKitCredentials)) {
      // ── 原子搶位：只有把 attempted 從 null 改掉的那一個請求能呼叫 Kit ──
      const { data: claimedRows, error: claimError } = await sb
        .from(TABLE)
        .update({ kit_sync_attempted_at: new Date(now()).toISOString() })
        .eq('email', email)
        .is('kit_sync_attempted_at', null)
        .select('id');
      if (claimError) {
        // 搶位失敗時不知道別人有沒有在同步，寧可不呼叫 Kit。
        console.error('subscribe: 搶位失敗，略過 Kit 同步:', claimError.message);
      }
      const claimed = !claimError && Array.isArray(claimedRows) && claimedRows.length > 0;

      if (shouldSyncKit({ vercelEnv: VERCEL_ENV, hasKitCredentials, claimed })) {
        try {
          await deps.callKit(email, apiKey as string, formId as string);
          const { error: markError } = await sb
            .from(TABLE)
            .update({ kit_synced_at: new Date(now()).toISOString() })
            .eq('email', email);
          if (markError) console.error('subscribe: Kit 已同步但標記 kit_synced_at 失敗:', markError.message);
        } catch (e) {
          // 保留 attempted、kit_synced_at 為 null；之後重送不會自動重試，由管理者手動補。
          const message = e instanceof Error ? e.message : String(e);
          console.error('subscribe: Kit 同步失敗:', message);

          const since = new Date(now() - ALERT_THROTTLE_WINDOW_MS).toISOString();
          const { count: otherFailures, error: throttleError } = await sb
            .from(TABLE)
            .select('id', { count: 'exact', head: true })
            .not('kit_sync_attempted_at', 'is', null)
            .is('kit_synced_at', null)
            .gt('kit_sync_attempted_at', since)
            .neq('email', email);
          if (throttleError) console.error('subscribe: 告警節流查詢失敗:', throttleError.message);
          if (throttleError || (otherFailures ?? 0) === 0) {
            await deps.notifyLine(
              `⚠️ 電子報訂閱同步 Kit 失敗\n\n錯誤：${message}\n來源：${source}\n\n` +
                `名單已存進 Supabase。10 分鐘內的後續失敗不再個別通知，` +
                `請查 kit_sync_attempted_at is not null and kit_synced_at is null 的列手動補同步。`
            );
          }
        }
      }
    }

    return res.status(200).json({ ok: true });
  };
}

/** Kit v4：先建立 inactive 訂閱者，再加入 form（form 開啟 double opt-in 時由 Kit 寄確認信）。 */
async function kitSync(email: string, apiKey: string, formId: string): Promise<void> {
  const headers = { 'Content-Type': 'application/json', 'X-Kit-Api-Key': apiKey };

  const created = await fetch(`${KIT_API}/subscribers`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ email_address: email, state: 'inactive' }),
    signal: AbortSignal.timeout(8000),
  });
  if (!created.ok) throw new Error(`Kit create subscriber HTTP ${created.status}`);

  const added = await fetch(`${KIT_API}/forms/${encodeURIComponent(formId)}/subscribers`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ email_address: email }),
    signal: AbortSignal.timeout(8000),
  });
  if (!added.ok) throw new Error(`Kit add to form HTTP ${added.status}`);
}

// 與 keepalive.ts、ecpay-notify.ts 相同的寫法：LINE 推播在各 API 檔案內各自定義，不共用 lib。
// 通知本身失敗不可影響回應，因此吞例外只記錄。
async function linePushAdmin(text: string): Promise<void> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const adminUserId = process.env.ADMIN_LINE_USER_ID;
  if (!token || !adminUserId) return;
  try {
    const r = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ to: adminUserId, messages: [{ type: 'text', text }] }),
    });
    if (!r.ok) console.error('subscribe: LINE 通知 HTTP', r.status);
  } catch (e) {
    console.error('subscribe: LINE 通知發送失敗:', e instanceof Error ? e.message : String(e));
  }
}

export default createHandler({
  getSupabase: () => {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SECRET_KEY;
    return url && key ? createClient(url, key) : null;
  },
  callKit: kitSync,
  notifyLine: linePushAdmin,
  getEnv: () => ({
    VERCEL_ENV: process.env.VERCEL_ENV,
    KIT_API_KEY: process.env.KIT_API_KEY,
    KIT_FORM_ID: process.env.KIT_FORM_ID,
  }),
});
