function calculateAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export const personalInfo = {
  name: "Milind Madhukar",
  birthDate: "2004-04-15",
  email: "hey@milind.dev",
  location: "Vellore, India",
  
  getAge() {
    return calculateAge(this.birthDate);
  },
  
  bio: {
    short: "Building fast backend systems and tinkering with Linux",
    long: `I'm a ${calculateAge("2004-04-15")} year old developer who gets way too excited about Linux, DevOps magic, system admin wizardry, and everything open source. When I'm not neck-deep in Neovim configs or homelabbing the night away, I'm either building blazingly fast backend systems or self-hosting things just because I can.

Oh, and I run a 100k+ EDM community on Instagram called @plusxhub where I share my love for electronic music with the world. Because why not, right?`,
  },
  
  tagline: "Linux Enthusiast • DevOps Nerd • Backend Builder • EDM Aficionado",
  
  social: [
    {
      name: "GitHub",
      url: "https://github.com/milindmadhukar",
      icon: "github",
      color: "cyber-cyan"
    },
    {
      name: "LinkedIn",
      url: "https://www.linkedin.com/in/milind-madhukar-0726b0211/",
      icon: "linkedin",
      color: "cyber-blue"
    },
    {
      name: "Email",
      url: "mailto:hey@milind.dev",
      icon: "mail",
      color: "cyber-purple"
    },
    {
      name: "Twitter",
      url: "https://x.com/milind_1504",
      icon: "twitter",
      color: "cyber-pink"
    },
    {
      name: "Instagram",
      url: "https://www.instagram.com/milind_1504/",
      icon: "instagram",
      color: "neon-orange"
    },
    {
      name: "@plusxhub",
      url: "https://www.instagram.com/plusxhub/",
      icon: "music",
      color: "neon-green",
      description: "100k+ EDM Community"
    }
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
    { name: "TypeScript", icon: "PLACEHOLDER", proficiency: 95 },
    { name: "JavaScript", icon: "PLACEHOLDER", proficiency: 95 },
    { name: "Python", icon: "PLACEHOLDER", proficiency: 85 },
    { name: "Go", icon: "PLACEHOLDER", proficiency: 80 },
    { name: "Rust", icon: "PLACEHOLDER", proficiency: 70 },
    { name: "Java", icon: "PLACEHOLDER", proficiency: 75 }
  ],
  "Frontend Development": [
    { name: "Next.js", icon: "PLACEHOLDER", proficiency: 90 },
    { name: "React", icon: "PLACEHOLDER", proficiency: 90 },
    { name: "TanStack Query", icon: "PLACEHOLDER", proficiency: 85 },
    { name: "TailwindCSS", icon: "PLACEHOLDER", proficiency: 95 },
    { name: "ShadCN/UI", icon: "PLACEHOLDER", proficiency: 85 },
    { name: "Radix UI", icon: "PLACEHOLDER", proficiency: 80 }
  ],
  "Backend Development": [
    { name: "Node.js", icon: "PLACEHOLDER", proficiency: 90 },
    { name: "FastAPI", icon: "PLACEHOLDER", proficiency: 85 },
    { name: "tRPC", icon: "PLACEHOLDER", proficiency: 85 },
    { name: "GraphQL", icon: "PLACEHOLDER", proficiency: 80 },
    { name: "gRPC", icon: "PLACEHOLDER", proficiency: 75 },
    { name: "Protocol Buffers", icon: "PLACEHOLDER", proficiency: 75 }
  ],
  "Databases": [
    { name: "PostgreSQL", icon: "PLACEHOLDER", proficiency: 90 },
    { name: "MongoDB", icon: "PLACEHOLDER", proficiency: 85 },
    { name: "SQLite", icon: "PLACEHOLDER", proficiency: 80 },
    { name: "Redis", icon: "PLACEHOLDER", proficiency: 85 },
    { name: "Drizzle ORM", icon: "PLACEHOLDER", proficiency: 85 },
    { name: "Prisma", icon: "PLACEHOLDER", proficiency: 90 }
  ],
  "DevOps & Infrastructure": [
    { name: "Docker", icon: "PLACEHOLDER", proficiency: 95 },
    { name: "Kubernetes", icon: "PLACEHOLDER", proficiency: 85 },
    { name: "Linux", icon: "PLACEHOLDER", proficiency: 95 },
    { name: "GCP", icon: "PLACEHOLDER", proficiency: 85 },
    { name: "Terraform", icon: "PLACEHOLDER", proficiency: 80 },
    { name: "CI/CD Pipelines", icon: "PLACEHOLDER", proficiency: 90 }
  ],
  "Tools & Platforms": [
    { name: "Git", icon: "PLACEHOLDER", proficiency: 95 },
    { name: "Turborepo", icon: "PLACEHOLDER", proficiency: 85 },
    { name: "Bun", icon: "PLACEHOLDER", proficiency: 90 },
    { name: "N8N", icon: "PLACEHOLDER", proficiency: 75 },
    { name: "Cloudflare Workers", icon: "PLACEHOLDER", proficiency: 80 },
    { name: "Vercel", icon: "PLACEHOLDER", proficiency: 90 },
    { name: "Railway", icon: "PLACEHOLDER", proficiency: 85 }
  ]
};
