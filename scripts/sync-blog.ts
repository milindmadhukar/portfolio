#!/usr/bin/env bun
/**
 * Syncs blog content from either:
 * 1. Local folder (BLOG_FOLDER_PATH) for development
 * 2. GitHub repo (using BLOG_REPO_GH_TOKEN) for production builds
 */

import { join } from 'path';
import { readdir, cp, rm } from 'fs/promises';
import { existsSync } from 'fs';
import { execSync } from 'child_process';

const BLOG_DEST = join(process.cwd(), 'src/pages/blog');
// Get this from env
const BLOG_REPO_URL = process.env.BLOG_REPO_URL || '';

// Files/folders to exclude from sync
const EXCLUDE_ITEMS = ['index.astro', '.DS_Store', 'node_modules', '.git', 'README.md', '.obsidian', 'Excalidraw', '_templates', '_scripts', "AGENTS.md"];

// Files to keep in blog destination (won't be deleted during cleanup)
const KEEP_FILES = ['index.astro', 'rss.xml.ts'];

async function cleanupBlogFolder() {
  console.log('🧹 Cleaning up old blog posts...');
  
  try {
    if (!existsSync(BLOG_DEST)) {
      return; // Nothing to clean
    }

    const items = await readdir(BLOG_DEST, { withFileTypes: true });
    
    for (const item of items) {
      // Skip files/folders we want to keep
      if (KEEP_FILES.includes(item.name)) {
        continue;
      }

      const itemPath = join(BLOG_DEST, item.name);
      
      await rm(itemPath, { recursive: true, force: true });
    }
    
    console.log('✓ Cleanup complete');
  } catch (error) {
    console.error('Error cleaning up blog folder:', error);
    throw error;
  }
}

async function syncFromLocal(sourcePath: string) {
  if (!existsSync(sourcePath)) {
    console.error('Error: Local blog folder not found:', sourcePath);
    process.exit(1);
  }

  try {
    const items = await readdir(sourcePath, { withFileTypes: true });
    
    for (const item of items) {
      if (item.name.startsWith('.') || EXCLUDE_ITEMS.includes(item.name)) {
        continue;
      }

      const itemSourcePath = join(sourcePath, item.name);
      const destPath = join(BLOG_DEST, item.name);

      if (item.isDirectory() || item.name.endsWith('.md')) {
        if (existsSync(destPath)) {
          await rm(destPath, { recursive: true, force: true });
        }
        
        await cp(itemSourcePath, destPath, { recursive: true });
      }
    }
  } catch (error) {
    console.error('Error syncing local blog:', error);
    process.exit(1);
  }
}

async function syncFromGitHub(token: string) {
  const tempDir = join(process.cwd(), 'blog-content-temp');
  
  try {
    if (existsSync(tempDir)) {
      await rm(tempDir, { recursive: true, force: true });
    }

    const repoUrlWithAuth = BLOG_REPO_URL.replace(
      'https://',
      `https://${token}@`
    );
    
    try {
      execSync(`git clone --depth 1 ${repoUrlWithAuth} ${tempDir}`, {
        stdio: 'pipe'
      });
    } catch (error) {
      throw new Error(`Git clone failed: ${error}`);
    }

    // Copy content to blog folder
    const items = await readdir(tempDir, { withFileTypes: true });
    
    for (const item of items) {
      if (item.name.startsWith('.') || EXCLUDE_ITEMS.includes(item.name)) {
        continue;
      }

      const itemSourcePath = join(tempDir, item.name);
      const destPath = join(BLOG_DEST, item.name);

      if (item.isDirectory() || item.name.endsWith('.md')) {
        // Remove existing and copy fresh
        if (existsSync(destPath)) {
          await rm(destPath, { recursive: true, force: true });
        }
        
        await cp(itemSourcePath, destPath, { recursive: true });
      }
    }

    // Clean up temp directory
    await rm(tempDir, { recursive: true, force: true });
  } catch (error) {
    console.error('Error syncing from GitHub:', error);
    
    // Clean up on error
    if (existsSync(tempDir)) {
      await rm(tempDir, { recursive: true, force: true });
    }
    
    process.exit(1);
  }
}

async function main() {
  // Clean up old blog posts before syncing
  await cleanupBlogFolder();
  
  // Check for local folder first (development)
  let localPath = process.env.BLOG_FOLDER_PATH;
  const githubToken = process.env.BLOG_REPO_GH_TOKEN;

  // Expand ~ to home directory
  if (localPath && localPath.startsWith('~')) {
    const homeDir = process.env.HOME || process.env.USERPROFILE;
    localPath = localPath.replace('~', homeDir || '');
  }

  if (localPath && existsSync(localPath)) {
    await syncFromLocal(localPath);
  } else if (githubToken) {
    await syncFromGitHub(githubToken);
  }
}

main();
