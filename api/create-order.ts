import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

function generateCheckMacValue(params: Record<string, string>, hashKey: string, hashIV: string): string {
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const allowedOrigins = ['https://aipm-insider.com', 'https://aipm-insider.vercel.app'];
  const origin = req.headers.origin || '';
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const merchantId = process.env.ECPAY_MERCHANT_ID;
  const hashKey = process.env.ECPAY_HASH_KEY;
  const hashIV = process.env.ECPAY_HASH_IV;
  const isTest = process.env.ECPAY_TEST_MODE === 'true';

  if (!merchantId || !hashKey || !hashIV) {
    return res.status(500).json({ error: '伺服器設定錯誤' });
  }

  const origin = req.headers.origin || 'https://aipm-insider.vercel.app';
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const tradeDate = `${now.getFullYear()}/${pad(now.getMonth() + 1)}/${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  const tradeNo = `IPAS${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  const params: Record<string, string> = {
    MerchantID: merchantId,
    MerchantTradeNo: tradeNo,
    MerchantTradeDate: tradeDate,
    PaymentType: 'aio',
    TotalAmount: '699',
    TradeDesc: 'iPAS AI Exam Bank',
    ItemName: 'iPAS AI 題庫 1000題完整版',
    ReturnURL: `${origin}/api/ecpay-notify`,
    OrderResultURL: `${origin}/api/ecpay-return?trade_no=${tradeNo}`,
    ChoosePayment: 'ALL',
    EncryptType: '1',
    NeedExtraPaidInfo: 'N',
  };

  params.CheckMacValue = generateCheckMacValue(params, hashKey, hashIV);

  const actionUrl = isTest
    ? 'https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5'
    : 'https://payment.ecpay.com.tw/Cashier/AioCheckOut/V5';

  return res.status(200).json({ params, actionUrl, tradeNo });
}
