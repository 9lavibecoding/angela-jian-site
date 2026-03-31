import { Client } from '@notionhq/client';
import { writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

// ---- 圖片下載 ----
const IMG_DIRS = ['public/images/notion', 'dist/images/notion'];

async function downloadImage(url: string): Promise<string> {
  // External images (non-Notion) don't need downloading
  if (!url.includes('prod-files-secure.s3') && !url.includes('s3.us-west-2.amazonaws.com')) {
    return url;
  }

  try {
    // Use URL path (before query params) as hash source for stable filenames
    const urlPath = new URL(url).pathname;
    const hash = createHash('md5').update(urlPath).digest('hex').slice(0, 12);
    const ext = urlPath.match(/\.(png|jpg|jpeg|gif|webp|svg)/i)?.[0] || '.png';
    const filename = `${hash}${ext}`;

    // Download once, then write to all target dirs
    let buffer: Buffer | null = null;

    for (const dir of IMG_DIRS) {
      const localPath = join(dir, filename);
      if (!existsSync(dir)) {
        await mkdir(dir, { recursive: true });
      }
      if (!existsSync(localPath)) {
        if (!buffer) {
          const res = await fetch(url);
          if (!res.ok) return url;
          buffer = Buffer.from(await res.arrayBuffer());
        }
        await writeFile(localPath, buffer);
      }
    }

    return `/images/notion/${filename}`;
  } catch {
    return url;
  }
}

// ---- Notion 設定 ----
const notion = new Client({ auth: import.meta.env.NOTION_SECRET });
const databaseId = import.meta.env.NOTION_DATABASE_ID;

export interface Article {
  title: string;
  slug: string;
  tags: string[];
  tagColors: string[];
  date: string;
  image: string;
  summary: string;
  summaryEn: string;
  content: string;
  url: string;
}

// Tag 顏色對應
const TAG_COLORS: Record<string, string> = {
  'AI PM':         'accent',
  'AI 工具':       'warm',
  'Product Sense': 'cool',
  'AI 流程設計':   'purple',
  'AI 規劃師':     'accent',
};

function getTagColor(tag: string): string {
  return TAG_COLORS[tag] || 'accent';
}

// ---- 靜態備用資料（Notion 未設定時使用）----
export const STATIC_ARTICLES: Article[] = [
  {
    title: '淺談傳統 PM 技能樹 vs. AI PM 能力矩陣',
    slug: 'pm-skill-tree-vs-ai-pm-matrix',
    tags: ['AI PM'],
    tagColors: ['accent'],
    date: '2026.03.08',
    image: '',
    summary: '傳統 PM 技能樹已不足以應對 AI 產品，提出「π 型」能力模型，結合產品判斷力與 AI 技術理解...',
    summaryEn: 'Traditional PM skill trees fall short for AI products. A "π-shaped" competency model combining product judgment with AI literacy is proposed.',
    content: '',
    url: 'https://www.linkedin.com/pulse/%E6%B7%BA%E8%AB%87%E5%82%B3%E7%B5%B1-pm-%E6%8A%80%E8%83%BD%E6%A8%B9-vs-ai-%E8%83%BD%E5%8A%9B%E7%9F%A9%E9%99%A3-angela-jian-rjamc',
  },
  {
    title: '美感不再是門檻，Pencil.dev 幫我實現「設計即產品」',
    slug: 'pencil-dev-design-as-product',
    tags: ['AI 工具'],
    tagColors: ['warm'],
    date: '2026.02.11',
    image: '',
    summary: '透過 AI 設計工具補足美感缺口，減少反覆下 Prompt 的成本，展現 AI 時代產品開發新可能...',
    summaryEn: 'Using AI design tools to bridge the aesthetics gap, reducing iterative prompt costs and showcasing new possibilities for product development in the AI era.',
    content: '',
    url: 'https://www.linkedin.com/pulse/%E7%BE%8E%E6%84%9F%E4%B8%8D%E5%86%8D%E6%98%AF%E9%96%80%E6%AA%BBpencildev-%E5%B9%AB%E6%88%91%E5%AF%A6%E7%8F%BE%E8%A8%AD%E8%A8%88%E5%8D%B3%E7%94%A2%E5%93%81-angela-jian-mexgc',
  },
  {
    title: 'How AI Changes Product Sense: Building an AI-Powered Competitive Intelligence Dashboard',
    slug: 'ai-powered-competitive-intelligence',
    tags: ['Product Sense'],
    tagColors: ['cool'],
    date: '2026.01.21',
    image: '',
    summary: 'Built an AI-powered competitive intelligence dashboard using Python, Streamlit, and Gemini AI...',
    summaryEn: 'Built an AI-powered competitive intelligence dashboard using Python, Streamlit, and Gemini AI to automate market analysis.',
    content: '',
    url: 'https://www.linkedin.com/pulse/how-ai-changes-product-sense-building-ai-powered-competitive-jian-fuctc',
  },
  {
    title: '分享我如何設計「Human-in-the-Loop」的 AI 會計作帳流程',
    slug: 'human-in-the-loop-ai-accounting',
    tags: ['AI 流程設計'],
    tagColors: ['purple'],
    date: '2025.12.26',
    image: '',
    summary: '不是盲目自動化，而是設置信心度閾值讓系統智能標記需要審核的項目，最終作帳時間下降 60%...',
    summaryEn: 'Instead of blind automation, confidence thresholds intelligently flag items for human review — reducing bookkeeping time by 60%.',
    content: '',
    url: 'https://www.linkedin.com/pulse/%E5%88%86%E4%BA%AB%E6%88%91%E5%A6%82%E4%BD%95%E8%A8%AD%E8%A8%88human-in-the-loop-%E7%9A%84-ai-%E6%9C%83%E8%A8%88%E4%BD%9C%E5%B8%B3%E6%B5%81%E7%A8%8B%E8%80%8C%E9%9D%9E%E7%B4%94%E8%87%AA%E5%8B%95%E5%8C%96-angela-jian-85xtc',
  },
  {
    title: 'AI 應用規劃師教我的 3 個「殘酷」現實',
    slug: 'ai-planner-3-harsh-realities',
    tags: ['AI 規劃師'],
    tagColors: ['accent'],
    date: '2025.12.13',
    image: '',
    summary: 'AI 的價值在於流程優化而非技術本身，提出正確的問題比得到答案更重要...',
    summaryEn: 'AI\'s value lies in process optimization, not the technology itself. Asking the right questions matters more than getting answers.',
    content: '',
    url: 'https://www.linkedin.com/pulse/ai-%E6%87%89%E7%94%A8%E8%A6%8F%E5%8A%83%E5%B8%AB%E6%95%99%E6%88%91%E7%9A%84-3-%E5%80%8B%E6%AE%98%E9%85%B7%E7%8F%BE%E5%AF%A6-angela-jian-jufnc',
  },
  {
    title: '從傳統 PM 到 AI 產品經理：我的轉型路徑與實戰心得',
    slug: 'traditional-pm-to-ai-pm-career',
    tags: ['AI PM'],
    tagColors: ['accent'],
    date: '2026.03.18',
    image: '',
    summary: '從行動應用 PM 到 AI 產品經理的完整轉型路徑，拆解需要的能力、踩過的坑，以及最實際的轉型建議。',
    summaryEn: 'The complete path from mobile app PM to AI product manager — skills needed, pitfalls encountered, and practical transition advice.',
    content: `<blockquote>老實說，兩年前的我完全沒想過自己會走上 AI 產品經理這條路。</blockquote><hr /><p>當時我還在做行動應用的 PM，每天的工作是畫 wireframe、寫 user story、跟工程師 sync 開發進度。日子過得很充實，但心裡有個隱隱的不安——我看到身邊越來越多產品開始加入 AI 功能，而我對這些東西一無所知。</p><p>那種感覺很像你在搭一班即將到站的列車，而下一班車已經進站了，你不確定該不該跳。</p><p>後來我跳了。這篇文章想跟你分享的，就是我從傳統 PM 轉型到 AI 產品經理的完整路徑，包含那些踩過的坑、學到的事，以及我認為最實際的轉型建議。</p><hr /><h2>為什麼 AI 產品經理正在崛起</h2><p>這兩年 AI 產品經理的職缺數量成長幅度，用「爆炸」來形容並不誇張。不管是大廠還是新創，只要產品裡有用到 LLM、推薦系統、或任何 ML 模型，都需要一個「<strong>懂 AI 能力邊界的人</strong>」來主導產品方向。</p><p>殘酷的現實是：<strong>市場不缺會寫 PRD 的 PM，缺的是能跟 AI 工程師對話、能判斷模型能不能解決用戶問題的 PM。</strong>（關於能力差異的深入分析，可以參考我之前寫的 <a href="/articles/pm-skill-tree-vs-ai-pm-matrix">傳統 PM 技能樹 vs. AI PM 能力矩陣</a>）</p><p>傳統 PM 的核心能力——用戶研究、需求拆解、專案管理——這些當然還是重要的基礎。但光有這些已經不夠了。當產品的核心引擎從「邏輯規則」變成「機率模型」，PM 的思維方式必須跟著改變。</p><hr /><h2>AI 產品經理到底在做什麼</h2><p>很多人問我：「AI 產品經理的日常跟傳統 PM 差在哪？」</p><p>最大的差異不在工具或流程，而在<strong>思考方式</strong>。</p><h3>傳統 PM vs AI PM 的核心差異</h3><p>傳統 PM 做產品，邏輯是：<strong>用戶要什麼 → 定義規格 → 工程師照著做 → 產出確定的結果。</strong></p><p>AI PM 做產品，邏輯變成：<strong>用戶要什麼 → 判斷 AI 能不能做到 → 定義「夠好」的標準 → 持續調整模型表現。</strong> 結果是機率性的，你要管理的不是「對不對」，而是「對的機率夠不夠高」。</p><h3>日常工作長什麼樣</h3><ul><li><strong>定義 AI 功能的 Evaluation 標準</strong>：不是寫驗收條件就好，而是要定義 Precision、Recall 的目標值</li></ul><ul><li><strong>設計 Prompt 和 AI Workflow</strong>：很多 LLM 產品的核心體驗取決於 Prompt 設計</li></ul><ul><li><strong>管理 Data Pipeline 的優先級</strong>：AI 產品的品質取決於數據</li></ul><ul><li><strong>跟用戶溝通 AI 的限制</strong>：怎麼設定用戶預期、怎麼設計 fallback 體驗</li></ul><ul><li><strong>持續監控模型表現</strong>：上線不是結束，是開始。模型會隨數據分佈改變而衰退（Model Drift）</li></ul><p>簡單來說，AI PM 的角色更像是一個<strong>翻譯官</strong>——把用戶需求翻譯成 AI 團隊聽得懂的語言，同時把 AI 的能力和限制翻譯成用戶和老闆聽得懂的語言。</p>
<div style="margin:2.5rem 0;overflow-x:auto;">
<table style="width:100%;border-collapse:collapse;border-radius:0.75rem;overflow:hidden;font-size:0.9rem;line-height:1.6;">
<thead><tr>
<th style="background:#C5A55A;color:#fff;padding:1rem 1.25rem;text-align:left;font-weight:600;width:25%;">維度</th>
<th style="background:#C5A55A;color:#fff;padding:1rem 1.25rem;text-align:left;font-weight:600;width:37.5%;">傳統 PM</th>
<th style="background:#e65100;color:#fff;padding:1rem 1.25rem;text-align:left;font-weight:600;width:37.5%;">AI PM</th>
</tr></thead>
<tbody>
<tr><td style="padding:0.85rem 1.25rem;border-bottom:1px solid #e5e7eb;font-weight:600;color:#111;">思維方式</td><td style="padding:0.85rem 1.25rem;border-bottom:1px solid #e5e7eb;color:#6b7280;">確定性邏輯：輸入 → 固定產出</td><td style="padding:0.85rem 1.25rem;border-bottom:1px solid #e5e7eb;color:#6b7280;">機率性思維：管理「夠好」的標準</td></tr>
<tr style="background:#f9fafb;"><td style="padding:0.85rem 1.25rem;border-bottom:1px solid #e5e7eb;font-weight:600;color:#111;">產出特性</td><td style="padding:0.85rem 1.25rem;border-bottom:1px solid #e5e7eb;color:#6b7280;">100% 可預測、可重現</td><td style="padding:0.85rem 1.25rem;border-bottom:1px solid #e5e7eb;color:#6b7280;">機率性產出，需持續監控</td></tr>
<tr><td style="padding:0.85rem 1.25rem;border-bottom:1px solid #e5e7eb;font-weight:600;color:#111;">核心文件</td><td style="padding:0.85rem 1.25rem;border-bottom:1px solid #e5e7eb;color:#6b7280;">PRD、User Story、驗收條件</td><td style="padding:0.85rem 1.25rem;border-bottom:1px solid #e5e7eb;color:#6b7280;">Evaluation 指標、Prompt Spec、Data 需求</td></tr>
<tr style="background:#f9fafb;"><td style="padding:0.85rem 1.25rem;border-bottom:1px solid #e5e7eb;font-weight:600;color:#111;">驗收標準</td><td style="padding:0.85rem 1.25rem;border-bottom:1px solid #e5e7eb;color:#6b7280;">功能是否符合規格</td><td style="padding:0.85rem 1.25rem;border-bottom:1px solid #e5e7eb;color:#6b7280;">Precision / Recall 是否達標</td></tr>
<tr><td style="padding:0.85rem 1.25rem;font-weight:600;color:#111;">上線後</td><td style="padding:0.85rem 1.25rem;color:#6b7280;">維護 + 迭代</td><td style="padding:0.85rem 1.25rem;color:#6b7280;">持續監控 Model Drift + 數據品質</td></tr>
</tbody></table>
</div>
<hr /><h2>需要具備的能力</h2>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin:1.5rem 0 2rem;">
<div style="background:linear-gradient(135deg,#fff3e0,#ffe0b2);border-radius:0.75rem;padding:1.25rem;">
<div style="font-size:1.5rem;margin-bottom:0.5rem;">🧠</div>
<div style="font-weight:700;color:#e65100;font-size:0.95rem;margin-bottom:0.35rem;">AI Literacy</div>
<div style="font-size:0.8rem;color:#6b7280;line-height:1.5;">判斷問題是否適合 AI、理解技術 trade-off 與模型限制</div>
</div>
<div style="background:linear-gradient(135deg,#fef3c7,#fde68a);border-radius:0.75rem;padding:1.25rem;">
<div style="font-size:1.5rem;margin-bottom:0.5rem;">📊</div>
<div style="font-weight:700;color:#92400e;font-size:0.95rem;margin-bottom:0.35rem;">數據思維</div>
<div style="font-size:0.8rem;color:#6b7280;line-height:1.5;">問對數據問題：來源、bias、量級、Label 品質</div>
</div>
<div style="background:linear-gradient(135deg,#ecfdf5,#d1fae5);border-radius:0.75rem;padding:1.25rem;">
<div style="font-size:1.5rem;margin-bottom:0.5rem;">✍️</div>
<div style="font-weight:700;color:#065f46;font-size:0.95rem;margin-bottom:0.35rem;">Prompt Engineering</div>
<div style="font-size:0.8rem;color:#6b7280;line-height:1.5;">System Prompt 設計、Few-shot 選擇、系統性 Evaluation</div>
</div>
<div style="background:linear-gradient(135deg,#fdf2f8,#fce7f3);border-radius:0.75rem;padding:1.25rem;">
<div style="font-size:1.5rem;margin-bottom:0.5rem;">🎯</div>
<div style="font-weight:700;color:#9d174d;font-size:0.95rem;margin-bottom:0.35rem;">Confidence 校準</div>
<div style="font-size:0.8rem;color:#6b7280;line-height:1.5;">設定自動化閾值、管理團隊對 AI 產出的信任度</div>
</div>
</div><p>先講最重要的一句話：<strong>你不需要會訓練模型，但你必須懂 AI 的能力邊界。</strong></p><h3>1. AI Literacy（AI 素養）</h3><p>你要懂的不是「模型怎麼訓練」，而是：</p><ul><li><strong>這個問題適不適合用 AI 解</strong>：不是所有問題都該塞一個模型進去</li></ul><ul><li><strong>不同 AI 技術的 trade-off</strong>：LLM vs 傳統 ML、Fine-tuning vs Prompt Engineering</li></ul><ul><li><strong>模型的限制在哪</strong>：Hallucination、Latency、Token 成本、隱私風險</li></ul><h3>2. 數據思維</h3><p>AI 產品的品質 = 數據的品質。這句話不是口號，是我用血淚換來的教訓。</p><p>我曾經花了三個月打造一個 AI 推薦功能，上線後效果很差。回頭檢查才發現，訓練數據裡有大量髒資料。</p><p><strong>數據思維的意思不是你要會寫 SQL，而是你要有能力問出對的問題：</strong>這個數據從哪來？有沒有 bias？量夠不夠？Label 的品質誰在把關？</p><h3>3. Prompt Engineering</h3><p>如果你做的產品有用到 LLM，Prompt Engineering 幾乎是必備技能。你需要理解 System Prompt 的架構設計、Few-shot vs Zero-shot 的選擇、以及 Evaluation 的方法。</p><p>Prompt Engineering 某種程度上就是 AI 時代的「寫規格」——你用自然語言定義產品行為，這不正是 PM 最擅長的事嗎？</p><h3>4. Confidence 校準能力</h3><p>AI 的產出有不確定性，而你作為 PM，需要幫團隊<strong>校準對 AI 的 Confidence</strong>。Confidence Score 多少以上才放行自動化？這些判斷沒有標準答案，但 PM 必須做出決定。</p><hr /><h2>我的轉型路徑</h2><h3>起點：行動應用 PM</h3><p>轉型前我做了幾年的行動應用 PM，主要負責 B2C 產品的功能規劃與迭代。那時候對 AI 的理解大概停留在「好像很厲害但跟我沒關係」的程度。</p><h3>轉捩點：被推著走</h3><p>公司決定在產品裡加入 AI 推薦功能，老闆問：「誰要負責這塊？」沒人舉手，我就被指派了。</p><p>現在回想，這個「被迫上場」反而是最好的學習方式。因為你沒有退路，必須在最短時間內搞懂 AI 團隊在講什麼。</p><h3>踩過的坑</h3><p><strong>坑一：把 AI 功能當傳統功能管理</strong></p><p>一開始我還是用傳統的方式寫 spec：「用戶輸入 X，系統回傳 Y。」AI 工程師看了直接說：「PM，這個沒辦法保證每次都回傳一樣的結果。」</p><p><strong>坑二：忽略數據品質</strong></p><p><strong>AI 產品的 discovery 階段，Data Audit 跟 User Research 一樣重要。</strong></p><p><strong>坑三：對模型能力過度樂觀</strong></p><p>早期我常跟老闆說「AI 可以做到」，然後回頭發現模型根本做不到那個精確度。後來我學會：<strong>先做 POC（Proof of Concept），再許承諾。</strong></p>
<div style="margin:2.5rem 0;background:linear-gradient(135deg,#f8fafc,#f1f5f9);border-radius:0.75rem;padding:1.5rem 1.25rem;overflow-x:auto;">
<div style="font-weight:700;color:#111;font-size:0.95rem;margin-bottom:1.25rem;text-align:center;">我的轉型路徑</div>
<div style="display:flex;align-items:center;justify-content:center;gap:0;flex-wrap:nowrap;min-width:fit-content;">
<div style="text-align:center;flex-shrink:0;">
<div style="width:3.5rem;height:3.5rem;border-radius:50%;background:#ffe0b2;display:flex;align-items:center;justify-content:center;margin:0 auto 0.5rem;font-size:1.2rem;">📱</div>
<div style="font-size:0.75rem;font-weight:600;color:#e65100;">行動應用 PM</div>
<div style="font-size:0.65rem;color:#9ca3af;margin-top:0.15rem;">B2C 功能迭代</div>
</div>
<div style="width:2.5rem;height:2px;background:linear-gradient(90deg,#E8DFD0,#C5A55A);flex-shrink:0;margin:0 0.25rem;"></div>
<div style="text-align:center;flex-shrink:0;">
<div style="width:3.5rem;height:3.5rem;border-radius:50%;background:#fef3c7;display:flex;align-items:center;justify-content:center;margin:0 auto 0.5rem;font-size:1.2rem;">⚡</div>
<div style="font-size:0.75rem;font-weight:600;color:#92400e;">被指派 AI 專案</div>
<div style="font-size:0.65rem;color:#9ca3af;margin-top:0.15rem;">被迫上場</div>
</div>
<div style="width:2.5rem;height:2px;background:linear-gradient(90deg,#fde68a,#f59e0b);flex-shrink:0;margin:0 0.25rem;"></div>
<div style="text-align:center;flex-shrink:0;">
<div style="width:3.5rem;height:3.5rem;border-radius:50%;background:#fee2e2;display:flex;align-items:center;justify-content:center;margin:0 auto 0.5rem;font-size:1.2rem;">🕳️</div>
<div style="font-size:0.75rem;font-weight:600;color:#dc2626;">踩坑學習</div>
<div style="font-size:0.65rem;color:#9ca3af;margin-top:0.15rem;">數據、模型、預期管理</div>
</div>
<div style="width:2.5rem;height:2px;background:linear-gradient(90deg,#fca5a5,#C5A55A);flex-shrink:0;margin:0 0.25rem;"></div>
<div style="text-align:center;flex-shrink:0;">
<div style="width:3.5rem;height:3.5rem;border-radius:50%;background:#C5A55A;display:flex;align-items:center;justify-content:center;margin:0 auto 0.5rem;font-size:1.2rem;">🚀</div>
<div style="font-size:0.75rem;font-weight:600;color:#C5A55A;">AI PM</div>
<div style="font-size:0.65rem;color:#9ca3af;margin-top:0.15rem;">擁抱不確定性</div>
</div>
</div>
</div>
<hr /><h2>給想轉型的人的建議</h2><h3>1. 從現有工作中找 AI 切入點</h3><p>你不需要換工作才能開始。問問自己：現在的產品有沒有哪個環節可以用 AI 優化？<strong>轉型不是一個瞬間的決定，而是一連串小實驗的累積。</strong></p><h3>2. 學對東西</h3><p>我建議的學習優先級：</p><ol><li><strong>Prompt Engineering</strong>（投報率最高，馬上可以用）</li></ol><ol><li><strong>AI 產品設計 Pattern</strong>（Human-in-the-loop、Progressive Disclosure）</li></ol><ol><li><strong>基礎 ML 概念</strong>（Training、Inference、Evaluation 的基本邏輯）</li></ol><ol><li><strong>數據基礎</strong>（SQL 是加分項，但更重要的是建立數據直覺）</li></ol><h3>3. 大量使用 AI 工具</h3><p>不要只是用 ChatGPT 幫你寫信。試著用它做 User Research 分析、寫 PRD 初稿、產生測試案例。<strong>當你自己是 AI 的深度用戶，你才能真正理解 AI 產品的痛點和機會。</strong>（延伸閱讀：<a href="/articles/ai-tools-for-product-managers">我每天在用的 5 個 AI 場景</a>）</p><h3>4. 建立跨領域的語言能力</h3><p>多跟 AI 工程師、Data Scientist 聊天。一開始聽不懂很正常，不要怕問笨問題。</p><h3>5. 接受「不完美」的產品觀</h3><p><strong>不是追求 100% 正確，而是設計一個「就算 AI 出錯也不會造成災難」的產品體驗。</strong> 💡</p><hr /><h2>寫在最後</h2><p>回頭看這段轉型的路，我最慶幸的一件事是：<strong>我沒有等到「準備好」才開始。</strong></p><p>如果你現在也站在那個不確定的路口，先從一個小實驗開始。找到你現在工作裡跟 AI 最近的那個接觸點，動手去做。</p><p>AI 產品經理這個角色還在被定義中，這代表你有機會用自己的方式去塑造它。</p><p>如果你也正在經歷類似的轉型，或是對 AI PM 的日常有任何好奇，歡迎留言跟我聊聊——我很想知道，你的轉型故事是什麼？ 🚀</p>`,
    url: '',
  },
  {
    title: '產品經理必備的 AI 工具清單：我每天在用的 5 個場景',
    slug: 'ai-tools-for-product-managers',
    tags: ['AI 工具'],
    tagColors: ['warm'],
    date: '2026.03.18',
    image: '',
    summary: '分享 PM 日常實際在用的 5 個 AI 場景，包含具體工具、Prompt 範例與踩過的坑，不是清單文而是真實工作流。',
    summaryEn: '5 real AI use cases from a PM\'s daily workflow — specific tools, prompt examples, and lessons learned. Not a listicle, but a real workflow.',
    content: `<blockquote>身為一個每天被會議、文件、數據追著跑的 PM，我常常在思考一個問題：我的時間到底都花在哪裡？</blockquote><hr /><p>去年我做了一個實驗，連續兩週記錄自己每小時在做什麼，結果顯示將近 60% 的時間花在「整理」而非「思考」，講的直白一些就是做雜事，包含整理會議紀錄、整理競品資料、整理數據報告、整理週報⋯⋯我的工作不像是產品經理，是整理經理。</p><p>這就是我開始認真把 AI 工具融入日常工作流的起點。不是為了追潮流，而是為了<strong>把時間還給真正需要我們判斷力的事情</strong>。</p><p>今天這篇文章，我想跟你分享我每天實際在用的 5 個 AI 場景，包含具體工具、怎麼下 Prompt、以及踩過的坑坑洞洞，希望對你們有幫助。</p><hr /><h2>PM 的時間都花在哪裡？哪些環節 AI 能介入</h2><p>先拉高一個層次來看。PM 的工作大致可以分成幾個區塊：</p><ul><li>資訊蒐集：競品分析、市場調研</li></ul><ul><li>文件產出：PRD、規格書、提案</li></ul><ul><li>數據分析：看報表、找洞察</li></ul><ul><li>溝通協調：會議、訪談、跨部門對齊</li></ul><ul><li>進度管理：週報、追蹤、更新狀態</li></ul><p>這裡面有一個關鍵判斷：<strong>不是所有環節都適合讓 AI 介入，但幾乎所有環節都有 AI 能加速的部分。</strong></p><p>我的原則是：AI 處理「從 0 到 0.7」的粗活，我負責「從 0.7 到 1」的精修與判斷。搞清楚這個分工，我們才不會掉進「AI 幫我做完了但品質很差」的陷阱。</p>
<div style="margin:2rem 0;background:#f8fafc;border-radius:0.75rem;padding:1.5rem;">
<div style="font-weight:700;color:#111;font-size:0.95rem;margin-bottom:1rem;">PM 時間分配 — 哪些環節 AI 能介入？</div>
<div style="display:flex;flex-direction:column;gap:0.6rem;">
<div><div style="display:flex;justify-content:space-between;font-size:0.8rem;margin-bottom:0.25rem;"><span style="color:#111;font-weight:600;">資訊蒐集（競品/調研）</span><span style="color:#C5A55A;font-weight:600;">AI 可加速 🟢</span></div><div style="background:#e5e7eb;border-radius:4px;height:8px;overflow:hidden;"><div style="width:25%;height:100%;background:linear-gradient(90deg,#C5A55A,#D4B86A);border-radius:4px;"></div></div></div>
<div><div style="display:flex;justify-content:space-between;font-size:0.8rem;margin-bottom:0.25rem;"><span style="color:#111;font-weight:600;">文件產出（PRD/提案）</span><span style="color:#C5A55A;font-weight:600;">AI 可加速 🟢</span></div><div style="background:#e5e7eb;border-radius:4px;height:8px;overflow:hidden;"><div style="width:30%;height:100%;background:linear-gradient(90deg,#C5A55A,#D4B86A);border-radius:4px;"></div></div></div>
<div><div style="display:flex;justify-content:space-between;font-size:0.8rem;margin-bottom:0.25rem;"><span style="color:#111;font-weight:600;">數據分析</span><span style="color:#f59e0b;font-weight:600;">部分可用 🟡</span></div><div style="background:#e5e7eb;border-radius:4px;height:8px;overflow:hidden;"><div style="width:15%;height:100%;background:linear-gradient(90deg,#f59e0b,#fbbf24);border-radius:4px;"></div></div></div>
<div><div style="display:flex;justify-content:space-between;font-size:0.8rem;margin-bottom:0.25rem;"><span style="color:#111;font-weight:600;">溝通協調（會議/訪談）</span><span style="color:#f59e0b;font-weight:600;">整理可用 🟡</span></div><div style="background:#e5e7eb;border-radius:4px;height:8px;overflow:hidden;"><div style="width:20%;height:100%;background:linear-gradient(90deg,#f59e0b,#fbbf24);border-radius:4px;"></div></div></div>
<div><div style="display:flex;justify-content:space-between;font-size:0.8rem;margin-bottom:0.25rem;"><span style="color:#111;font-weight:600;">進度管理（週報/追蹤）</span><span style="color:#C5A55A;font-weight:600;">AI 可加速 🟢</span></div><div style="background:#e5e7eb;border-radius:4px;height:8px;overflow:hidden;"><div style="width:10%;height:100%;background:linear-gradient(90deg,#C5A55A,#D4B86A);border-radius:4px;"></div></div></div>
</div>
</div>
<div style="margin:1.5rem 0 2.5rem;background:#f8f9fa;border:1px solid #e5e7eb;border-radius:0.75rem;padding:1.25rem;">
<div style="font-weight:700;color:#1a1814;font-size:0.9rem;margin-bottom:0.75rem;text-align:center;">AI 與人類的分工原則</div>
<div style="position:relative;height:2.5rem;background:#e5e7eb;border-radius:6px;overflow:hidden;">
<div style="position:absolute;left:0;top:0;width:70%;height:100%;background:linear-gradient(90deg,#1a1814,#2a2520);display:flex;align-items:center;padding-left:1rem;">
<span style="color:#E8D48B;font-size:0.8rem;font-weight:600;">AI 處理：0 → 0.7</span>
</div>
<div style="position:absolute;right:0;top:0;width:30%;height:100%;background:linear-gradient(90deg,#C5A55A,#A8893E);display:flex;align-items:center;justify-content:center;">
<span style="color:#fff;font-size:0.8rem;font-weight:600;">人類：0.7 → 1.0</span>
</div>
</div>
<div style="display:flex;justify-content:space-between;margin-top:0.5rem;font-size:0.7rem;color:#6b7280;">
<span>整理、格式化、初稿生成</span>
<span>判斷、決策、品質把關</span>
</div>
</div>
<hr /><h2>場景一：競品分析與市場調研</h2><p>這是我最早開始用 AI 的場景，也是效果最明顯的。</p><h3>以前的做法</h3><p>打開十幾個瀏覽器分頁，一個一個讀競品的官網、Product Hunt 頁面、用戶評價，然後手動整理成表格。一份完整的競品分析，至少花掉半天。</p><h3>現在的做法</h3><p>我會用 <strong>ChatGPT </strong>或 <strong>Claude</strong> 來做初步的競品框架整理，再搭配 <strong>Perplexity</strong> 做即時的市場資料搜尋。</p><p>關鍵在 Prompt 的設計。以下是我實際在用的 Prompt 結構：</p><blockquote>「你是一個資深的 B2B SaaS 產品分析師。請幫我比較以下三個競品：[A]、[B]、[C]，從以下維度分析：目標用戶、核心功能、定價策略、市場定位、主要優勢與劣勢。請用表格呈現，並在最後給出你的觀察摘要。」</blockquote><p>Prompt Engineering 的重點：<strong>給 AI 一個角色（Role）、明確的維度（Dimensions）、以及期望的輸出格式（Format）</strong>。少了任何一個，產出品質都會打折。</p><p><strong>注意：</strong> AI 的競品資料可能有時間差，特別是定價和功能更新。所以我一定會用 Perplexity 交叉驗證即時資訊，<strong>AI 產出的內容是草稿，不是定稿</strong>。</p><hr /><h2>場景二：PRD / 需求文件撰寫</h2><p>這個場景最多 PM 問我：「你真的讓 AI 寫 PRD？」</p><p>答案是：<strong>是，但只寫特定部分。</strong></p><h3>該讓 AI 寫的</h3><ul><li>功能描述的初稿（Feature Description）</li></ul><ul><li>User Story 的批量生成</li></ul><ul><li>Edge Case 的列舉</li></ul><ul><li>名詞定義與 Glossary</li></ul><h3>不該讓 AI 寫的</h3><ul><li><strong>產品策略與優先級判斷</strong> —— 這是 PM 的核心價值</li></ul><ul><li><strong>取捨的理由（Trade-off Rationale）</strong> —— AI 不知道你的 context</li></ul><ul><li><strong>跨部門的承諾與時程</strong> —— 這需要人跟人之間的信任</li></ul><p>我的流程：先在 <strong>Notion AI</strong> 或 <strong>Claude</strong> 裡快速生成 PRD 的骨架，然後手動填入策略思考和判斷依據。</p><p>用這個方法，一份過去要寫 3 小時的 PRD，我現在大概 1 小時就能完成，而且 Edge Case 的覆蓋率反而更高，因為 AI 會幫你想到你沒想到的情境。</p><hr /><h2>場景三：數據分析與洞察</h2><p>這個場景要特別小心，因為 <strong>AI 會瞎掰數字</strong>。</p><p>我不會把原始數據丟給 ChatGPT 然後問「幫我分析」。這樣做的風險太高——它可能會給你一個看起來很合理、但完全是 Hallucination 的結論。</p><h3>我的做法</h3><ol><li>先用 <strong>ChatGPT 的 Code Interpreter</strong> 上傳 CSV，讓它跑基本的統計和視覺化</li></ol><ol><li>用 Prompt 請它「描述你看到的 Pattern」，而不是「告訴我結論」</li></ol><ol><li>我自己驗證這些 Pattern 是否合理，再決定要不要採納</li></ol><p>認知翻轉：<strong>不是讓 AI 幫你做分析，而是讓 AI 幫你更快地「看見」數據裡的東西，判斷還是你的事。</strong></p><p>一個實用的 Prompt：</p><blockquote>「請分析這份數據，列出你觀察到的前 5 個有趣的 Pattern 或異常值。對每個 Pattern，請說明：1) 你觀察到什麼 2) 可能的原因假設 3) 建議進一步驗證的方向。請標注你的 Confidence Level（高/中/低）。」</blockquote><p>要求 AI 標注 <strong>Confidence Level</strong> 是一個很好的技巧。當它說「低信心」的時候，你就知道那個部分需要自己再確認。</p><hr /><h2>場景四：用戶訪談摘要與歸納</h2><p>做用戶研究的 PM 應該都有同感：訪談完最痛的不是訪談本身，是<strong>事後的整理</strong>。一場 45 分鐘的訪談，光轉逐字稿加整理重點，又要花掉 1-2 小時。</p><h3>我的工具組合</h3><ol><li><strong>Otter.ai</strong> 或 <strong>Fireflies.ai</strong> —— 會議錄音即時轉文字</li></ol><ol><li><strong>Claude</strong>（長文本處理能力較強）—— 整理訪談摘要</li></ol><p>錄音轉文字之後，我會把逐字稿丟進 Claude，用以下 Prompt：</p><blockquote>「以下是一場用戶訪談的逐字稿。請幫我整理：1) 用戶背景摘要 2) 提到的主要痛點（Pain Points），依嚴重程度排序 3) 用戶對現有解決方案的評價 4) 值得注意的原話引用（Verbatim Quotes）5) 建議的後續行動。」</blockquote><p>這個流程讓我一場訪談的整理時間從 1.5 小時縮短到 20 分鐘。</p><p><strong>一個提醒：</strong>訪談涉及用戶隱私，<strong>上傳前請確認你的公司政策是否允許將訪談內容傳到第三方 AI 服務</strong>。</p><hr /><h2>場景五：自動化週報與進度追蹤</h2><p>每週五下午最痛苦的事：寫週報。</p><h3>我的自動化流程</h3><p>用 <strong>Zapier</strong> 或 <strong>Make</strong> 串接：</p><ol><li>每週五自動從 <strong>Jira / Linear</strong> 拉取本週完成的 Ticket 和狀態變更</li></ol><ol><li>從 <strong>Slack</strong> 拉取特定 Channel 的重要訊息</li></ol><ol><li>把這些資料送進 <strong>ChatGPT API</strong>，用預設 Prompt 生成週報草稿</li></ol><ol><li>草稿自動發到 <strong>Notion</strong> 或 <strong>Email Draft</strong></li></ol><p>整個流程設定一次，之後每週自動跑。我只需要花 10 分鐘看一下草稿、調整措辭就好。</p><p><strong>以前：每週花 40 分鐘寫週報。現在：10 分鐘微調。</strong></p>
<div style="margin:2.5rem 0;overflow-x:auto;">
<div style="font-weight:700;color:#111;font-size:0.95rem;margin-bottom:1rem;">5 大場景效率對比</div>
<table style="width:100%;border-collapse:collapse;border-radius:0.75rem;overflow:hidden;font-size:0.85rem;line-height:1.6;">
<thead><tr>
<th style="background:#1a1814;color:#E8D48B;padding:0.85rem 1rem;text-align:left;font-weight:600;">場景</th>
<th style="background:#1a1814;color:#E8D48B;padding:0.85rem 1rem;text-align:center;font-weight:600;">以前耗時</th>
<th style="background:#1a1814;color:#E8D48B;padding:0.85rem 1rem;text-align:center;font-weight:600;">現在耗時</th>
<th style="background:#1a1814;color:#E8D48B;padding:0.85rem 1rem;text-align:center;font-weight:600;">主要工具</th>
</tr></thead>
<tbody>
<tr><td style="padding:0.75rem 1rem;border-bottom:1px solid #e5e7eb;font-weight:600;color:#111;">競品分析</td><td style="padding:0.75rem 1rem;border-bottom:1px solid #e5e7eb;text-align:center;color:#dc2626;">4 小時</td><td style="padding:0.75rem 1rem;border-bottom:1px solid #e5e7eb;text-align:center;color:#059669;font-weight:600;">1 小時</td><td style="padding:0.75rem 1rem;border-bottom:1px solid #e5e7eb;text-align:center;color:#6b7280;">ChatGPT + Perplexity</td></tr>
<tr style="background:#f9fafb;"><td style="padding:0.75rem 1rem;border-bottom:1px solid #e5e7eb;font-weight:600;color:#111;">PRD 撰寫</td><td style="padding:0.75rem 1rem;border-bottom:1px solid #e5e7eb;text-align:center;color:#dc2626;">3 小時</td><td style="padding:0.75rem 1rem;border-bottom:1px solid #e5e7eb;text-align:center;color:#059669;font-weight:600;">1 小時</td><td style="padding:0.75rem 1rem;border-bottom:1px solid #e5e7eb;text-align:center;color:#6b7280;">Claude + Notion AI</td></tr>
<tr><td style="padding:0.75rem 1rem;border-bottom:1px solid #e5e7eb;font-weight:600;color:#111;">數據分析</td><td style="padding:0.75rem 1rem;border-bottom:1px solid #e5e7eb;text-align:center;color:#dc2626;">2 小時</td><td style="padding:0.75rem 1rem;border-bottom:1px solid #e5e7eb;text-align:center;color:#059669;font-weight:600;">45 分鐘</td><td style="padding:0.75rem 1rem;border-bottom:1px solid #e5e7eb;text-align:center;color:#6b7280;">Code Interpreter</td></tr>
<tr style="background:#f9fafb;"><td style="padding:0.75rem 1rem;border-bottom:1px solid #e5e7eb;font-weight:600;color:#111;">訪談整理</td><td style="padding:0.75rem 1rem;border-bottom:1px solid #e5e7eb;text-align:center;color:#dc2626;">1.5 小時</td><td style="padding:0.75rem 1rem;border-bottom:1px solid #e5e7eb;text-align:center;color:#059669;font-weight:600;">20 分鐘</td><td style="padding:0.75rem 1rem;border-bottom:1px solid #e5e7eb;text-align:center;color:#6b7280;">Otter.ai + Claude</td></tr>
<tr><td style="padding:0.75rem 1rem;font-weight:600;color:#111;">週報撰寫</td><td style="padding:0.75rem 1rem;text-align:center;color:#dc2626;">40 分鐘</td><td style="padding:0.75rem 1rem;text-align:center;color:#059669;font-weight:600;">10 分鐘</td><td style="padding:0.75rem 1rem;text-align:center;color:#6b7280;">Zapier + ChatGPT API</td></tr>
</tbody></table>
</div>
<hr /><h2>使用 AI 工具的原則：AI 是加速器，不是替代品</h2><ol><li><strong>AI 處理重複性高、結構化的工作</strong> —— 整理、格式化、初稿生成</li></ol><ol><li><strong>人類負責判斷、決策、與 Context 相關的事</strong> —— 策略、優先級、取捨</li></ol><ol><li><strong>永遠驗證 AI 的產出</strong> —— 特別是涉及數字、事實、引用的部分</li></ol><ol><li><strong>持續優化你的 Prompt</strong> —— 把好用的 Prompt 存成 Template，迭代改進</li></ol><p>說到底，PM 的核心價值不是「產出文件的速度」，而是<strong>「做對的判斷」</strong>。不是用了 AI 工具你就變強了，而是<strong>你夠強的時候，AI 工具會讓你更強</strong>。</p><hr /><p>💡 如果你也是 PM，我很好奇——你目前工作中最花時間的環節是什麼？你有在用哪些 AI 工具來加速嗎？歡迎留言跟我分享，我們一起交流！</p>`,
    url: '',
  },
];

// ---- 從 Notion Rich Text 轉 HTML ----
function richTextToHtml(richText: any[]): string {
  if (!richText || !richText.length) return '';
  return richText.map((block: any) => {
    let text = block.plain_text || '';
    if (block.annotations?.bold) text = `<strong>${text}</strong>`;
    if (block.annotations?.italic) text = `<em>${text}</em>`;
    if (block.annotations?.strikethrough) text = `<del>${text}</del>`;
    if (block.annotations?.code) text = `<code>${text}</code>`;
    if (block.href) text = `<a href="${block.href}" target="_blank" rel="noopener">${text}</a>`;
    return text;
  }).join('');
}

// ---- 取得所有 blocks（含分頁）----
async function getAllBlocks(blockId: string): Promise<any[]> {
  const allBlocks: any[] = [];
  let cursor: string | undefined;
  do {
    const response = await notion.blocks.children.list({
      block_id: blockId,
      page_size: 100,
      start_cursor: cursor,
    });
    allBlocks.push(...response.results);
    cursor = response.has_more ? response.next_cursor ?? undefined : undefined;
  } while (cursor);
  return allBlocks;
}

// ---- 從 Notion Blocks 轉 HTML（同時提取第一張圖片）----
async function blocksToHtmlAndImage(blockId: string): Promise<{ html: string; firstImage: string }> {
  try {
    const blocks = await getAllBlocks(blockId);
    let html = '';
    let firstImage = '';
    let inBulletList = false;
    let inNumberedList = false;

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i] as any;
      const nextBlock = blocks[i + 1] as any;

      // 處理列表的開閉標籤
      if (block.type === 'bulleted_list_item' && !inBulletList) { html += '<ul>'; inBulletList = true; }
      if (block.type === 'numbered_list_item' && !inNumberedList) { html += '<ol>'; inNumberedList = true; }
      if (block.type !== 'bulleted_list_item' && inBulletList) { html += '</ul>'; inBulletList = false; }
      if (block.type !== 'numbered_list_item' && inNumberedList) { html += '</ol>'; inNumberedList = false; }

      switch (block.type) {
        case 'paragraph': {
          const pText = richTextToHtml(block.paragraph.rich_text);
          if (pText.trimStart().startsWith('####')) {
            html += `<h3>${pText.replace(/^(\s*)#{4}\s*/, '')}</h3>`;
          } else {
            html += `<p>${pText}</p>`;
          }
          break;
        }
        case 'heading_1':
          html += `<h1>${richTextToHtml(block.heading_1.rich_text)}</h1>`;
          break;
        case 'heading_2':
          html += `<h2>${richTextToHtml(block.heading_2.rich_text)}</h2>`;
          break;
        case 'heading_3':
          html += `<h3>${richTextToHtml(block.heading_3.rich_text)}</h3>`;
          break;
        case 'bulleted_list_item':
          html += `<li>${richTextToHtml(block.bulleted_list_item.rich_text)}</li>`;
          break;
        case 'numbered_list_item':
          html += `<li>${richTextToHtml(block.numbered_list_item.rich_text)}</li>`;
          break;
        case 'quote':
          html += `<blockquote>${richTextToHtml(block.quote.rich_text)}</blockquote>`;
          break;
        case 'code':
          html += `<pre><code>${richTextToHtml(block.code.rich_text)}</code></pre>`;
          break;
        case 'image': {
          const rawImgUrl = block.image.type === 'external' ? block.image.external.url : block.image.file.url;
          const imgUrl = await downloadImage(rawImgUrl);
          if (!firstImage) firstImage = imgUrl;
          html += `<img src="${imgUrl}" alt="" />`;
          break;
        }
        case 'divider':
          html += '<hr />';
          break;
        case 'table': {
          // 取得 table rows
          const rows = await getAllBlocks(block.id);
          const hasHeader = block.table.has_column_header;
          html += '<table>';
          rows.forEach((row: any, idx: number) => {
            if (row.type !== 'table_row') return;
            const cells = row.table_row.cells;
            const tag = (hasHeader && idx === 0) ? 'th' : 'td';
            if (hasHeader && idx === 0) html += '<thead>';
            html += '<tr>';
            cells.forEach((cell: any) => {
              html += `<${tag}>${richTextToHtml(cell)}</${tag}>`;
            });
            html += '</tr>';
            if (hasHeader && idx === 0) html += '</thead><tbody>';
          });
          if (hasHeader && rows.length > 1) html += '</tbody>';
          html += '</table>';
          break;
        }
        case 'callout': {
          const icon = block.callout.icon?.emoji || '';
          html += `<blockquote><strong>${icon}</strong> ${richTextToHtml(block.callout.rich_text)}</blockquote>`;
          break;
        }
        case 'toggle': {
          const summary = richTextToHtml(block.toggle.rich_text);
          const childHtml = block.has_children ? await blocksToHtml(block.id) : '';
          html += `<details><summary><strong>${summary}</strong></summary>${childHtml}</details>`;
          break;
        }
        default:
          break;
      }

      // 關閉列表（最後一個元素時）
      if (i === blocks.length - 1) {
        if (inBulletList) html += '</ul>';
        if (inNumberedList) html += '</ol>';
      }
    }
    return { html: html.replaceAll('——', '，'), firstImage };
  } catch {
    return { html: '', firstImage: '' };
  }
}

