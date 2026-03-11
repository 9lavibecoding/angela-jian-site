// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://angelajian.com', // 之後換成你的正式網域
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
