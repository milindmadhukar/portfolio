- Some introduction on what this is
- Talk about how good and versatile obsidian is and since it is open source i love it
- Talk about how this website is built with astro for rendering markdown
- Talk about how expressing with images is important and tool of choice is excalidraw for ease of use and you guessed it, its open source and integrates well with obsidian
- Workflow diagram - I will make it leave place holder
- How is it actually done? explained down
- Create a new obsidian vault for blog
- Talk about git plugin and how evreything is version controlled
- Start of by creating a simple template called blog-post with front-matter data
- ---
title: {{name}}
description:
date: {{DATE:DD-MM-YYYY hh:mm A}}
tags: []
banner:
layout: ../../../layouts/BlogPost.astro
draft: true
---

We will be parsing and using this in the astro code

We use the Quick Add plugin and bind ctrl + n to open a pop-up to enter title which uses the template then runs slugify script and then runs file structure script to create the basic blog layout

### How does my workflow work
Whenever I refer to astro site, it is my portfolio on milind.dev, you can reword if you want
I have obsidian with my blog content with git
git has ctrl + shift +s to commit and sync
i make template
quick add plugin has the shortcut ctrl + n
this plugin takes in a title as input, takes the template and creates a folder, the folder gets slugified by the slugify script and then assets file structure is loaded
now I can start writing my blog
for excalidraw, I have set the settings to export the drawings as png for both dark mode and light mode which I can just import in my blog and the astro website is smart to extract that info and show the theme aware image to the user

the astro site has plugins which see the obsidian structure in the markdown file and replace the obsidian internal links to other posts, images from excalidraw and custom images added and shows them correct to the user

how i write blogs in dev:
there is a watcher on my astro site dev server, which pulls blog data on every change I do and puts it inside the src/pages/blog file structure, this is how astro serves its md files as html

how deployment to my site works
the astro site is hosted on vercel.
the astro website is another repo (seperate from the blog content repo) to host on vercel
I have a pre build step that clones the blog repo from github and places the blogs in the correct place, so every time it builds I have the latest blog content from the repo

when commiting inside the blog content repo I have set a deploy hook on vercel which I call on all pushes on the blog content commit, causing it to rebuild running the prebuild script and updating the fresh content again

Super robust, keeps the blog content private so that I can keep the astro site hosted