async function blocksToHtml(blockId: string): Promise<string> {
  const { html } = await blocksToHtmlAndImage(blockId);
  return html;
}

// ---- 從 Notion 取得文章 ----
export async function getArticles(): Promise<Article[]> {
  if (!import.meta.env.NOTION_SECRET || !import.meta.env.NOTION_DATABASE_ID) {
    return STATIC_ARTICLES;
  }

  try {
    const response = await notion.databases.query({
      database_id: databaseId,
      filter: {
        property: 'Published',
        checkbox: { equals: true },
      },
      sorts: [{ property: 'Date', direction: 'descending' }],
    });

    const articles: Article[] = [];

    for (const page of response.results as any[]) {
      const props = page.properties;
      const tags = (props.Tag?.multi_select || []).map((t: any) => t.name);
      const tagColors = tags.map((t: string) => getTagColor(t));

      const { html: content, firstImage } = await blocksToHtmlAndImage(page.id);
      articles.push({
        title: props.Title?.title?.[0]?.plain_text || '',
        slug: props.Slug?.rich_text?.[0]?.plain_text || '',
        tags,
        tagColors,
        date: props.Date?.date?.start?.replaceAll('-', '.') || '',
        image: firstImage,
        summary: props.Summary?.rich_text?.[0]?.plain_text || '',
        summaryEn: '',
        content,
        url: props.ExternalURL?.url || '',
      });
    }

    // Merge: if a static article has rich content (diagrams), prefer static version
    const staticBySlug = new Map(STATIC_ARTICLES.map(a => [a.slug, a]));
    const mergedArticles = articles.map(a => {
      const staticVer = staticBySlug.get(a.slug);
      if (staticVer) {
        return {
          ...a,
          ...(staticVer.content ? { content: staticVer.content } : {}),
          ...(staticVer.summaryEn ? { summaryEn: staticVer.summaryEn } : {}),
        };
      }
      return a;
    });
    // Add static articles not in Notion
    const notionSlugs = new Set(articles.map(a => a.slug));
    const extraStatic = STATIC_ARTICLES.filter(a => !notionSlugs.has(a.slug));
    const merged = [...mergedArticles, ...extraStatic];
    merged.sort((a, b) => b.date.localeCompare(a.date));
    return merged;
  } catch (e) {
    console.warn('Notion fetch failed, using static data:', e);
    return STATIC_ARTICLES;
  }
}

