/**
 * 將 51 篇 iPAS 課程從本地 Markdown 上傳到 Notion database
 *
 * 使用方式：
 * 1. 先在 Notion 建立一個空白頁面（作為 database 的父頁面）
 * 2. 設定環境變數 NOTION_SECRET 和 NOTION_IPAS_PARENT_PAGE_ID
 * 3. node scripts/upload-ipas-to-notion.mjs
 */

import { Client } from '@notionhq/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
// 手動讀取 .env
import { readFileSync } from 'fs';
const envPath = new URL('../.env', import.meta.url).pathname;
readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m && !process.env[m[1].trim()]) process.env[m[1].trim()] = m[2].trim();
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = path.join(__dirname, '..', 'src', 'content', 'ipas');

const notion = new Client({ auth: process.env.NOTION_SECRET });
const parentPageId = process.env.NOTION_IPAS_PARENT_PAGE_ID;

if (!parentPageId) {
  console.error('請設定 NOTION_IPAS_PARENT_PAGE_ID 環境變數（Notion 父頁面 ID）');
  process.exit(1);
}

// ---- 解析 Markdown frontmatter ----
function parseMd(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error(`Invalid frontmatter: ${filePath}`);

  const frontmatter = {};
  match[1].split('\n').forEach(line => {
    const m = line.match(/^(\w+):\s*"?(.*?)"?\s*$/);
    if (m) frontmatter[m[1]] = isNaN(m[2]) ? m[2] : Number(m[2]);
  });

  return { ...frontmatter, body: match[2].trim(), slug: path.basename(filePath, '.md') };
}

// ---- Markdown 內文 → Notion rich_text array（解析 **bold**、*italic*、`code`）----
function parseRichText(text) {
  const parts = [];
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
  let lastIdx = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      parts.push({ type: 'text', text: { content: text.slice(lastIdx, match.index) } });
    }
    if (match[2]) {
      // **bold**
      parts.push({ type: 'text', text: { content: match[2] }, annotations: { bold: true } });
    } else if (match[3]) {
      // *italic*
      parts.push({ type: 'text', text: { content: match[3] }, annotations: { italic: true } });
    } else if (match[4]) {
      // `code`
      parts.push({ type: 'text', text: { content: match[4] }, annotations: { code: true } });
    }
    lastIdx = match.index + match[0].length;
  }
  if (lastIdx < text.length) {
    parts.push({ type: 'text', text: { content: text.slice(lastIdx) } });
  }
  return parts.length > 0 ? parts : [{ type: 'text', text: { content: text } }];
}

