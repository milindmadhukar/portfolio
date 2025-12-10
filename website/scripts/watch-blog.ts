#!/usr/bin/env bun
/**
 * Watches the blog folder for changes and syncs them to src/pages/blog
 * Also runs Astro dev server
 */

import { watch } from 'fs';
import { execSync, spawn } from 'child_process';
import { existsSync } from 'fs';

let blogPath = process.env.BLOG_FOLDER_PATH;

if (!blogPath) {
  console.error('❌ BLOG_FOLDER_PATH not set in environment');
  process.exit(1);
}

// Expand ~ to home directory
if (blogPath.startsWith('~')) {
  const homeDir = process.env.HOME || process.env.USERPROFILE;
  blogPath = blogPath.replace('~', homeDir || '');
}

if (!existsSync(blogPath)) {
  console.error(`❌ Blog folder not found: ${blogPath}`);
  process.exit(1);
}

// Initial sync
try {
  execSync('bun run sync-blog', { stdio: 'pipe' });
} catch (error) {
  console.error('Initial sync failed');
  process.exit(1);
}

// Start Astro dev server in background
const astroProcess = spawn('astro', ['dev'], { 
  stdio: 'inherit',
  shell: true
});

// Watch for changes
let syncTimeout: NodeJS.Timeout | null = null;

watch(blogPath, { recursive: true }, (eventType, filename) => {
  if (!filename) return;
  
  // Ignore hidden files and system files
  if (filename.includes('.DS_Store') || 
      filename.includes('node_modules') || 
      filename.includes('.git') ||
      filename.includes('.obsidian')) {
    return;
  }

  console.log('Blog changes detected...');
  
  // Debounce syncs (wait 500ms after last change)
  if (syncTimeout) {
    clearTimeout(syncTimeout);
  }
  
  syncTimeout = setTimeout(() => {
    try {
      execSync('bun run sync-blog', { stdio: 'pipe' });
      console.log('Sync complete');
    } catch (error) {
      console.error('Sync failed');
    }
  }, 500);
});

// Handle cleanup on exit
process.on('SIGINT', () => {
  astroProcess.kill();
  process.exit(0);
});

// Keep the process running
process.stdin.resume();
