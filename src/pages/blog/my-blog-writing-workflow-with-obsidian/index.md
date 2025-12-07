---
title: My blog writing workflow with Obsidian
description: Ever wondered how some people manage to write technical blogs without losing their minds juggling between a million tools? Well, buckle up because I'm about to show you my setup that's so smooth it's almost criminal.
date: 15-12-2025 10:12 PM
tags:
  - productivity
  - automation
banner: "[[banner.excalidraw.dark.png]]"
layout: ../../../layouts/BlogPost.astro
draft: true
---

## Why Obsidian is My Second Brain

Let me start by gushing about [Obsidian](https://obsidian.md/). I use Obsidian as my brain dump. Seriously, if I think of something even remotely useful, whether it's a random idea at 2 AM or a technical concept I want to explore, I create a note. Even if it sounds stupid in the moment, I write it down.

This might sound chaotic, but here's the thing: it allows me to let my thoughts flow freely and store them in an easily accessible, indexable way that I can reference later. It's like having a second brain that never forgets and always knows where you left that half-baked idea about database optimization from three months ago.

Obsidian handles markdown like a dream, and here's the kicker: it's built on open standards. No vendor lock-in, no proprietary formats. Just plain markdown files sitting on your computer, ready to be version controlled and backed up however you want. Being open source (well, the ecosystem at least) means there's a plugin for basically everything. Want to sync with git? There's a plugin. Want to create templates? Plugin. Want to automatically generate file structures? You guessed it, there's a plugin for that too.

## The Power Couple: Obsidian + Astro

My blog (the one you're reading right now on [milind.dev](https://milind.dev/blog)) is built with [Astro](https://astro.build/), a modern static site generator that's stupidly fast and handles markdown beautifully. The marriage between Obsidian and Astro is chef's kiss because I can write in my comfortable note-taking environment while Astro transforms those markdown files into blazing-fast HTML. Everything stays in sync automatically, which means I never have to manually copy-paste content or worry about formatting breaking.

## Drawing Makes Everything Better

Here's something I learned early on: a good diagram can explain in 30 seconds what would take me 300 words to write. That's where [Excalidraw](https://excalidraw.com/) comes in.

Excalidraw is this beautiful, minimalist drawing tool that creates sketchy, hand-drawn style diagrams. And yes, before you ask, it's open source too (I might have a type). The best part? There's an [Obsidian plugin for Excalidraw](https://github.com/zsviczian/obsidian-excalidraw-plugin) that integrates so seamlessly you'd think they were made for each other.

I've configured it to automatically export my drawings as PNGs for both light and dark themes. Here's the really cool part: if you're reading this on my site, try switching between light and dark mode (there's a toggle somewhere on the page). Watch the diagrams below change colors to match your theme. Pretty neat, right?

## The Workflow (How the Magic Happens)

![[workflow.excalidraw.dark.png]]

### Setting Up the Blog Vault

I created a dedicated Obsidian vault just for my blog content. Inside this vault, I've got a `_templates` folder with my blog post template, a `_scripts` folder with automation scripts, and individual folders for each blog post. Everything is version controlled with git using the [Obsidian Git plugin](https://github.com/denolehov/obsidian-git). I've bound `Ctrl+Shift+S` to commit and sync. Muscle memory is a beautiful thing.

### Creating a New Post

When inspiration strikes, I hit `Ctrl+N` which triggers the [QuickAdd plugin](https://github.com/chhoumann/quickadd). A popup appears asking for the blog post title. Once I enter it, QuickAdd works its magic: it grabs my template (which has frontmatter fields like title, description, date, tags, and the Astro layout reference), fills in the title and current timestamp, creates a new folder with that name, runs my custom slugify script to make the folder URL-friendly, and then runs another script to generate the file structure with an `_assets` folder and an `excalidraw` subfolder inside it.

All of this happens in under a second. No clicking through menus, no manual folder creation. Just `Ctrl+N`, type title, boom. Ready to write.

The slugify script (you can check it out at `~/Documents/Blog/_scripts/slugify.js`) takes a title like "My Awesome Blog Post" and transforms it into `my-awesome-blog-post` by normalizing unicode characters, converting to lowercase, replacing spaces with hyphens, and removing special characters. Clean, URL-friendly, SEO-happy.

### Writing Content and Embedding Assets

Now comes the fun part. I write my blog post in Obsidian using good old markdown. When I need to add a diagram, I create a new Excalidraw drawing in the `excalidraw` folder. The plugin automatically exports `.light.png` and `.dark.png` versions. In my markdown, I just reference it like `![[workflow.excalidraw]]` and both Obsidian and Astro know what to do. Obsidian shows it inline while I'm writing, and Astro will render it as a theme-aware image on the final site.

<!-- TODO: Add screenshot of typical blog post folder structure in Obsidian -->

## The Development Experience 

Now here's where things get really slick. When I'm actively writing a blog post, I run `bun run dev:watch` on my local Astro site. This starts two things: the Astro dev server and a file watcher that monitors my blog vault for changes.

Every time I save a file in Obsidian, the watcher (with 500ms debouncing to avoid triggering on rapid-fire saves) detects the change, runs the sync script, and copies the updated blog content to `src/pages/blog` in the Astro project. Astro's dev server sees the change and hot-reloads the browser. I literally see my changes appear almost instantly. Write, save, see result. The feedback loop is chef's kiss.

The sync script ([`scripts/sync-blog.ts`](https://github.com/milindmadhukar/portfolio/blob/main/scripts/sync-blog.ts)) is smart about what it copies. It skips hidden files, system files, templates, and scripts. It only grabs markdown files and blog post folders. It also cleans up old posts before syncing to ensure there's no stale content hanging around.

## The Translation Layer: Obsidian to Astro

Obsidian uses its own wikilink syntax (like `[[this]]`), while Astro expects standard markdown. That's where my custom remark plugins bridge the gap.

The [link translation plugin](https://github.com/milindmadhukar/portfolio/blob/main/src/plugins/remark-obsidian-links.js) converts Obsidian wikilinks to proper markdown links. `[[other-post]]` becomes a link to `/blog/other-post/`, `[[post|Custom Text]]` becomes `[Custom Text](/blog/post/)`, and `![[image.png]]` becomes an optimized image with lazy loading attributes.

The [Excalidraw plugin](https://github.com/milindmadhukar/portfolio/blob/main/src/plugins/remark-obsidian-excalidraw.js) does something cooler. It transforms `![[drawing.excalidraw]]` into a container div with both light and dark image variants. CSS handles showing the correct one based on the user's theme preference. This is how you get those smooth theme-switching diagrams I mentioned earlier.

<!-- TODO: Add code snippet showing the CSS for theme switching -->

## The Deployment Pipeline

Okay, so I've written my masterpiece in Obsidian. How does it get to the internet? Let me walk you through the journey from my local machine to milind.dev.

### Two Repositories, One Workflow

I have two separate GitHub repositories in this setup. The first is my private blog content repo (`milindmadhukar/blog`) which contains just markdown files and assets. The second is my public portfolio repo ([`milindmadhukar/portfolio`](https://github.com/milindmadhukar/portfolio)) which contains the Astro site code. This separation is intentional: I can keep my blog drafts and ideas private while keeping the website code open source.

### From Obsidian to GitHub

When I'm done writing or editing a post, I hit `Ctrl+Shift+S` in Obsidian. The Git plugin commits my changes and pushes them to the private blog repo on GitHub. Simple, quick, muscle memory.

### The Vercel Magic

Here's where it gets interesting. The portfolio repo is hosted on [Vercel](https://vercel.com/), which builds and deploys my site. In my [`package.json`](https://github.com/milindmadhukar/portfolio/blob/main/package.json), I have a `prebuild` script that runs before every build. This script calls [`sync-blog.ts`](https://github.com/milindmadhukar/portfolio/blob/main/scripts/sync-blog.ts) which checks for the `BLOG_REPO_GH_TOKEN` environment variable. When it finds it (which it does in production on Vercel), the script clones my private blog repo using that token for authentication, copies all the blog content to `src/pages/blog`, and then cleans up the temporary clone. The regular Astro build process then picks up from there.

But how does Vercel know when to rebuild? I've set up a [Vercel Deploy Hook](https://vercel.com/docs/concepts/git/deploy-hooks) that acts as a webhook URL. In my private blog repo's settings, I've configured GitHub to call this webhook whenever I push changes. So the complete flow is: I push to the blog repo, GitHub triggers the Vercel deploy hook, Vercel starts a new build, the prebuild script clones the latest blog content, Astro builds the site, and the new version goes live.

All automatic. All beautiful. I just write in Obsidian and hit `Ctrl+Shift+S`.

<!-- TODO: Add deployment flow diagram showing the complete pipeline -->

## Why This Setup Rocks

Let me count the ways:

**Friction-free writing**: I just open Obsidian and write. No context switching, no fighting with a CMS, no waiting for a web interface to load. Just pure writing.

**Version control for everything**: Everything lives in git. I can roll back bad edits, see what I wrote three months ago, track changes over time, and never worry about losing work.

**Privacy meets public**: My blog content stays private until I'm ready to publish, but the site code is open source. Best of both worlds. I can experiment with drafts and half-baked ideas without them being public.

**Fast feedback during development**: Changes appear in the browser almost instantly while developing. The tight feedback loop keeps me in the flow state.

**Theme-aware assets**: Diagrams automatically match the user's theme preference. Try it right now if you haven't already. Toggle your theme and watch the diagrams above change colors. It's the little things.

**Zero vendor lock-in**: It's all markdown files sitting on my computer. If I ever want to migrate to a different platform, I can. No export tools needed, no conversion scripts. Just move the files.

**Automation everywhere**: From creating posts to deploying to production, it's all automated. The only manual steps are writing and hitting `Ctrl+Shift+S`.

## The Stack Summary

For those who skim to the end:

**Writing**: [Obsidian](https://obsidian.md/) with plugins for Git, QuickAdd, and Excalidraw

**Site Generator**: [Astro](https://astro.build/) with custom remark plugins for translating Obsidian syntax

**Hosting**: [Vercel](https://vercel.com/)

**Version Control**: GitHub with separate repos for content (private) and site code (public)

**Package Manager**: [Bun](https://bun.sh/) because it's ridiculously fast

**Drawing**: [Excalidraw](https://excalidraw.com/) for hand-drawn style diagrams

## Want to Build Something Similar?

The entire Astro site code is available on my [portfolio repo](https://github.com/milindmadhukar/portfolio). Key files worth checking out:

[`astro.config.mjs`](https://github.com/milindmadhukar/portfolio/blob/main/astro.config.mjs) for the Astro configuration with custom plugins

[`scripts/sync-blog.ts`](https://github.com/milindmadhukar/portfolio/blob/main/scripts/sync-blog.ts) for the sync magic that bridges local and production

[`scripts/watch-blog.ts`](https://github.com/milindmadhukar/portfolio/blob/main/scripts/watch-blog.ts) for the development file watcher

[`src/plugins/remark-obsidian-links.js`](https://github.com/milindmadhukar/portfolio/blob/main/src/plugins/remark-obsidian-links.js) for link translation from Obsidian to markdown

[`src/plugins/remark-obsidian-excalidraw.js`](https://github.com/milindmadhukar/portfolio/blob/main/src/plugins/remark-obsidian-excalidraw.js) for theme-aware diagram handling

The beauty of this setup is it's modular. You can steal bits and pieces that work for you without adopting the whole thing. Maybe you just want the Obsidian to Astro sync script, or maybe you only care about the theme-aware Excalidraw plugin. Take what you need.

## Final Thoughts

Building this workflow took some upfront time, but it's paid dividends. I can now go from random 2 AM idea to published post in one smooth flow without ever leaving my writing environment. The friction is basically zero.

The best tools are the ones that get out of your way and let you focus on the work. This setup does exactly that. Obsidian lets me think and write freely, the automation handles the busywork, and Astro makes it all fast and beautiful on the web.

Now if you'll excuse me, I have more blogs to write. And with this workflow, I might actually write them.

Happy blogging!

<!-- TODO: Add conclusion diagram or workflow summary image -->