// ---- Markdown → Notion blocks ----
function markdownToBlocks(md) {
  const blocks = [];
  const lines = md.split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // 空行
    if (line.trim() === '') { i++; continue; }

    // 分隔線
    if (line.trim() === '---') {
      blocks.push({ object: 'block', type: 'divider', divider: {} });
      i++; continue;
    }

    // 標題
    const h3 = line.match(/^### (.+)/);
    if (h3) {
      blocks.push({ object: 'block', type: 'heading_3', heading_3: { rich_text: parseRichText(h3[1]) } });
      i++; continue;
    }
    const h2 = line.match(/^## (.+)/);
    if (h2) {
      blocks.push({ object: 'block', type: 'heading_2', heading_2: { rich_text: parseRichText(h2[1]) } });
      i++; continue;
    }

    // 引用
    if (line.startsWith('> ')) {
      const quoteLines = [];
      while (i < lines.length && lines[i].startsWith('> ')) {
        quoteLines.push(lines[i].replace(/^> /, ''));
        i++;
      }
      blocks.push({ object: 'block', type: 'quote', quote: { rich_text: parseRichText(quoteLines.join('\n')) } });
      continue;
    }

    // 代碼塊
    if (line.startsWith('```')) {
      const lang = line.replace('```', '').trim() || 'plain text';
      i++;
      const codeLines = [];
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      blocks.push({ object: 'block', type: 'code', code: { rich_text: [{ type: 'text', text: { content: codeLines.join('\n') } }], language: lang } });
      continue;
    }

    // 表格
    if (line.includes('|') && line.trim().startsWith('|')) {
      const tableRows = [];
      while (i < lines.length && lines[i].includes('|') && lines[i].trim().startsWith('|')) {
        const cells = lines[i].split('|').filter(c => c.trim() !== '').map(c => c.trim());
        // 跳過分隔行 (|---|---|)
        if (!/^[-: ]+$/.test(cells[0])) {
          tableRows.push(cells);
        }
        i++;
      }
      if (tableRows.length > 0) {
        const width = Math.max(...tableRows.map(r => r.length));
        blocks.push({
          object: 'block', type: 'table',
          table: {
            table_width: width,
            has_column_header: true,
            children: tableRows.map(row => ({
              type: 'table_row',
              table_row: {
                cells: Array.from({ length: width }, (_, j) => parseRichText((row[j] || '').substring(0, 2000)))
              }
            }))
          }
        });
      }
      continue;
    }

    // 列表項
    if (line.match(/^[-*] /)) {
      blocks.push({ object: 'block', type: 'bulleted_list_item', bulleted_list_item: { rich_text: parseRichText(line.replace(/^[-*] /, '')) } });
      i++; continue;
    }
    if (line.match(/^\d+\. /)) {
      blocks.push({ object: 'block', type: 'numbered_list_item', numbered_list_item: { rich_text: parseRichText(line.replace(/^\d+\. /, '')) } });
      i++; continue;
    }

    // HTML div (quiz-divider 等) → 跳過
    if (line.trim().startsWith('<')) {
      while (i < lines.length && !lines[i].includes('</')) i++;
      i++; continue;
    }

    // 一般段落
    const content = line.substring(0, 2000);
    blocks.push({ object: 'block', type: 'paragraph', paragraph: { rich_text: parseRichText(content) } });
    i++;
  }

  return blocks;
}

// ---- 主程式 ----
async function main() {
  console.log('建立 Notion database...');

  // 建立 iPAS database
  const db = await notion.databases.create({
    parent: { type: 'page_id', page_id: parentPageId },
    title: [{ type: 'text', text: { content: 'iPAS AI 課程' } }],
    properties: {
      'Title': { title: {} },
      'Slug': { rich_text: {} },
      'Order': { number: {} },
      'Stage': { select: {} },
      'StageOrder': { number: {} },
      'CourseId': { rich_text: {} },
      'Summary': { rich_text: {} },
    },
  });

  const dbId = db.id;
  console.log(`Database 建立成功: ${dbId}`);
  console.log(`\n請將此 ID 加到 .env：`);
  console.log(`NOTION_IPAS_DATABASE_ID=${dbId}\n`);

  // 讀取所有 md 檔案
  const files = fs.readdirSync(CONTENT_DIR).filter(f => f.endsWith('.md')).sort();
  console.log(`找到 ${files.length} 篇文章，開始上傳...\n`);

  for (const file of files) {
    const lesson = parseMd(path.join(CONTENT_DIR, file));
    const blocks = markdownToBlocks(lesson.body);

    try {
      // Notion API 一次最多 100 個 blocks
      const firstBatch = blocks.slice(0, 100);
      const page = await notion.pages.create({
        parent: { database_id: dbId },
        properties: {
          'Title': { title: [{ text: { content: lesson.title } }] },
          'Slug': { rich_text: [{ text: { content: lesson.slug } }] },
          'Order': { number: lesson.order },
          'Stage': { select: { name: lesson.stage } },
          'StageOrder': { number: lesson.stageOrder || 1 },
          'CourseId': { rich_text: [{ text: { content: String(lesson.courseId) } }] },
          'Summary': { rich_text: [{ text: { content: (lesson.summary || '').substring(0, 2000) } }] },
        },
        children: firstBatch,
      });

      // 上傳剩餘 blocks
      for (let j = 100; j < blocks.length; j += 100) {
        const batch = blocks.slice(j, j + 100);
        await notion.blocks.children.append({ block_id: page.id, children: batch });
      }

      console.log(`[${lesson.order}/51] ${lesson.title}`);
    } catch (err) {
      console.error(`[${lesson.order}] 上傳失敗: ${lesson.title}`, err.message);
    }

    // 避免 rate limit
    await new Promise(r => setTimeout(r, 400));
  }

  console.log('\n上傳完成！');
  console.log(`Database ID: ${dbId}`);
  console.log('下一步：將 NOTION_IPAS_DATABASE_ID 加到 .env 和 Vercel 環境變數');
}

main().catch(console.error);
