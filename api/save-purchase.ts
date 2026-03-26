import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

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

  const { trade_no } = req.body || {};
  if (!trade_no) {
    return res.status(400).json({ error: '缺少訂單編號' });
  }

  // 用 service role 寫入購買紀錄
  const adminClient = createClient(supabaseUrl, supabaseSecretKey);

  // 檢查是否已有紀錄
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
    amount: 699,
    expires_at: expiresAt.toISOString(),
  });

  if (error) {
    console.error('Save purchase error:', error);
    return res.status(500).json({ error: '儲存失敗' });
  }

  return res.status(200).json({ ok: true });
}
