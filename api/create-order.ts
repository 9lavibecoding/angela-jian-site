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

// 一對一諮詢商品白名單。金額為暫定佔位數字，正式定價後在這裡改。
const CONSULTING_PRODUCTS: Record<string, { amount: string; itemName: string; tradeDesc: string; prefix: string }> = {
  consult_training: { amount: '3000', itemName: '企業內訓／顧問諮詢', tradeDesc: 'AI PM Insider Consulting - Training', prefix: 'CTRN' },
  consult_resume: { amount: '1500', itemName: '履歷／作品集健檢', tradeDesc: 'AI PM Insider Consulting - Resume', prefix: 'CRES' },
  consult_career: { amount: '2000', itemName: '職涯諮詢／轉職陪跑', tradeDesc: 'AI PM Insider Consulting - Career', prefix: 'CCAR' },
};

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

  // 買家 email：用於後續聯繫與補發權限。綠界 CustomField1 上限 50 字。
  // 刻意設計成「格式不對就略過」而非退回錯誤 —— 收不到 email 是小事，擋住成交是大事。
  const rawEmail = (req.body && typeof req.body.email === 'string') ? req.body.email.trim() : '';
  const buyerEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail) && rawEmail.length <= 50 ? rawEmail : '';
  if (rawEmail && !buyerEmail) {
    console.warn('create-order: email 格式不符或過長，本筆訂單不帶入買家資訊');
  }

  const productKey = (req.body && req.body.product) || 'exam';
  const consultingProduct = productKey !== 'exam' ? CONSULTING_PRODUCTS[productKey] : undefined;
  if (productKey !== 'exam' && !consultingProduct) {
    return res.status(400).json({ error: '不明的商品代碼' });
  }

  const baseUrl = req.headers.origin || 'https://aipm-insider.com';
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const tradeDate = `${now.getFullYear()}/${pad(now.getMonth() + 1)}/${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  const tradePrefix = consultingProduct ? consultingProduct.prefix : 'IPAS';
  const tradeNo = `${tradePrefix}${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  const params: Record<string, string> = {
    MerchantID: merchantId,
    MerchantTradeNo: tradeNo,
    MerchantTradeDate: tradeDate,
    PaymentType: 'aio',
    TotalAmount: consultingProduct ? consultingProduct.amount : '199',
    TradeDesc: consultingProduct ? consultingProduct.tradeDesc : 'iPAS AI Exam Bank',
    ItemName: consultingProduct ? consultingProduct.itemName : 'iPAS AI 題庫 1000題完整版',
    ReturnURL: `${baseUrl}/api/ecpay-notify`,
    OrderResultURL: `${baseUrl}/api/ecpay-return?trade_no=${tradeNo}`,
    ChoosePayment: 'ALL',
    EncryptType: '1',
    NeedExtraPaidInfo: 'N',
  };

  // 帶著訂單一路傳到 ecpay-notify，讓成交通知能直接顯示買家 email
  if (buyerEmail) {
    params.CustomField1 = buyerEmail;
  }

  params.CheckMacValue = generateCheckMacValue(params, hashKey, hashIV);

  const actionUrl = isTest
    ? 'https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5'
    : 'https://payment.ecpay.com.tw/Cashier/AioCheckOut/V5';

  return res.status(200).json({ params, actionUrl, tradeNo });
}
