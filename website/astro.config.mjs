// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';

import { remarkObsidianLinks } from './src/plugins/remark-obsidian-links.js';
import { remarkObsidianExcalidraw } from './src/plugins/remark-obsidian-excalidraw.js';

// https://astro.build/config
export default defineConfig({
  site: 'https://milind.dev',
  output: 'server',
  adapter: node({
    mode: 'standalone',
  }),
  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp'
    }
  },
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
      themes: {
        light: 'catppuccin-latte',
        dark: 'catppuccin-mocha'
      },
      wrap: false
    }
  }
});
