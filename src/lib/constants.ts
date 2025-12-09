import { calculateAge } from "./date";

export const TERMINAL_CONFIG = {
  user: "portfolio",
  host: "milind.dev",
};

export const BIRTH_DATE = "2004-04-15";

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
    short: "Building fast backend systems and tinkering with Linux",
    long: `I'm a ${calculateAge(BIRTH_DATE)} year old developer who gets way too excited about Linux, DevOps magic, system admin wizardry, and everything open source. When I'm not neck-deep in Neovim configs or homelabbing the night away, I'm either building blazingly fast backend systems or self-hosting things just because I can.

Currently orchestrating chaos at scale with containers, because who needs stability when you can have Docker networks that make sense only to you?`,
  },

  tagline: "Linux Enthusiast • DevOps Nerd • Backend Builder • Homelab Wizard",

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

export const projects = [
  {
    id: "dreamteam",
    title: "DreamTeam - IPL Auction Portal",
    description: "Engineered comprehensive auction simulation platform handling 500+ concurrent users with WebSocket-powered real-time bidding",
    longDescription: "A full-stack auction simulation platform built for IPL fantasy leagues, featuring real-time bidding, player statistics, and multi-room support.",
    technologies: ["TypeScript", "Next.js", "WebSocket", "PostgreSQL", "Redis"],
    highlights: [
      "Integrated player statistics API serving 200+ player profiles with sub-100ms response times",
      "Delivered full-stack solution supporting 50+ simultaneous auction rooms with zero downtime during peak usage",
      "Handled 500+ concurrent users with real-time bidding functionality"
    ],
    links: {
      github: "https://github.com/milindmadhukar/dreamteam",
      demo: null
    },
    featured: true,
    tags: ["Full-Stack", "Real-Time", "WebSocket"]
  },
  {
    id: "raytracer",
    title: "Golang RayTracer",
    description: "High-performance ray tracing engine in Go with advanced lighting models and parallel processing",
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
    id: "prismvault",
    title: "PrismVault - Cloud Backup Solution",
    description: "Enterprise-grade backup platform supporting multiple cloud providers with AES-256 encryption",
    longDescription: "A comprehensive cloud backup solution with multi-provider support, encryption, and intelligent backup algorithms.",
    technologies: ["Node.js", "AWS S3", "Google Drive API", "Dropbox API", "Encryption"],
    highlights: [
      "Architected enterprise-grade backup platform supporting AWS S3, Google Drive, and Dropbox",
      "Built auto-scaling microservices handling 100GB+ daily backup volumes across 500+ client accounts",
      "Implemented incremental backup algorithms reducing storage costs by 40% and backup times by 65%"
    ],
    links: {
      github: null,
      demo: null
    },
    featured: true,
    tags: ["Cloud", "Security", "Microservices"]
  },
  {
    id: "martin-garrix-bot",
    title: "Martin Garrix Discord Bot",
    description: "Discord bot serving 6,000+ users across 150+ servers with music features and 24/7 uptime",
    longDescription: "A feature-rich Discord bot for music playback, integrating with Spotify and YouTube APIs.",
    technologies: ["Python", "Discord.py", "Spotify API", "YouTube API"],
    highlights: [
      "Deployed Discord bot serving 6,000+ users across 150+ servers with 24/7 uptime",
      "Integrated Spotify and YouTube APIs processing 10,000+ music requests daily with intelligent caching",
      "Maintained 99.8% uptime through robust error handling and automated failover mechanisms"
    ],
    links: {
      github: "https://github.com/milindmadhukar/MartinGarrixBot/",
      demo: null
    },
    featured: false,
    tags: ["Python", "Discord", "API Integration"]
  }
];

export const experience = [
  {
    id: "grass-labs",
    title: "DevOps Lead",
    company: "Grass Labs Pte Ltd",
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
