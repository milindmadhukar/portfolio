// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';

import { remarkObsidianLinks } from './src/plugins/remark-obsidian-links.js';
import { remarkObsidianExcalidraw } from './src/plugins/remark-obsidian-excalidraw.js';

// https://astro.build/config
export default defineConfig({
  site: 'https://milind.dev',
  output: 'server',
  adapter: vercel({
    imageService: true,
    isr: {
      expiration: 60,
    },
  }),
  integrations: [react()],
  server: {
    host: true
  },
  vite: {
    plugins: [tailwindcss()],
    server: {
      host: true,
      allowedHosts: ["spaceship3000.milind.dev"]
    }
  },

  markdown: {
    remarkPlugins: [remarkObsidianExcalidraw, remarkObsidianLinks],
    shikiConfig: {
      theme: 'dracula',
      wrap: true
    }
  }
});
