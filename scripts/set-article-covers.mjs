/**
 * 把 public/article-covers/{slug}.png 的路徑填進 Notion Website DB 的 Image 欄位
 *
 * 使用：node scripts/set-article-covers.mjs
 */

import { Client } from '@notionhq/client';
import { readFileSync, readdirSync } from 'fs';

const envPath = new URL('../.env', import.meta.url).pathname;
readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m && !process.env[m[1].trim()]) process.env[m[1].trim()] = m[2].trim();
});

const notion = new Client({ auth: process.env.NOTION_SECRET });
const databaseId = process.env.NOTION_DATABASE_ID;

const SITE_BASE = 'https://aipm-insider.com';

const covers = readdirSync(new URL('../public/article-covers', import.meta.url))
  .filter(f => f.endsWith('.png'));

console.log(`找到 ${covers.length} 張封面\n`);

for (const file of covers) {
  const slug = file.replace(/\.png$/, '');
  const imageUrl = `${SITE_BASE}/article-covers/${file}`;

  const r = await notion.databases.query({
    database_id: databaseId,
    filter: { property: 'Slug', rich_text: { equals: slug } },
  });

  if (r.results.length === 0) {
    console.log(`✗ ${slug} (Notion 找不到)`);
    continue;
  }

  for (const page of r.results) {
    await notion.pages.update({
      page_id: page.id,
      properties: { Image: { url: imageUrl } },
    });
    console.log(`✓ ${slug} → ${imageUrl}`);
  }
  await new Promise(r => setTimeout(r, 300));
}

console.log('\n完成。');
