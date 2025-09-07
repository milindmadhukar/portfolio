"use client"

import { motion } from "framer-motion"
import { Github, Linkedin, Instagram, Mail, Music, Twitter } from "lucide-react"
import { Card } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"

export default function Home() {
  const socialLinks = [
    {
      name: "GitHub",
      url: "https://github.com/milindmadhukar",
      icon: Github,
      color: "hover:text-gray-900 dark:hover:text-gray-100",
      bgColor: "hover:bg-gray-100 dark:hover:bg-gray-800"
    },
    {
      name: "Email",
      url: "mailto:hey@milind.dev",
      icon: Mail,
      color: "hover:text-red-600 dark:hover:text-red-400",
      bgColor: "hover:bg-red-50 dark:hover:bg-red-900/20"
    },
    {
      name: "LinkedIn",
      url: "https://www.linkedin.com/in/milind-madhukar-0726b0211/",
      icon: Linkedin,
      color: "hover:text-blue-600 dark:hover:text-blue-400",
      bgColor: "hover:bg-blue-50 dark:hover:bg-blue-900/20"
    },
    {
      name: "Twitter",
      url: "https://x.com/milind_1504",
      icon: Twitter,
      color: "hover:text-sky-600 dark:hover:text-sky-400",
      bgColor: "hover:bg-sky-50 dark:hover:bg-sky-900/20"
    },
    {
      name: "Instagram",
      url: "https://www.instagram.com/milind_1504/",
      icon: Instagram,
      color: "hover:text-pink-600 dark:hover:text-pink-400",
      bgColor: "hover:bg-pink-50 dark:hover:bg-pink-900/20"
    },
    {
      name: "Spotify",
      url: "https://open.spotify.com/user/6zg8mjgm1xq8za6ye5uv4eyz3",
      icon: Music,
      color: "hover:text-green-600 dark:hover:text-green-400",
      bgColor: "hover:bg-green-50 dark:hover:bg-green-900/20"
    }
  ]

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900/20 dark:to-indigo-900/20">
      <ThemeToggle />
      
      <main className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12 max-w-4xl"
        >
          <motion.h1
            className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 gradient-text leading-tight"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            MILIND MADHUKAR
          </motion.h1>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mb-8"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Software Engineer
            </h2>
            <div className="text-lg md:text-xl lg:text-2xl text-muted-foreground leading-relaxed">
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 dark:from-blue-400 dark:via-purple-400 dark:to-indigo-400 bg-clip-text text-transparent font-semibold">
                Turning coffee into code, bugs into features, and dreams into digital reality.
              </span>
              <br />
              <span className="text-base md:text-lg mt-2 block text-muted-foreground/80">
                Building the future, one commit at a time ⚡
              </span>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-2xl w-full"
        >
          {socialLinks.map((social, index) => (
            <motion.a
              key={social.name}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group"
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.9 + index * 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
            >
              <Card className={`p-6 glass-morphism border-2 border-transparent hover:border-primary/30 transition-all duration-300 group-hover:shadow-xl group-hover:shadow-primary/10 ${social.bgColor}`}>
                <div className="flex flex-col items-center space-y-3">
                  <div className="relative">
                    <social.icon 
                      className={`h-8 w-8 transition-all duration-300 ${social.color} group-hover:scale-110`}
                    />
                    <motion.div
                      className="absolute inset-0 bg-current opacity-0 group-hover:opacity-20 rounded-full blur-lg"
                      initial={false}
                      whileHover={{ scale: 1.5, opacity: 0.3 }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <span className="text-sm font-semibold group-hover:text-primary transition-colors duration-300">
                    {social.name}
                  </span>
                </div>
              </Card>
            </motion.a>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.8 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-muted-foreground/60"
          >
            <div className="w-6 h-10 border-2 border-current rounded-full flex justify-center relative">
              <motion.div 
                className="w-1 h-3 bg-current rounded-full mt-2"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 1.4 }}
          className="absolute top-20 right-20 hidden lg:block"
        >
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-400/20 to-purple-600/20 dark:from-blue-500/10 dark:to-purple-500/10 animate-float"></div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 1.6 }}
          className="absolute bottom-32 left-20 hidden lg:block"
        >
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-400/20 to-cyan-600/20 dark:from-indigo-500/10 dark:to-cyan-500/10 animate-float" style={{animationDelay: '1s'}}></div>
        </motion.div>
      </main>
    </div>
  )
}