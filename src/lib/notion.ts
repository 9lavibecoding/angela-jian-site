import { Client } from '@notionhq/client';

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
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=500&q=80&auto=format',
    summary: '傳統 PM 技能樹已不足以應對 AI 產品，提出「π 型」能力模型，結合產品判斷力與 AI 技術理解...',
    content: '',
    url: 'https://www.linkedin.com/pulse/%E6%B7%BA%E8%AB%87%E5%82%B3%E7%B5%B1-pm-%E6%8A%80%E8%83%BD%E6%A8%B9-vs-ai-%E8%83%BD%E5%8A%9B%E7%9F%A9%E9%99%A3-angela-jian-rjamc',
  },
  {
    title: '美感不再是門檻，Pencil.dev 幫我實現「設計即產品」',
    slug: 'pencil-dev-design-as-product',
    tags: ['AI 工具'],
    tagColors: ['warm'],
    date: '2026.02.11',
    image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=500&q=80&auto=format',
    summary: '透過 AI 設計工具補足美感缺口，減少反覆下 Prompt 的成本，展現 AI 時代產品開發新可能...',
    content: '',
    url: 'https://www.linkedin.com/pulse/%E7%BE%8E%E6%84%9F%E4%B8%8D%E5%86%8D%E6%98%AF%E9%96%80%E6%AA%BBpencildev-%E5%B9%AB%E6%88%91%E5%AF%A6%E7%8F%BE%E8%A8%AD%E8%A8%88%E5%8D%B3%E7%94%A2%E5%93%81-angela-jian-mexgc',
  },
  {
    title: 'How AI Changes Product Sense: Building an AI-Powered Competitive Intelligence Dashboard',
    slug: 'ai-powered-competitive-intelligence',
    tags: ['Product Sense'],
    tagColors: ['cool'],
    date: '2026.01.21',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500&q=80&auto=format',
    summary: 'Built an AI-powered competitive intelligence dashboard using Python, Streamlit, and Gemini AI...',
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
    content: '',
    url: 'https://www.linkedin.com/pulse/ai-%E6%87%89%E7%94%A8%E8%A6%8F%E5%8A%83%E5%B8%AB%E6%95%99%E6%88%91%E7%9A%84-3-%E5%80%8B%E6%AE%98%E9%85%B7%E7%8F%BE%E5%AF%A6-angela-jian-jufnc',
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

// ---- 從 Notion Blocks 轉 HTML ----
async function blocksToHtml(blockId: string): Promise<string> {
  try {
    const blocks = await notion.blocks.children.list({ block_id: blockId, page_size: 100 });
    let html = '';

    for (const block of blocks.results as any[]) {
      switch (block.type) {
        case 'paragraph':
          html += `<p>${richTextToHtml(block.paragraph.rich_text)}</p>`;
          break;
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
          html += `<ul><li>${richTextToHtml(block.bulleted_list_item.rich_text)}</li></ul>`;
          break;
        case 'numbered_list_item':
          html += `<ol><li>${richTextToHtml(block.numbered_list_item.rich_text)}</li></ol>`;
          break;
        case 'quote':
          html += `<blockquote>${richTextToHtml(block.quote.rich_text)}</blockquote>`;
          break;
        case 'code':
          html += `<pre><code>${richTextToHtml(block.code.rich_text)}</code></pre>`;
          break;
        case 'image':
          const imgUrl = block.image.type === 'external' ? block.image.external.url : block.image.file.url;
          html += `<img src="${imgUrl}" alt="" />`;
          break;
        case 'divider':
          html += '<hr />';
          break;
        default:
          break;
      }
    }
    return html;
  } catch {
    return '';
  }
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

      articles.push({
        title: props.Title?.title?.[0]?.plain_text || '',
        slug: props.Slug?.rich_text?.[0]?.plain_text || '',
        tags,
        tagColors,
        date: props.Date?.date?.start?.replaceAll('-', '.') || '',
        image: props.Image?.url || '',
        summary: props.Summary?.rich_text?.[0]?.plain_text || '',
        content: await blocksToHtml(page.id),
        url: props.ExternalURL?.url || '',
      });
    }

    return articles.length > 0 ? articles : STATIC_ARTICLES;
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
