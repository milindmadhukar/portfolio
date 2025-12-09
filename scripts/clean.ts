#!/usr/bin/env bun
/**
 * Cleans build artifacts and cache files before running dev server
 */

import { rm } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

const pathsToDelete = [
  'dist',
  '.astro',
  'node_modules/.astro',
  '.vercel'
];

async function clean() {
  console.log('🧹 Cleaning project...');

  for (const path of pathsToDelete) {
    const fullPath = join(process.cwd(), path);

    try {
      if (existsSync(fullPath)) {
        await rm(fullPath, { recursive: true, force: true });
        console.log(`✓ Deleted ${path}`);
      }
    } catch (error) {
      console.error(`✗ Failed to delete ${path}:`, error);
    }
  }

  console.log('✨ Clean complete!');
}

clean();
