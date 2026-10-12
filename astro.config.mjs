// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import { NEWSLETTER_ENABLED } from './src/lib/newsletter.ts';

export default defineConfig({
  site: 'https://aipm-insider.com',
  integrations: [
    sitemap({
      // 付費題庫頁（exam/app、exam/print）已設 noindex，一併排除於 sitemap 之外，避免 noindex 與收錄互相矛盾、稀釋爬蟲預算
      // /portfolio 舊作品集頁已於 2026-09-10 下架，這條是保險：日後若有人放回 portfolio 頁，也不會自動被收錄
      filter: (page) =>
        !page.includes('/exam/app') &&
        !page.includes('/exam/print') &&
        !page.includes('/portfolio') &&
        // 電子報關閉時頁面本來就不產出，這條是保險
        (NEWSLETTER_ENABLED || !page.includes('/newsletter')),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
