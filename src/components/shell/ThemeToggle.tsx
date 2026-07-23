'use client'

import { useTheme } from '@/providers/ThemeProvider'
import { Sun, Moon, Laptop } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className={cn("relative inline-block", className)} ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-xl text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-2 text-xs font-bold"
        title="Design anpassen (Hell / Dunkel)"
        aria-label="Theme wechseln"
      >
        {resolvedTheme === 'dark' ? (
          <Moon size={18} className="text-teal-400" />
        ) : (
          <Sun size={18} className="text-amber-500" />
        )}
      </button>

      {open && (
        <div className="absolute bottom-full mb-2 left-0 w-36 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
          <button
            onClick={() => { setTheme('light'); setOpen(false); }}
            className={cn(
              "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors",
              theme === 'light'
                ? "bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-400"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            )}
          >
            <Sun size={15} className="text-amber-500" />
            <span>Hell</span>
          </button>
          <button
            onClick={() => { setTheme('dark'); setOpen(false); }}
            className={cn(
              "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors",
              theme === 'dark'
                ? "bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-400"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            )}
          >
            <Moon size={15} className="text-teal-400" />
            <span>Dunkel</span>
          </button>
          <button
            onClick={() => { setTheme('system'); setOpen(false); }}
            className={cn(
              "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors",
              theme === 'system'
                ? "bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-400"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            )}
          >
            <Laptop size={15} className="text-zinc-400" />
            <span>System</span>
          </button>
        </div>
      )}
    </div>
  )
}
