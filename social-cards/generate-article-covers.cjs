/**
 * 為 drafts/notion-batch/*.md 生成 1200×630 文章封面圖
 *
 * 使用：
 *   node social-cards/generate-article-covers.cjs           # 全部
 *   node social-cards/generate-article-covers.cjs 08        # 只跑檔名 08 開頭的
 *   node social-cards/generate-article-covers.cjs --sample  # 只跑第一篇做樣本
 *
 * 輸出：public/article-covers/{slug}.png
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const W = 1200, H = 630;
const F = `'Noto Sans TC','PingFang TC','Heiti TC',sans-serif`;
const C = {
  bg: '#FAF6EF',          // brand-light-bg
  surface: '#F3EDE4',     // brand-light-surface
  border: '#E0D5C5',      // brand-light-border
  text: '#1a1814',        // brand-light-text
  subtle: '#78716C',      // brand-light-subtle
  accent: '#C5A55A',      // brand-accent
  accentDark: '#A8893E',  // brand-accent-dark
};

const DRAFT_DIR = path.join(__dirname, '..', 'drafts', 'notion-batch');
const OUT_DIR = path.join(__dirname, '..', 'public', 'article-covers');

function parseMd(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error(`Invalid frontmatter: ${filePath}`);
  const fm = {};
  match[1].split('\n').forEach(line => {
    const m = line.match(/^(\w+):\s*"?(.*?)"?\s*$/);
    if (m) fm[m[1]] = m[2];
  });
  // first h2 after frontmatter is the subtitle
  const subtitleMatch = match[2].match(/^## (.+)/m);
  fm.subtitle = subtitleMatch ? subtitleMatch[1] : '';
  fm.tags = (fm.tags || '').split(',').map(t => t.trim()).filter(Boolean);
  return fm;
}

function renderCover({ title, subtitle, tags }) {
  const tag = tags[0] || 'AI PM';
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body {
      width:${W}px; height:${H}px;
      font-family:${F};
      background:${C.bg};
      color:${C.text};
      position:relative;
      overflow:hidden;
    }
    /* decorative shape — soft gold circle bottom right */
    .deco {
      position:absolute;
      right:-180px; bottom:-180px;
      width:520px; height:520px;
      border-radius:50%;
      background:linear-gradient(135deg, ${C.accent}40, ${C.accent}15);
    }
    .deco-2 {
      position:absolute;
      right:60px; top:60px;
      width:120px; height:120px;
      border-radius:50%;
      border:2px solid ${C.accent}50;
    }
    .inner {
      position:relative; z-index:1;
      padding:72px 84px;
      height:100%;
      display:flex;
      flex-direction:column;
    }
    .badge {
      align-self:flex-start;
      background:${C.accent};
      color:#fff;
      font-size:22px;
      font-weight:700;
      padding:10px 24px;
      border-radius:999px;
      letter-spacing:0.5px;
    }
    .content {
      flex:1;
      display:flex;
      flex-direction:column;
      justify-content:center;
    }
    .title {
      font-size:64px;
      font-weight:900;
      line-height:1.25;
      color:${C.text};
      letter-spacing:-1.5px;
      margin-bottom:28px;
      max-width:920px;
    }
    .subtitle {
      font-size:30px;
      color:${C.subtle};
      line-height:1.5;
      font-weight:500;
      max-width:880px;
    }
    .footer {
      display:flex;
      justify-content:space-between;
      align-items:center;
      font-size:20px;
      color:${C.subtle};
      letter-spacing:1px;
    }
    .footer strong { color:${C.accentDark}; font-weight:800; letter-spacing:0.5px; }
    .divider {
      width:60px;
      height:3px;
      background:${C.accent};
      margin-bottom:32px;
    }
  </style></head><body>
    <div class="deco"></div>
    <div class="deco-2"></div>
    <div class="inner">
      <div class="badge">${tag}</div>
      <div class="content">
        <div class="divider"></div>
        <div class="title">${title}</div>
        <div class="subtitle">${subtitle}</div>
      </div>
      <div class="footer">
        <span><strong>aipm-insider.com</strong>　·　Angela Jian</span>
        <span>AI Product Notes</span>
      </div>
    </div>
  </body></html>`;
}

async function main() {
  const args = process.argv.slice(2);
  const sampleOnly = args.includes('--sample');
  const filter = args.find(a => !a.startsWith('--'));

  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  let files = fs.readdirSync(DRAFT_DIR).filter(f => f.endsWith('.md')).sort();
  if (filter) files = files.filter(f => f.startsWith(filter));
  if (sampleOnly) files = files.slice(0, 1);

  console.log(`生成 ${files.length} 張封面...\n`);

  const browser = await puppeteer.launch({ headless: 'new' });
  for (const file of files) {
    const fm = parseMd(path.join(DRAFT_DIR, file));
    const html = renderCover(fm);
    const page = await browser.newPage();
    await page.setViewport({ width: W, height: H, deviceScaleFactor: 2 });
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const outPath = path.join(OUT_DIR, `${fm.slug}.png`);
    await page.screenshot({ path: outPath, type: 'png' });
    await page.close();
    console.log(`✓ ${fm.slug}.png  (${fm.title})`);
  }
  await browser.close();
  console.log(`\n輸出位置: ${OUT_DIR}`);
}

main().catch(console.error);
