// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://angela-jian-site.vercel.app',
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
