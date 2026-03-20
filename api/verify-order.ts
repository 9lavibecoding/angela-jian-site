import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

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

function generateToken(tradeNo: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(tradeNo).digest('hex').substring(0, 32);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const merchantId = process.env.ECPAY_MERCHANT_ID;
  const hashKey = process.env.ECPAY_HASH_KEY;
  const hashIV = process.env.ECPAY_HASH_IV;
  const isTest = process.env.ECPAY_TEST_MODE === 'true';

  if (!merchantId || !hashKey || !hashIV) {
    return res.status(500).json({ error: '伺服器設定錯誤', valid: false });
  }

  const { trade_no, token } = req.body || {};
  if (!trade_no || typeof trade_no !== 'string') {
    return res.status(400).json({ error: '缺少訂單編號', valid: false });
  }

  // 方法 1：HMAC token 驗證（來自 ecpay-return 的已驗證付款）
  if (token) {
    const expected = generateToken(trade_no, hashKey);
    if (token === expected) {
      console.log('verify-order: token match for', trade_no);
      return res.status(200).json({ valid: true, method: 'token' });
    }
    console.log('verify-order: token mismatch', { received: token, expected });
  }

  // 方法 2：呼叫綠界 QueryTradeInfo（備用，例如用戶重新整理頁面時）
  const params: Record<string, string> = {
    MerchantID: merchantId,
    MerchantTradeNo: trade_no,
    TimeStamp: Math.floor(Date.now() / 1000).toString(),
  };
  params.CheckMacValue = generateCheckMacValue(params, hashKey, hashIV);

  const queryUrl = isTest
    ? 'https://payment-stage.ecpay.com.tw/Cashier/QueryTradeInfo/V5'
    : 'https://payment.ecpay.com.tw/Cashier/QueryTradeInfo/V5';

  try {
    const formBody = Object.entries(params).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
    const ecpayRes = await fetch(queryUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formBody,
    });

    const text = await ecpayRes.text();
    console.log('ECPay QueryTradeInfo response:', text.substring(0, 300));

    const result: Record<string, string> = {};
    text.split('&').forEach(pair => {
      const [k, ...v] = pair.split('=');
      if (k) result[k] = v.join('=');
    });

    if (result.TradeStatus === '1') {
      return res.status(200).json({ valid: true, method: 'query' });
    }

    return res.status(200).json({
      valid: false,
      status: result.TradeStatus,
      msg: result.TradeStatus === '0' ? '尚未付款' : result.TradeStatus === '10200047' ? '查無此交易' : result.TradeStatus,
    });
  } catch (err) {
    console.error('ECPay query error:', err);
    return res.status(200).json({ valid: false, error: 'query_failed' });
  }
}
