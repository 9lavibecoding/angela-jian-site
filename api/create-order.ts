import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { generateCheckMacValue } from './lib/ecpay';

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

  const merchantId = process.env.ECPAY_MERCHANT_ID;
  const hashKey = process.env.ECPAY_HASH_KEY;
  const hashIV = process.env.ECPAY_HASH_IV;
  const isTest = process.env.ECPAY_TEST_MODE === 'true';

  if (!merchantId || !hashKey || !hashIV) {
    return res.status(500).json({ error: '伺服器設定錯誤' });
  }

  // 要求登入：把付款綁定到當前 user，寫入綠界 CustomField1（經 CheckMacValue 簽章、
  // QueryTradeInfo 原樣回傳），供 ecpay-return / save-purchase 驗證付款人身分。
  const supabaseUrl = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    return res.status(500).json({ error: '伺服器設定錯誤' });
  }
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '請先登入' });
  }
  const jwt = authHeader.replace('Bearer ', '');
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
  const { data: { user }, error: authError } = await userClient.auth.getUser(jwt);
  if (authError || !user) {
    return res.status(401).json({ error: '登入驗證失敗' });
  }

  const baseUrl = req.headers.origin || 'https://aipm-insider.com';
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const tradeDate = `${now.getFullYear()}/${pad(now.getMonth() + 1)}/${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  const tradeNo = `IPAS${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  const params: Record<string, string> = {
    MerchantID: merchantId,
    MerchantTradeNo: tradeNo,
    MerchantTradeDate: tradeDate,
    PaymentType: 'aio',
    TotalAmount: '199',
    TradeDesc: 'iPAS AI Exam Bank',
    ItemName: 'iPAS AI 題庫 1000題完整版',
    ReturnURL: `${baseUrl}/api/ecpay-notify`,
    OrderResultURL: `${baseUrl}/api/ecpay-return?trade_no=${tradeNo}`,
    ChoosePayment: 'ALL',
    EncryptType: '1',
    NeedExtraPaidInfo: 'N',
    CustomField1: user.id, // 付款人 user_id（UUID，36 字，未逾綠界 CustomField 50 字上限）
  };

  params.CheckMacValue = generateCheckMacValue(params, hashKey, hashIV);

  const actionUrl = isTest
    ? 'https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5'
    : 'https://payment.ecpay.com.tw/Cashier/AioCheckOut/V5';

  return res.status(200).json({ params, actionUrl, tradeNo });
}
