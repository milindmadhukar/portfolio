#!/usr/bin/env bun
/**
 * Syncs blog content from, in order of preference:
 * 1. Local folder (BLOG_FOLDER_PATH) for development
 * 2. The blog-content submodule, pinned to a commit — the normal path for builds
 * 3. GitHub repo (using GITHUB_TOKEN) — fallback for clones made without submodules
 */

import { join } from 'path';
import { readdir, cp, rm } from 'fs/promises';
import { existsSync } from 'fs';
import { execSync } from 'child_process';

const BLOG_DEST = join(process.cwd(), 'src/pages/blog');
const BLOG_SUBMODULE = join(process.cwd(), 'blog-content');
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
    } catch (error: any) {
      const stderr = error.stderr ? error.stderr.toString() : '';
      console.error('Git clone failed details:', stderr);
      throw new Error(`Git clone failed: ${error.message}`);
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

// An uninitialised submodule leaves an empty directory behind, which would
// otherwise sync zero posts and look like a success.
async function isCheckedOut(dir: string) {
  if (!existsSync(dir)) {
    return false;
  }

  const items = await readdir(dir);

  return items.length > 0;
}

async function main() {
  // Clean up old blog posts before syncing
  await cleanupBlogFolder();

  // Check for local folder first (development)
  let localPath = process.env.BLOG_FOLDER_PATH;
  const githubToken = process.env.GITHUB_TOKEN;

  // Expand ~ to home directory
  if (localPath && localPath.startsWith('~')) {
    const homeDir = process.env.HOME || process.env.USERPROFILE;
    localPath = localPath.replace('~', homeDir || '');
  }

  if (localPath && existsSync(localPath)) {
    console.log(`📁 Syncing blog from local folder: ${localPath}`);
    await syncFromLocal(localPath);
  } else if (await isCheckedOut(BLOG_SUBMODULE)) {
    console.log('📦 Syncing blog from the blog-content submodule');
    await syncFromLocal(BLOG_SUBMODULE);
  } else if (githubToken) {
    console.log('☁️  Syncing blog from GitHub (submodule not checked out)');
    await syncFromGitHub(githubToken);
  } else {
    console.error(
      'Error: no blog source available. Run `git submodule update --init website/blog-content`, ' +
      'or set BLOG_FOLDER_PATH, or set GITHUB_TOKEN and BLOG_REPO_URL.'
    );
    process.exit(1);
  }

  console.log('✓ Blog sync complete');
}

main();
