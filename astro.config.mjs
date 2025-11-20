// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import react from '@astrojs/react';

import { remarkObsidianImage } from './src/plugins/remark-obsidian-image.js';

// https://astro.build/config
export default defineConfig({
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
    remarkPlugins: [remarkObsidianImage],
  },

  integrations: [react()]
});
