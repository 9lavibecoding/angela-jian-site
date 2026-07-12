// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://aipm-insider.com',
  integrations: [
    sitemap({
      // 付費題庫頁（exam/app、exam/print）已設 noindex，一併排除於 sitemap 之外，避免 noindex 與收錄互相矛盾、稀釋爬蟲預算
      filter: (page) => !page.includes('/exam/app') && !page.includes('/exam/print'),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