// ---- 取得單篇文章 ----
export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const articles = await getArticles();
  return articles.find(a => a.slug === slug) || null;
}

// ==================== iPAS 課程 ====================

export interface IPASLesson {
  id: string;
  title: string;
  slug: string;
  order: number;
  stage: string;
  stageOrder: number;
  courseId: string;
  summary: string;
  content: string;
}

const ipasDbId = import.meta.env.NOTION_IPAS_DATABASE_ID;

export async function getIPASLessons(): Promise<IPASLesson[]> {
  if (!import.meta.env.NOTION_SECRET || !ipasDbId) return [];

  try {
    const allPages: any[] = [];
    let cursor: string | undefined;
    do {
      const response = await notion.databases.query({
        database_id: ipasDbId,
        sorts: [{ property: 'Order', direction: 'ascending' }],
        start_cursor: cursor,
        page_size: 100,
      });
      allPages.push(...response.results);
      cursor = response.has_more ? (response.next_cursor ?? undefined) : undefined;
    } while (cursor);

    const lessons: IPASLesson[] = [];
    for (const page of allPages as any[]) {
      const props = page.properties;
      lessons.push({
        id: page.id,
        title: props.Title?.title?.[0]?.plain_text || '',
        slug: props.Slug?.rich_text?.[0]?.plain_text || '',
        order: props.Order?.number ?? 0,
        stage: props.Stage?.select?.name || '',
        stageOrder: props.StageOrder?.number ?? 0,
        courseId: props.CourseId?.rich_text?.[0]?.plain_text || '',
        summary: props.Summary?.rich_text?.[0]?.plain_text || '',
        content: '',
      });
    }
    return lessons.sort((a, b) => a.order - b.order);
  } catch (e) {
    console.warn('iPAS Notion fetch failed:', e);
    return [];
  }
}

export async function getIPASLessonBySlug(slug: string): Promise<IPASLesson | null> {
  const lessons = await getIPASLessons();
  const lesson = lessons.find(l => l.slug === slug);
  if (!lesson) return null;
  // 取得內容（只在需要時才取）
  lesson.content = await blocksToHtml(lesson.id);
  return lesson;
}
