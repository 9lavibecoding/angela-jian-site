import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

/**
 * 付款成功後，前端呼叫此 API 把購買紀錄存到 Supabase。
 *
 * 寫入這張表等同發放題庫權限（get-questions.ts 只檢查有沒有 user_id 對應的紀錄），
 * 所以寫入前必須確認這筆 trade_no 真的付過款，且尚未被別人認領。
 */

function generateCheckMacValue(params: Record<string, string>, hashKey: string, hashIV: string): string {
  const sorted = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('&');
  const raw = `HashKey=${hashKey}&${sorted}&HashIV=${hashIV}`;
  const encoded = encodeURIComponent(raw)
    .toLowerCase()
    .replace(/%2d/g, '-').replace(/%5f/g, '_').replace(/%2e/g, '.')
    .replace(/%21/g, '!').replace(/%2a/g, '*').replace(/%28/g, '(')
    .replace(/%29/g, ')').replace(/%20/g, '+');
  return crypto.createHash('sha256').update(encoded).digest('hex').toUpperCase();
}

function expectedToken(tradeNo: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(tradeNo).digest('hex').substring(0, 32);
}

/** 定長比對，避免以回應時間逐字元試出 token。 */
function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

/** 備援驗證：token 遺失或不符時，直接向綠界查證這筆訂單是否真的付款成功。 */
async function paidAccordingToEcpay(tradeNo: string): Promise<boolean> {
  const merchantId = process.env.ECPAY_MERCHANT_ID;
  const hashKey = process.env.ECPAY_HASH_KEY;
  const hashIV = process.env.ECPAY_HASH_IV;
  if (!merchantId || !hashKey || !hashIV) return false;

  const params: Record<string, string> = {
    MerchantID: merchantId,
    MerchantTradeNo: tradeNo,
    TimeStamp: Math.floor(Date.now() / 1000).toString(),
  };
  params.CheckMacValue = generateCheckMacValue(params, hashKey, hashIV);

  const queryUrl = process.env.ECPAY_TEST_MODE === 'true'
    ? 'https://payment-stage.ecpay.com.tw/Cashier/QueryTradeInfo/V5'
    : 'https://payment.ecpay.com.tw/Cashier/QueryTradeInfo/V5';

  try {
    const body = Object.entries(params)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
    const r = await fetch(queryUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    const text = await r.text();
    const result: Record<string, string> = {};
    text.split('&').forEach(pair => {
      const [k, ...v] = pair.split('=');
      if (k) result[k] = decodeURIComponent(v.join('='));
    });
    return result.TradeStatus === '1';
  } catch (e) {
    console.error('save-purchase: 綠界查詢失敗:', e instanceof Error ? e.message : String(e));
    return false;
  }
}

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
  const hashKey = process.env.ECPAY_HASH_KEY;
  if (!supabaseUrl || !supabaseSecretKey || !hashKey) {
    console.error('save-purchase: 環境變數不完整');
    return res.status(500).json({ error: '伺服器設定錯誤' });
  }

  // 驗證用戶 token
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
  if (authError || !user) {
    return res.status(401).json({ error: '登入驗證失敗' });
  }

  const { trade_no, token } = req.body || {};
  if (!trade_no || typeof trade_no !== 'string') {
    return res.status(400).json({ error: '缺少訂單編號' });
  }

  // 驗證這筆訂單真的付過款。先比對 ecpay-return 發出的 HMAC token，
  // 沒帶或不符時再向綠界查證，避免使用者重整頁面弄丟 token 就拿不到權限。
  let verified = typeof token === 'string' && token.length > 0
    && safeEqual(token, expectedToken(trade_no, hashKey));
  if (!verified) {
    verified = await paidAccordingToEcpay(trade_no);
  }
  if (!verified) {
    console.warn('save-purchase: 訂單驗證失敗', { trade_no, user_id: user.id });
    return res.status(403).json({ error: '訂單驗證失敗，請確認付款是否完成' });
  }

  const adminClient = createClient(supabaseUrl, supabaseSecretKey);

  // 同一筆訂單只能開通一個帳號，否則付款連結被轉傳就能無限開通。
  const { data: claimed, error: claimedError } = await adminClient
    .from('purchases')
    .select('user_id')
    .eq('trade_no', trade_no)
    .limit(1);
  if (claimedError) {
    console.error('save-purchase: 查詢訂單歸屬失敗:', claimedError.message);
    return res.status(500).json({ error: '儲存失敗' });
  }
  if (claimed && claimed.length > 0) {
    if (claimed[0].user_id === user.id) {
      return res.status(200).json({ ok: true, message: '已有購買紀錄' });
    }
    console.warn('save-purchase: 訂單已被其他帳號認領', { trade_no, user_id: user.id });
    return res.status(409).json({ error: '這筆訂單已綁定其他帳號' });
  }

  // 同一個帳號已有有效紀錄就不重複寫入
  const { data: existing } = await adminClient
    .from('purchases')
    .select('id')
    .eq('user_id', user.id)
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
