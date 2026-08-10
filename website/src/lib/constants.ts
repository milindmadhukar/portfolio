import { calculateAge, yearsSince } from "./date";

export const TERMINAL_CONFIG = {
  user: "portfolio",
  host: "milind.dev",
};

export const BIRTH_DATE = "2004-04-15";
export const GARRIX_FAN_SINCE = "2016-01-01";
export const EXPERIENCE_START_DATE = "2024-07-01";

export const SOCIAL_CONFIG: Record<string, { icon: string; color: string }> = {
  github: { icon: "nf-fa-github", color: "#6e5494" },
  linkedin: { icon: "nf-fa-linkedin", color: "#0077b5" },
  mail: { icon: "nf-md-email", color: "#D14836" },
  twitter: { icon: "nf-fa-twitter", color: "#1DA1F2" },
  instagram: { icon: "nf-fa-instagram", color: "#E1306C" },
  spotify: { icon: "nf-fa-spotify", color: "#1DB954" },
  discord: { icon: "nf-fa-discord", color: "#5865F2" },
};

export const CACHE_FILE_PATH = "node_modules/.github-cache.json";
export const GITHUB_USERNAME = "milindmadhukar";
export const GITHUB_API_URL = "https://api.github.com";
export const DISCORD_ID = "421608483629301772"

export const personalInfo = {
  name: "Milind Madhukar",
  birthDate: BIRTH_DATE,
  email: "hey@milind.dev",
  location: "Mumbai, India",

  getAge() {
    return calculateAge(this.birthDate);
  },

  bio: {
    short: "I build useful software and tinker with anything that has a chip in it.",
    // One line per line - both surfaces render this broken up rather than as
    // prose, and it follows the blog's lowercase house style.
    long: `${calculateAge(BIRTH_DATE)} years old. hooked on tech before i could spell it.
gadgets, phones, servers. if it has a chip, i've opened it.
learned to code by breaking things. method unchanged.
now i build software people actually use, which is progress.

off screen: soldering dumb little circuits, purely because i can.
and music. die-hard martin garrix fan since 2016, ${yearsSince(GARRIX_FAN_SINCE)} years deep.
i run plusxhub, a 100k+ instagram community for fans like me.`,
  },

  tagline: "Developer • Hardware tinkerer • Music obsessive",

  // Purpose-built strings for SEO / social cards, in my own voice.
  // seoTitle drives <title> + og:title (~60 chars, uses the SERP space well).
  seoTitle: "Milind Madhukar: I build useful software people actually use",
  // seoDescription drives <meta name="description"> (~148 chars for the snippet).
  seoDescription:
    "I'm Milind, a developer and DevOps engineer from Mumbai. I build genuinely useful software and tinker with just about anything that has a chip in it.",
  // ogDescription drives og:/twitter: descriptions (~114 chars, the social sweet spot).
  ogDescription:
    "Developer and DevOps engineer building genuinely useful software, and tinkering with anything that has a chip in it.",

  links: {
    plusxhub: "https://www.instagram.com/plusxhub/",
    garrixPlaylist: "https://open.spotify.com/playlist/4lL415o4NDd2cOm2OSF6TS",
  },

  social: [
    {
      name: "GitHub",
      url: "https://github.com/milindmadhukar",
      icon: "github"
    },
    {
      name: "LinkedIn",
      url: "https://www.linkedin.com/in/milind-madhukar-0726b0211/",
      icon: "linkedin"
    },
    {
      name: "Email",
      url: "mailto:hey@milind.dev",
      icon: "mail"
    },
    {
      name: "Twitter",
      url: "https://x.com/milind_1504",
      icon: "twitter"
    },
    {
      name: "Instagram",
      url: "https://www.instagram.com/milind_1504/",
      icon: "instagram"
    },
    {
      name: "Spotify",
      url: "https://open.spotify.com/user/6zg8mjgm1xq8za6ye5uv4eyz3",
      icon: "spotify"
    },
    {
      name: "Discord",
      url: "https://discord.com/users/" + DISCORD_ID,
      icon: "discord"
    },
  ]
};

