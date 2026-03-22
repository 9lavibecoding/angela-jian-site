/**
 * Supabase 初始化腳本
 * 1. 建立 questions 和 purchases 表
 * 2. 上傳 1000 題到 questions 表
 *
 * 使用：node scripts/setup-supabase.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

// 讀取 .env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '.env');
const env = {};
readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim();
});

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY);

async function createTables() {
  console.log('建立資料表...');

  // 建 questions 表
  const { error: e1 } = await supabase.rpc('', {}).catch(() => ({}));

  // 用 SQL 建表
  const { error: sqlError } = await supabase.from('_dummy_').select().limit(0).catch(() => ({}));

  // 直接用 REST API 執行 SQL
  const sqlStatements = `
    -- Questions 表
    CREATE TABLE IF NOT EXISTS public.questions (
      id INTEGER PRIMARY KEY,
      chapter TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      question TEXT NOT NULL,
      options JSONB NOT NULL,
      answer TEXT NOT NULL,
      explanation TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Purchases 表
    CREATE TABLE IF NOT EXISTS public.purchases (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id),
      email TEXT,
      trade_no TEXT,
      amount INTEGER,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- 開啟 RLS
    ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

    -- Questions: 已驗證的用戶 + 有購買紀錄的才能讀
    CREATE POLICY IF NOT EXISTS "Authenticated users with purchase can read questions"
      ON public.questions FOR SELECT
      TO authenticated
      USING (
        EXISTS (SELECT 1 FROM public.purchases WHERE user_id = auth.uid())
      );

    -- Purchases: 用戶只能讀自己的紀錄
    CREATE POLICY IF NOT EXISTS "Users can read own purchases"
      ON public.purchases FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());

    -- Service role 可以寫入（用於 API）
    CREATE POLICY IF NOT EXISTS "Service role can insert purchases"
      ON public.purchases FOR INSERT
      TO service_role
      WITH CHECK (true);
  `;

  // 透過 Supabase 的 pg_net 執行 SQL 比較複雜，改用直接的方式
  console.log('\n請到 Supabase Dashboard → SQL Editor，貼上以下 SQL 執行：');
  console.log('='.repeat(60));
  console.log(sqlStatements);
  console.log('='.repeat(60));
  console.log('\n執行完後再跑一次此腳本加上 --upload 參數上傳題目');
}

async function uploadQuestions() {
  console.log('讀取題目...');
  const examDir = path.join(__dirname, '..', 'src', 'data', 'exam');
  const files = readdirSync(examDir).filter(f => f.endsWith('.json'));

  const allQuestions = [];
  const seen = new Set();
  for (const f of files) {
    const data = JSON.parse(readFileSync(path.join(examDir, f), 'utf8'));
    for (const q of data) {
      if (!seen.has(q.id)) {
        seen.add(q.id);
        allQuestions.push({
          id: q.id,
          chapter: q.chapter,
          difficulty: q.difficulty,
          question: q.question,
          options: q.options,
          answer: q.answer,
          explanation: q.explanation,
        });
      }
    }
  }
  console.log(`共 ${allQuestions.length} 題，開始上傳...`);

  // 分批上傳（每批 100 筆）
  for (let i = 0; i < allQuestions.length; i += 100) {
    const batch = allQuestions.slice(i, i + 100);
    const { error } = await supabase.from('questions').upsert(batch, { onConflict: 'id' });
    if (error) {
      console.error(`批次 ${i}-${i + batch.length} 上傳失敗:`, error.message);
    } else {
      console.log(`已上傳 ${Math.min(i + 100, allQuestions.length)} / ${allQuestions.length}`);
    }
  }

  // 驗證
  const { count } = await supabase.from('questions').select('*', { count: 'exact', head: true });
  console.log(`\n上傳完成！資料庫中共 ${count} 題`);
}

// 主程式
const args = process.argv.slice(2);
if (args.includes('--upload')) {
  uploadQuestions().catch(console.error);
} else {
  createTables().catch(console.error);
}
