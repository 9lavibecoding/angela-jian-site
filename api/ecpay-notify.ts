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

// 一對一諮詢商品：依 MerchantTradeNo 前綴判斷是哪個服務，供 LINE 通知文字使用。
const CONSULTING_LABELS: Record<string, string> = {
  CTRN: '企業內訓／顧問諮詢',
  CRES: '履歷／作品集健檢',
  CCAR: '職涯諮詢／轉職陪跑',
};

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
    const consultingLabel = CONSULTING_LABELS[String(body.MerchantTradeNo || '').substring(0, 4)];
    // 買家 email 由 create-order 放進 CustomField1 一路帶回來，是目前唯一能聯繫到買家的管道
    const buyerEmail = String(body.CustomField1 || '').trim();
    const emailLine = buyerEmail ? `\n買家 ${buyerEmail}` : '\n買家 （結帳時未留 email）';

    // 先把付款事實落地，與客人是否登入無關。
    // 這是綠界的 server-to-server 回呼，不受客人關掉分頁或登入失敗影響。
    let pendingWarning = '';
    const sbUrl = process.env.SUPABASE_URL;
    const sbKey = process.env.SUPABASE_SECRET_KEY;
    if (sbUrl && sbKey) {
      try {
        const sb = createClient(sbUrl, sbKey);
        const { error } = await sb.from('pending_purchases').upsert({
          trade_no: body.MerchantTradeNo,
          email: buyerEmail || null,
          amount: parseInt(String(body.TradeAmt || '0'), 10) || null,
        }, { onConflict: 'trade_no' });
        if (error) throw new Error(error.message);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error('ECPay notify: pending_purchases 寫入失敗:', msg);
        pendingWarning = `\n⚠️ 訂單未能存入資料庫（${msg}），請手動處理`;
      }
    }

    if (adminUserId) {
      try {
        if (consultingLabel) {
          await linePush(adminUserId, `🎉 新的諮詢預約付款！\n服務：${consultingLabel}\n訂單 ${body.MerchantTradeNo}${emailLine}${pendingWarning}`);
        } else {
          const supabaseUrl = process.env.SUPABASE_URL;
          const supabaseKey = process.env.SUPABASE_SECRET_KEY;
          let totalLine = '';
          if (supabaseUrl && supabaseKey) {
            const sb = createClient(supabaseUrl, supabaseKey);
            // supabase-js 查詢失敗時回傳 error 而非拋例外。不檢查的話 count 會是 null，
            // 訊息就會顯示成「累計第 1 位」這種假數字（2026-08-27 曾因此誤導判斷）。
            const { count, error } = await sb.from('purchases').select('*', { count: 'exact', head: true });
            if (error) {
              console.error('ECPay notify: 查詢購買人數失敗:', error.message);
              totalLine = '\n（累計人數查詢失敗，資料庫可能異常）';
            } else {
              totalLine = `\n累計第 ${(count ?? 0) + 1} 位購買者`;
            }
          }
          await linePush(adminUserId, `🎉 新購買！\n訂單 ${body.MerchantTradeNo}${emailLine}${totalLine}${pendingWarning}`);
        }
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
