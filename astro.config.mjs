// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import { remarkObsidianLinks } from './src/plugins/remark-obsidian-links.js';

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
    remarkPlugins: [remarkObsidianLinks],
    shikiConfig: {
      theme: 'dracula',
      wrap: true
    }
  },
  
  image: {
    // Enable image optimization for all images
    service: {
      entrypoint: 'astro/assets/services/sharp'
    }
  }
});
