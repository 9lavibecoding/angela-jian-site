/**
 * 將 drafts/notion-batch/*.md 上傳到 Notion Website database
 *
 * 使用方式：
 *   node scripts/upload-articles-to-notion.mjs           # 全部上傳（Published=false）
 *   node scripts/upload-articles-to-notion.mjs --dry-run # 只解析、不上傳
 *   node scripts/upload-articles-to-notion.mjs 01        # 只上傳檔名以 01 開頭的
 */

import { Client } from '@notionhq/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

const envPath = new URL('../.env', import.meta.url).pathname;
readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m && !process.env[m[1].trim()]) process.env[m[1].trim()] = m[2].trim();
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DRAFT_DIR = path.join(__dirname, '..', 'drafts', 'notion-batch');

const notion = new Client({ auth: process.env.NOTION_SECRET });
const databaseId = process.env.NOTION_DATABASE_ID;
if (!databaseId) { console.error('NOTION_DATABASE_ID 未設定'); process.exit(1); }

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const filterPrefix = args.find(a => !a.startsWith('--'));

// ---- frontmatter 解析 ----
function parseMd(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error(`Invalid frontmatter: ${filePath}`);
  const fm = {};
  match[1].split('\n').forEach(line => {
    const m = line.match(/^(\w+):\s*"?(.*?)"?\s*$/);
    if (m) fm[m[1]] = m[2];
  });
  return { ...fm, body: match[2].trim() };
}

// ---- inline markdown → Notion rich_text ----
function parseRichText(text) {
  const parts = [];
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
  let lastIdx = 0;
  let m;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > lastIdx) parts.push({ type: 'text', text: { content: text.slice(lastIdx, m.index) } });
    if (m[2]) parts.push({ type: 'text', text: { content: m[2] }, annotations: { bold: true } });
    else if (m[3]) parts.push({ type: 'text', text: { content: m[3] }, annotations: { italic: true } });
    else if (m[4]) parts.push({ type: 'text', text: { content: m[4] }, annotations: { code: true } });
    lastIdx = m.index + m[0].length;
  }
  if (lastIdx < text.length) parts.push({ type: 'text', text: { content: text.slice(lastIdx) } });
  return parts.length ? parts : [{ type: 'text', text: { content: text } }];
}

// ---- Markdown → Notion blocks ----
function markdownToBlocks(md) {
  const blocks = [];
  const lines = md.split('\n');
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === '') { i++; continue; }
    if (line.trim() === '---') { blocks.push({ object: 'block', type: 'divider', divider: {} }); i++; continue; }

    const h3 = line.match(/^### (.+)/);
    if (h3) { blocks.push({ object: 'block', type: 'heading_3', heading_3: { rich_text: parseRichText(h3[1]) } }); i++; continue; }
    const h2 = line.match(/^## (.+)/);
    if (h2) { blocks.push({ object: 'block', type: 'heading_2', heading_2: { rich_text: parseRichText(h2[1]) } }); i++; continue; }
    const h1 = line.match(/^# (.+)/);
    if (h1) { blocks.push({ object: 'block', type: 'heading_1', heading_1: { rich_text: parseRichText(h1[1]) } }); i++; continue; }

    if (line.startsWith('> ')) {
      const q = [];
      while (i < lines.length && lines[i].startsWith('> ')) { q.push(lines[i].replace(/^> /, '')); i++; }
      blocks.push({ object: 'block', type: 'quote', quote: { rich_text: parseRichText(q.join('\n')) } });
      continue;
    }

    if (line.includes('|') && line.trim().startsWith('|')) {
      const rows = [];
      while (i < lines.length && lines[i].includes('|') && lines[i].trim().startsWith('|')) {
        const cells = lines[i].split('|').filter(c => c.trim() !== '').map(c => c.trim());
        if (!/^[-: ]+$/.test(cells[0])) rows.push(cells);
        i++;
      }
      if (rows.length > 0) {
        const width = Math.max(...rows.map(r => r.length));
        blocks.push({
          object: 'block', type: 'table',
          table: {
            table_width: width, has_column_header: true,
            children: rows.map(row => ({
              type: 'table_row',
              table_row: { cells: Array.from({ length: width }, (_, j) => parseRichText((row[j] || '').substring(0, 2000))) }
            }))
          }
        });
      }
      continue;
    }

    if (line.match(/^[-*] /)) {
      blocks.push({ object: 'block', type: 'bulleted_list_item', bulleted_list_item: { rich_text: parseRichText(line.replace(/^[-*] /, '')) } });
      i++; continue;
    }
    if (line.match(/^\d+\. /)) {
      blocks.push({ object: 'block', type: 'numbered_list_item', numbered_list_item: { rich_text: parseRichText(line.replace(/^\d+\. /, '')) } });
      i++; continue;
    }

    const content = line.substring(0, 2000);
    blocks.push({ object: 'block', type: 'paragraph', paragraph: { rich_text: parseRichText(content) } });
    i++;
  }
  return blocks;
}

// ---- 主程式 ----
async function main() {
  let files = fs.readdirSync(DRAFT_DIR).filter(f => f.endsWith('.md')).sort();
  if (filterPrefix) files = files.filter(f => f.startsWith(filterPrefix));
  console.log(`找到 ${files.length} 篇文章${dryRun ? '（DRY RUN）' : ''}\n`);

  for (const file of files) {
    const art = parseMd(path.join(DRAFT_DIR, file));
    const blocks = markdownToBlocks(art.body);
    const tags = (art.tags || '').split(',').map(t => t.trim()).filter(Boolean);

    if (dryRun) {
      console.log(`[DRY] ${art.title}`);
      console.log(`      slug=${art.slug}  tags=[${tags.join(', ')}]  blocks=${blocks.length}`);
      continue;
    }

    try {
      // upsert: archive existing page with same slug
      const existing = await notion.databases.query({
        database_id: databaseId,
        filter: { property: 'Slug', rich_text: { equals: art.slug } },
      });
      for (const old of existing.results) {
        await notion.pages.update({ page_id: old.id, archived: true });
        console.log(`  ↻ archived old page ${old.id}`);
      }

      const firstBatch = blocks.slice(0, 100);
      const page = await notion.pages.create({
        parent: { database_id: databaseId },
        properties: {
          'Title': { title: [{ text: { content: art.title } }] },
          'Slug': { rich_text: [{ text: { content: art.slug } }] },
          'Summary': { rich_text: [{ text: { content: (art.summary || '').substring(0, 2000) } }] },
          'Date': { date: { start: art.date } },
          'Tag': { multi_select: tags.map(name => ({ name })) },
          'Published': { checkbox: false },
        },
        children: firstBatch,
      });
      for (let j = 100; j < blocks.length; j += 100) {
        await notion.blocks.children.append({ block_id: page.id, children: blocks.slice(j, j + 100) });
      }
      console.log(`✓ ${art.title}`);
      console.log(`  → ${page.url}`);
    } catch (err) {
      console.error(`✗ ${art.title}: ${err.message}`);
    }
    await new Promise(r => setTimeout(r, 400));
  }
  console.log('\n完成。預設 Published=false，去 Notion 審稿後再勾發布。');
}

main().catch(console.error);
