import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

/**
 * 以登入用的 email 認領已付款但尚未開通的訂單。
 *
 * 綠界付款成功時，api/ecpay-notify.ts 會先把訂單寫進 pending_purchases（與登入無關）。
 * 客人之後用結帳時填的同一個 email 登入，就能靠這支自動拿回權限，
 * 不必依賴付款當下那條帶 token 的網址。
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const allowedOrigins = ['https://aipm-insider.com', 'https://aipm-insider.vercel.app'];
  const origin = req.headers.origin || '';
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;
  if (!supabaseUrl || !supabaseSecretKey) {
    console.error('claim-purchase: 環境變數不完整');
    return res.status(500).json({ error: '伺服器設定錯誤' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '請先登入' });
  }

  const accessToken = authHeader.replace('Bearer ', '');
  const anonKey = process.env.SUPABASE_ANON_KEY || '';
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } }
  });

  const { data: { user }, error: authError } = await userClient.auth.getUser(accessToken);
  if (authError || !user || !user.email) {
    return res.status(401).json({ error: '登入驗證失敗' });
  }

  const adminClient = createClient(supabaseUrl, supabaseSecretKey);
  const email = user.email.toLowerCase();

  // 已經有權限就不用認領
  const { data: existing } = await adminClient
    .from('purchases')
    .select('id')
    .eq('user_id', user.id)
    .limit(1);
  if (existing && existing.length > 0) {
    return res.status(200).json({ ok: true, message: '已有購買紀錄' });
  }

  // 找出這個 email 名下最早一筆尚未認領的付款
  const { data: pending, error: pendingError } = await adminClient
    .from('pending_purchases')
    .select('trade_no, amount')
    .ilike('email', email)
    .is('claimed_at', null)
    .order('paid_at', { ascending: true })
    .limit(1);

  if (pendingError) {
    console.error('claim-purchase: 查詢待認領訂單失敗:', pendingError.message);
    return res.status(500).json({ error: '查詢失敗' });
  }
  if (!pending || pending.length === 0) {
    return res.status(404).json({ error: '找不到與這個帳號 email 相符的付款紀錄' });
  }

  const order = pending[0];
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 6);

  const { error: insertError } = await adminClient.from('purchases').insert({
    user_id: user.id,
    email: user.email,
    trade_no: order.trade_no,
    amount: order.amount ?? 199,
    expires_at: expiresAt.toISOString(),
  });

  if (insertError) {
    // trade_no 的 unique index 會擋下同時送出的重複認領，這裡視為已被認領。
    console.error('claim-purchase: 寫入購買紀錄失敗:', insertError.message);
    return res.status(409).json({ error: '這筆訂單已被認領' });
  }

  const { error: markError } = await adminClient
    .from('pending_purchases')
    .update({ claimed_at: new Date().toISOString(), claimed_by: user.id })
    .eq('trade_no', order.trade_no);
  if (markError) {
    // 權限已經發出去了，標記失敗只影響後台檢視，不該讓客人看到錯誤。
    console.error('claim-purchase: 標記已認領失敗:', markError.message);
  }

  console.log('claim-purchase: 已認領', { trade_no: order.trade_no, user_id: user.id });
  return res.status(200).json({ ok: true, trade_no: order.trade_no });
}
