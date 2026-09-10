// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://aipm-insider.com',
  integrations: [
    sitemap({
      // 付費題庫頁（exam/app、exam/print）已設 noindex，一併排除於 sitemap 之外，避免 noindex 與收錄互相矛盾、稀釋爬蟲預算
      // /portfolio 舊作品集頁已於 2026-09-10 下架，這條是保險：日後若有人放回 portfolio 頁，也不會自動被收錄
      filter: (page) =>
        !page.includes('/exam/app') &&
        !page.includes('/exam/print') &&
        !page.includes('/portfolio'),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
