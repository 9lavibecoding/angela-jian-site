import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

async function linePush(userId: string, text: string): Promise<void> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) return;
  await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ to: userId, messages: [{ type: 'text', text }] }),
  });
}

function generateCheckMacValue(params: Record<string, string>, hashKey: string, hashIV: string): string {
  const sorted = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('&');
  const raw = `HashKey=${hashKey}&${sorted}&HashIV=${hashIV}`;
  const encoded = encodeURIComponent(raw)
    .toLowerCase()
    .replace(/%2d/g, '-')
    .replace(/%5f/g, '_')
    .replace(/%2e/g, '.')
    .replace(/%21/g, '!')
    .replace(/%2a/g, '*')
    .replace(/%28/g, '(')
    .replace(/%29/g, ')')
    .replace(/%20/g, '+');
  return crypto.createHash('sha256').update(encoded).digest('hex').toUpperCase();
}

// 綠界 server-to-server 付款結果通知
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');

  const hashKey = process.env.ECPAY_HASH_KEY;
  const hashIV = process.env.ECPAY_HASH_IV;
  if (!hashKey || !hashIV) return res.status(500).send('0|Server error');

  const body = req.body || {};
  const receivedMac = body.CheckMacValue;

  // 驗證 CheckMacValue
  const paramsToVerify: Record<string, string> = {};
  for (const key of Object.keys(body)) {
    if (key !== 'CheckMacValue') {
      paramsToVerify[key] = body[key];
    }
  }

  const computedMac = generateCheckMacValue(paramsToVerify, hashKey, hashIV);
  if (computedMac !== receivedMac) {
    console.error('ECPay notify: CheckMacValue mismatch', { received: receivedMac, computed: computedMac });
    return res.status(200).send('0|CheckMacValue Error');
  }

  // RtnCode=1 表示付款成功
  if (body.RtnCode === '1') {
    console.log('ECPay payment success:', body.MerchantTradeNo);

    // LINE 推播通知管理者
    const adminUserId = process.env.ADMIN_LINE_USER_ID;
    if (adminUserId) {
      try {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SECRET_KEY;
        let totalLine = '';
        if (supabaseUrl && supabaseKey) {
          const sb = createClient(supabaseUrl, supabaseKey);
          const { count } = await sb.from('purchases').select('*', { count: 'exact', head: true });
          totalLine = `\n累計第 ${(count ?? 0) + 1} 位購買者`;
        }
        await linePush(adminUserId, `🎉 新購買！\n訂單 ${body.MerchantTradeNo}${totalLine}`);
      } catch (e) {
        console.error('LINE push notification error:', e);
      }
    }
  } else {
    console.log('ECPay payment failed:', body.MerchantTradeNo, body.RtnMsg);
  }

  // 綠界要求回傳 1|OK
  return res.status(200).send('1|OK');
}
