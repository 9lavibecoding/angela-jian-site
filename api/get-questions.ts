import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
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

  // 取得用戶資訊
  const { data: { user }, error: authError } = await userClient.auth.getUser(token);
  if (authError || !user) {
    return res.status(401).json({ error: '登入驗證失敗' });
  }

  // 用 service role 檢查購買紀錄
  const adminClient = createClient(supabaseUrl, supabaseSecretKey);
  const { data: purchases } = await adminClient
    .from('purchases')
    .select('id')
    .eq('user_id', user.id)
    .limit(1);

  if (!purchases || purchases.length === 0) {
    return res.status(403).json({ error: '尚未購買題庫' });
  }

  // 拉取題目
  const { chapter } = req.body || {};
  let query = adminClient.from('questions').select('id, chapter, difficulty, question, options, answer, explanation');

  if (chapter && ['L11', 'L12', 'MIX'].includes(chapter)) {
    query = query.eq('chapter', chapter);
  }

  const { data: questions, error } = await query.order('id');
  if (error) {
    return res.status(500).json({ error: '題目載入失敗' });
  }

  return res.status(200).json({ questions });
}
