import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// ---- LINE API helpers ----

const LINE_API = 'https://api.line.me/v2/bot';

function verifySignature(body: string, signature: string, channelSecret: string): boolean {
  const hash = crypto.createHmac('SHA256', channelSecret).update(body).digest('base64');
  return hash === signature;
}

// Quick Reply 按鈕定義
const QUICK_REPLY_ITEMS = [
  { type: 'action' as const, action: { type: 'message' as const, label: '📊 營收', text: '/sales' } },
  { type: 'action' as const, action: { type: 'message' as const, label: '📋 指令', text: '/help' } },
];

async function replyWithQuickReply(replyToken: string, text: string): Promise<void> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) return;

  await fetch(`${LINE_API}/message/reply`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      replyToken,
      messages: [{
        type: 'text',
        text,
        quickReply: { items: QUICK_REPLY_ITEMS },
      }],
    }),
  });
}

// ---- Supabase ----

function getAdminSupabase() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_SECRET_KEY!;
  return createClient(url, key);
}

// ---- 指令處理 ----

async function handleSales(): Promise<string> {
  const sb = getAdminSupabase();

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [totalRes, monthRes, todayRes, recentRes] = await Promise.all([
    sb.from('purchases').select('amount', { count: 'exact' }),
    sb.from('purchases').select('amount', { count: 'exact' }).gte('created_at', monthStart),
    sb.from('purchases').select('amount', { count: 'exact' }).gte('created_at', todayStart),
    sb.from('purchases').select('email,created_at').order('created_at', { ascending: false }).limit(1),
  ]);

  const totalCount = totalRes.count ?? 0;
  const totalAmount = (totalRes.data ?? []).reduce((s, r) => s + (r.amount || 0), 0);
  const monthCount = monthRes.count ?? 0;
  const monthAmount = (monthRes.data ?? []).reduce((s, r) => s + (r.amount || 0), 0);
  const todayCount = todayRes.count ?? 0;
  const todayAmount = (todayRes.data ?? []).reduce((s, r) => s + (r.amount || 0), 0);

  let recentLine = '';
  if (recentRes.data && recentRes.data.length > 0) {
    const r = recentRes.data[0];
    const ago = timeAgo(new Date(r.created_at));
    recentLine = `\n最近購買：${r.email}（${ago}）`;
  }

  return `📊 營收統計\n今日：NT$${todayAmount.toLocaleString()}（${todayCount} 筆）\n本月：NT$${monthAmount.toLocaleString()}（${monthCount} 筆）\n總計：NT$${totalAmount.toLocaleString()}（${totalCount} 筆）${recentLine}`;
}

function handleHelp(): string {
  return `📋 可用指令\n/sales — 查詢營收統計\n/help — 顯示此說明\n\n也可以直接點下方選單或快捷按鈕`;
}

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '剛剛';
  if (mins < 60) return `${mins} 分鐘前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} 小時前`;
  const days = Math.floor(hours / 24);
  return `${days} 天前`;
}

// ---- Webhook Handler ----

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');

  try {
    const channelSecret = process.env.LINE_CHANNEL_SECRET;
    const adminUserId = process.env.ADMIN_LINE_USER_ID;

    if (!channelSecret) return res.status(500).send('LINE_CHANNEL_SECRET not set');

    // 驗證 LINE signature
    const signature = req.headers['x-line-signature'] as string;
    const bodyStr = JSON.stringify(req.body);

    if (!signature || !verifySignature(bodyStr, signature, channelSecret)) {
      return res.status(401).send('Invalid signature');
    }

    const events = req.body?.events || [];

    for (const event of events) {
      if (event.type !== 'message' || event.message?.type !== 'text') continue;

      const userId = event.source?.userId;
      const text = (event.message.text || '').trim().toLowerCase();
      const replyToken = event.replyToken;

      // 如果還沒設定 ADMIN_LINE_USER_ID，先回傳 userId 讓管理者設定
      if (!adminUserId) {
        await replyWithQuickReply(replyToken, `你的 LINE User ID：\n${userId}\n\n請將此值設為 Vercel 環境變數 ADMIN_LINE_USER_ID`);
        continue;
      }

      // 非管理者不回應
      if (userId !== adminUserId) continue;

      // 指令路由
      let reply: string;
      try {
        switch (text) {
          case '/sales':
            reply = await handleSales();
            break;
          case '/help':
            reply = handleHelp();
            break;
          default:
            reply = '未知指令，傳 /help 查看可用指令';
        }
      } catch (err) {
        console.error('Command error:', err);
        reply = '⚠️ 執行錯誤，請稍後再試';
      }

      await replyWithQuickReply(replyToken, reply);
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Webhook error:', err);
    return res.status(200).json({ ok: true });
  }
}