// `description` is the one-liner in the `ls projects/` listing — it sits in a
// column ~40 chars in, so keep it under ~50 chars or the row wraps past 80
// columns on SSH. `longDescription` is the expanded body on the web.
export const projects = [
  {
    id: "kora",
    title: "Kora - Reading Feed",
    description: "A reading feed for articles, highlights, and notes",
    longDescription: "A reading feed where curious people share the articles they save, the lines they highlight, and the notes they take.",
    technologies: ["Go", "TypeScript", "React", "PostgreSQL"],
    highlights: [
      "Built the full stack — Go API and scraper, React web app, browser extension, and mobile app",
      "Full-text search and RSS ingestion across every saved article and highlight",
      "Public RPC API so a library can be driven programmatically"
    ],
    links: {
      github: null,
      demo: "https://kora.sh"
    },
    featured: true,
    tags: ["Full-Stack", "Go", "Reading"]
  },
  {
    id: "martin-garrix-bot",
    title: "Martin Garrix Discord Bot",
    description: "Discord bot for 6,000+ users across 150+ servers",
    longDescription: "A multipurpose Discord bot built for the Martin Garrix community — music playback, fan trivia, levelling, and a lyrics engine. Rewritten from Python to Go and still running 24/7.",
    technologies: ["Go", "DiscordGo", "PostgreSQL", "Spotify API"],
    highlights: [
      "Serves 6,000+ users across 150+ servers with 24/7 uptime",
      "Processes 10,000+ music requests daily with intelligent caching",
      "Rewritten from Python to Go for lower memory use and faster startup"
    ],
    links: {
      github: "https://github.com/milindmadhukar/MartinGarrixBot",
      demo: null
    },
    featured: true,
    tags: ["Go", "Discord", "API Integration"]
  },
  {
    id: "piston-stack",
    title: "Piston Stack",
    description: "Code execution engine, Go client, and a playground UI",
    longDescription: "Three pieces around Piston, the sandboxed code-execution engine: a fork of the engine itself, an idiomatic Go client for it, and a browser playground that runs 80+ languages with full execution stats and interactive stdin.",
    technologies: ["Go", "TypeScript", "React", "Docker"],
    highlights: [
      "Playground runs 80+ languages in the browser on a Monaco editor, with interactive stdin",
      "go-piston is a typed, chainable client covering the full API, and the most starred of my Go libraries",
      "Runs on my own fork of the execution engine rather than a public instance"
    ],
    links: {
      github: null,
      demo: "https://piston.milind.dev"
    },
    extraLinks: [
      { label: "piston-ui", url: "https://github.com/milindmadhukar/piston-ui" },
      { label: "piston (engine fork)", url: "https://github.com/milindmadhukar/piston" },
      { label: "go-piston", url: "https://github.com/milindmadhukar/go-piston" }
    ],
    featured: true,
    tags: ["Go", "Code Execution", "Full-Stack"]
  },
  {
    id: "stonksapi",
    title: "StonksAPI - Market Data API",
    description: "REST API for live stocks, crypto, and market news",
    longDescription: "A REST API that scrapes and serves live stock quotes, cryptocurrency prices, and market news from a single endpoint, so hobby projects don't need a paid data vendor.",
    technologies: ["Go", "go-chi", "Colly", "Astro"],
    highlights: [
      "Serves stock, crypto, and news data from one API with no key required",
      "Scrapes and normalises multiple upstream sources with Colly",
      "Documented and deployed with a companion docs site"
    ],
    links: {
      github: "https://github.com/milindmadhukar/stonksapi",
      demo: "https://stonksapi.milind.dev/"
    },
    extraLinks: [
      { label: "stonks.milind.dev", url: "https://stonks.milind.dev" }
    ],
    featured: true,
    tags: ["Go", "API", "Finance"]
  },
  {
    id: "raytracer",
    title: "Golang RayTracer",
    description: "Ray tracing engine in Go with parallel rendering",
    longDescription: "A from-scratch ray tracing engine built in Go, featuring advanced lighting, materials, and optimized parallel rendering.",
    technologies: ["Go", "Goroutines", "3D Graphics"],
    highlights: [
      "Developed high-performance ray tracing engine achieving 3x speed improvement through goroutine parallelization",
      "Rendered complex scenes with 1M+ rays per second using efficient data structures",
      "Implemented anti-aliasing, depth of field, and material systems supporting glass, metal, and diffuse surfaces"
    ],
    links: {
      github: "https://github.com/milindmadhukar/RayTracing",
      demo: null
    },
    featured: true,
    tags: ["Go", "Graphics", "Performance"]
  },
  {
    id: "dreamteam",
    title: "DreamTeam - IPL Auction Portal",
    description: "IPL auction sim with real-time WebSocket bidding",
    longDescription: "The auction portal used to run the DreamTeam IPL auction simulation — real-time bidding over WebSockets, player statistics, and multiple concurrent rooms.",
    technologies: ["TypeScript", "Next.js", "Go", "WebSocket", "PostgreSQL"],
    highlights: [
      "Handled 500+ concurrent users bidding in real time",
      "Supported 50+ simultaneous auction rooms with no downtime at peak",
      "Player statistics API serving 200+ profiles in under 100ms"
    ],
    links: {
      github: "https://github.com/milindmadhukar/dreamteam",
      demo: null
    },
    featured: true,
    tags: ["Full-Stack", "Real-Time", "WebSocket"]
  },
  {
    id: "go-musixmatch",
    title: "go-musixmatch",
    description: "Go wrapper for the Musixmatch lyrics API",
    longDescription: "A complete Go client for the Musixmatch API — track, artist, album, and lyrics lookups with typed responses and every optional query parameter mapped.",
    technologies: ["Go", "REST"],
    highlights: [
      "Covers the full Musixmatch API surface with typed responses",
      "Every optional query parameter exposed as a functional option"
    ],
    links: {
      github: "https://github.com/milindmadhukar/go-musixmatch",
      demo: "https://pkg.go.dev/github.com/milindmadhukar/go-musixmatch"
    },
    featured: false,
    tags: ["Go", "Library", "API Wrapper"]
  }
];

