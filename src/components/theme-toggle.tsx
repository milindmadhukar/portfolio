"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { useEffect, useState } from "react"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const baseClass =
    "fixed top-6 right-6 z-50 glass-morphism border-primary/30 hover:border-primary/60 transition-all duration-300 shadow-[0_0_20px_-10px_var(--ring)] hover:shadow-[0_0_30px_-8px_var(--ring)]"

  const IconWrap = ({ children }: { children: React.ReactNode }) => (
    <div className="relative flex items-center justify-center h-5 w-5">
      {children}
    </div>
  )

  if (!mounted) {
    return (
      <Button variant="outline" size="icon" className={baseClass} aria-label="Toggle theme">
        <IconWrap>
          <Sun className="h-5 w-5" />
        </IconWrap>
      </Button>
    )
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className={baseClass}
      aria-label="Toggle theme"
    >
      <motion.div initial={false} animate={{ rotate: theme === "dark" ? 180 : 0 }} transition={{ duration: 0.3 }}>
        <IconWrap>
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </IconWrap>
      </motion.div>
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
