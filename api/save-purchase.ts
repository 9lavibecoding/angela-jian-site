import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { generateUserToken, queryTradePaid } from './lib/ecpay';

// 付款成功後，前端呼叫此 API 把購買紀錄存到 Supabase
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
    return res.status(500).json({ error: '伺服器設定錯誤' });
  }

  // 驗證用戶 token
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '請先登入' });
  }

  const token = authHeader.replace('Bearer ', '');
  const anonKey = process.env.SUPABASE_ANON_KEY || '';
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });

  const { data: { user }, error: authError } = await userClient.auth.getUser(token);
  if (authError || !user) {
    return res.status(401).json({ error: '登入驗證失敗' });
  }

  const { trade_no, token: paymentToken } = req.body || {};
  if (!trade_no || typeof trade_no !== 'string') {
    return res.status(400).json({ error: '缺少訂單編號' });
  }

  // === 付款驗證：絕不信任前端傳來的 trade_no，必須有付款證明才能寫入 ===
  const merchantId = process.env.ECPAY_MERCHANT_ID;
  const hashKey = process.env.ECPAY_HASH_KEY;
  const hashIV = process.env.ECPAY_HASH_IV;
  const isTest = process.env.ECPAY_TEST_MODE === 'true';
  if (!merchantId || !hashKey || !hashIV) {
    return res.status(500).json({ error: '伺服器設定錯誤' });
  }

  // 方法 1（主路徑）：ecpay-return 於驗過 CheckMacValue + RtnCode=1 後簽發、
  // 綁定 trade_no + 付款人 user_id 的 HMAC token。用當前登入 user.id 重算比對，
  // token 因而無法跨帳號重用（別人的 token 算出來的值不會等於本 user 綁定的 token）。
  let paymentVerified = false;
  if (paymentToken && typeof paymentToken === 'string') {
    paymentVerified = paymentToken === generateUserToken(trade_no, user.id, hashKey);
  }
  // 方法 2（後備）：無有效 token 時，伺服器端獨立向綠界 QueryTradeInfo 確認此訂單已付款，
  // 並以綠界原樣回傳的 CustomField1（付款人 user_id）比對當前 user，防止購買挪用。
  if (!paymentVerified) {
    try {
      const q = await queryTradePaid(trade_no, { merchantId, hashKey, hashIV, isTest });
      if (!q.paid) {
        return res.status(403).json({ error: '付款驗證失敗' });
      }
      if (q.customField1 !== user.id) {
        return res.status(403).json({ error: '此訂單不屬於目前帳號' });
      }
      paymentVerified = true;
    } catch (e) {
      console.error('QueryTradeInfo error:', e);
      return res.status(502).json({ error: '付款驗證暫時無法完成，請稍後再試' });
    }
  }
  if (!paymentVerified) {
    return res.status(403).json({ error: '付款驗證失敗' });
  }

  // 用 service role 寫入購買紀錄
  const adminClient = createClient(supabaseUrl, supabaseSecretKey);

  // 冪等：此用戶已有紀錄，或此 trade_no 已入庫（防重複、防同一訂單綁到別的帳號）
  const { data: existing } = await adminClient
    .from('purchases')
    .select('id')
    .or(`user_id.eq.${user.id},trade_no.eq.${trade_no}`)
    .limit(1);

  if (existing && existing.length > 0) {
    return res.status(200).json({ ok: true, message: '已有購買紀錄' });
  }

  // 6 個月到期日
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 6);

  const { error } = await adminClient.from('purchases').insert({
    user_id: user.id,
    email: user.email,
    trade_no,
    amount: 199,
    expires_at: expiresAt.toISOString(),
  });

  if (error) {
    console.error('Save purchase error:', error);
    return res.status(500).json({ error: '儲存失敗' });
  }

  return res.status(200).json({ ok: true });
}