export const experience = [
  {
    id: "openfin",
    title: "Lead - AI Initiatives",
    company: "Openfin Technologies",
    website: "https://openfinventures.com",
    location: "Remote",
    type: "Full-time",
    startDate: "2024-04-01",
    endDate: null,
    current: true,
    description: "Leading DevOps infrastructure and deployment strategies for a high-traffic web platform",
    responsibilities: [
      "Designed and deployed microservices infrastructure on GCP using Docker and Kubernetes, supporting 1,000+ daily active users with 99.9% uptime",
      "Optimized CI/CD pipelines with Terraform automation, reducing deployment cycles from 45 minutes to 18 minutes (60% improvement)",
      "Established monitoring and alerting systems, decreasing incident response time by 50% and preventing 4 critical outages"
    ],
    technologies: ["GCP", "Docker", "Kubernetes", "Terraform", "CI/CD", "Monitoring"],
    achievements: [
      "60% reduction in deployment time",
      "99.9% uptime for 1,000+ DAU",
      "50% faster incident response"
    ]
  }
];

export const education = [
  {
    id: "vit",
    degree: "Bachelor of Technology in Computer Science",
    institution: "Vellore Institute of Technology",
    location: "Vellore, India",
    startDate: "2022-09-01",
    endDate: "2026-07-01",
    current: true,
    year: "4th Year",
    gpa: null,
    coursework: [
      "Data Structures & Algorithms",
      "Database Management Systems",
      "Operating Systems",
      "Computer Networks",
      "Software Engineering"
    ]
  }
];

export const skills = {
  "Programming Languages": [
    { name: "TypeScript", icon: "typescript" },
    { name: "JavaScript", icon: "javascript" },
    { name: "Python", icon: "python" },
    { name: "Go", icon: "go" },
    { name: "Rust", icon: "rust" },
    { name: "Java", icon: "openjdk" }
  ],
  "Frontend Development": [
    { name: "Next.js", icon: "nextdotjs" },
    { name: "React", icon: "react" },
    { name: "TanStack Query", icon: "reactquery" },
    { name: "TailwindCSS", icon: "tailwindcss" },
    { name: "ShadCN/UI", icon: "shadcnui" },
    { name: "Radix UI", icon: "radixui" }
  ],
  "Backend Development": [
    { name: "Node.js", icon: "nodedotjs" },
    { name: "FastAPI", icon: "fastapi" },
    { name: "tRPC", icon: "trpc" },
    { name: "GraphQL", icon: "graphql" },
  ],
  "Databases": [
    { name: "PostgreSQL", icon: "postgresql" },
    { name: "MongoDB", icon: "mongodb" },
    { name: "SQLite", icon: "sqlite" },
    { name: "Redis", icon: "redis" },
    { name: "Drizzle ORM", icon: "drizzle" },
    { name: "Prisma", icon: "prisma" }
  ],
  "DevOps & Infrastructure": [
    { name: "Docker", icon: "docker" },
    { name: "Kubernetes", icon: "kubernetes" },
    { name: "Linux", icon: "linux" },
    { name: "GCP", icon: "googlecloud" },
    { name: "Terraform", icon: "terraform" },
    { name: "CI/CD Pipelines", icon: "githubactions" }
  ],
  "Tools & Platforms": [
    { name: "Git", icon: "git" },
    { name: "Turborepo", icon: "turborepo" },
    { name: "Bun", icon: "bun" },
    { name: "N8N", icon: "n8n" },
    { name: "Cloudflare Workers", icon: "cloudflare" },
    { name: "Vercel", icon: "vercel" },
    { name: "Railway", icon: "railway" }
  ]
};
