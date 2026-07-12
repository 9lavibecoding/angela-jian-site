import crypto from 'crypto';

// 綠界 CheckMacValue 產生器（原本複製於 create-order / ecpay-notify / ecpay-return / verify-order，抽出共用）
export function generateCheckMacValue(params: Record<string, string>, hashKey: string, hashIV: string): string {
  // 1. 按 key 排序
  const sorted = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('&');
  // 2. 前後加 HashKey / HashIV
  const raw = `HashKey=${hashKey}&${sorted}&HashIV=${hashIV}`;
  // 3. URL encode → 小寫
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
  // 4. SHA256 → 大寫
  return crypto.createHash('sha256').update(encoded).digest('hex').toUpperCase();
}

// 已驗證付款的 HMAC token（僅 verify-order 這個 legacy 端點使用）。只綁 trade_no。
export function generateToken(tradeNo: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(tradeNo).digest('hex').substring(0, 32);
}

// 已驗證付款的 HMAC token（ecpay-return 簽發、save-purchase 驗證）。
// 同時綁定 trade_no + user_id，使 token 無法跨帳號重用。
export function generateUserToken(tradeNo: string, userId: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(`${tradeNo}:${userId}`).digest('hex').substring(0, 32);
}

// 向綠界 QueryTradeInfo 查詢某訂單是否已付款成功（TradeStatus === '1'）。
// 用於伺服器端獨立確認付款，不信任前端傳來的 trade_no。
// 回傳付款狀態與綠界原樣回傳的 CustomField1（create-order 寫入的 user_id，經 CheckMacValue 簽章、可信通道）。
export async function queryTradePaid(
  tradeNo: string,
  opts: { merchantId: string; hashKey: string; hashIV: string; isTest: boolean }
): Promise<{ paid: boolean; customField1: string }> {
  const params: Record<string, string> = {
    MerchantID: opts.merchantId,
    MerchantTradeNo: tradeNo,
    TimeStamp: Math.floor(Date.now() / 1000).toString(),
  };
  params.CheckMacValue = generateCheckMacValue(params, opts.hashKey, opts.hashIV);

  const queryUrl = opts.isTest
    ? 'https://payment-stage.ecpay.com.tw/Cashier/QueryTradeInfo/V5'
    : 'https://payment.ecpay.com.tw/Cashier/QueryTradeInfo/V5';

  const formBody = Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  const ecpayRes = await fetch(queryUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formBody,
  });

  const text = await ecpayRes.text();
  const result: Record<string, string> = {};
  text.split('&').forEach(pair => {
    const [k, ...v] = pair.split('=');
    if (k) result[k] = v.join('=');
  });

  return { paid: result.TradeStatus === '1', customField1: result.CustomField1 || '' };
}
