import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://milind.dev"),
  title: "Milind Madhukar — Software Engineer",
  description: "Crafting modern web experiences, systems, and tools.",
  keywords: [
    "Milind",
    "Madhukar",
    "Software Engineer",
    "Fullstack",
    "Next.js",
    "TypeScript",
    "React",
  ],
  openGraph: {
    type: "website",
    url: "https://milind.dev",
    title: "Milind Madhukar — Software Engineer",
    description: "Crafting modern web experiences, systems, and tools.",
    siteName: "milind.dev",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Milind Madhukar — Portfolio",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    creator: "@milind_1504",
    title: "Milind Madhukar — Software Engineer",
    description: "Crafting modern web experiences, systems, and tools.",
    images: ["/og.png"],
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
