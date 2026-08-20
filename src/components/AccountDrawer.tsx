import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { LogOut, Menu, Plus, Shield, X } from 'lucide-react'
import { useAuth } from '@/auth/AuthProvider'
import { isAdminEmail } from '@/config/admin'
import { cn } from '@/lib/utils'

const rowClass =
  'flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left text-sm text-forest transition-colors hover:bg-sand-100'

export function AccountDrawer() {
  const { profile, signOut } = useAuth()
  const admin = isAdminEmail(profile?.email)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [open])

  return (
    <>
      <button
        type="button"
        aria-label="Open menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-sand-500 transition-colors hover:bg-sand-100 hover:text-forest"
      >
        <Menu className="size-5" />
      </button>
      {createPortal(
        <AnimatePresence>
          {open ? (
            <>
              <motion.button
                type="button"
                aria-label="Close menu"
                className="fixed inset-0 z-40 cursor-pointer bg-ink/30"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setOpen(false)}
              />
              <motion.aside
                role="dialog"
                aria-modal="true"
                aria-label="Account menu"
                className="fixed inset-y-0 right-0 z-50 flex h-dvh w-72 max-w-[85vw] flex-col border-l border-sand-200 bg-paper"
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', stiffness: 380, damping: 36 }}
              >
                <div className="flex items-center justify-between gap-3 border-b border-sand-200 px-4 py-3">
                  <p className="truncate text-sm font-medium text-forest">{profile?.displayName}</p>
                  <button
                    type="button"
                    aria-label="Close menu"
                    onClick={() => setOpen(false)}
                    className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-sand-500 transition-colors hover:bg-sand-100 hover:text-forest"
                  >
                    <X className="size-5" />
                  </button>
                </div>
                <nav className="flex flex-1 flex-col py-2">
                  <Link to="/trips/new" className={rowClass} onClick={() => setOpen(false)}>
                    <Plus className="size-4 text-sand-500" />
                    New trip
                  </Link>
                  {admin ? (
                    <Link to="/admin" className={rowClass} onClick={() => setOpen(false)}>
                      <Shield className="size-4 text-sand-500" />
                      Admin
                    </Link>
                  ) : null}
                  <button
                    type="button"
                    className={cn(rowClass, 'text-sand-600')}
                    onClick={() => {
                      setOpen(false)
                      void signOut()
                    }}
                  >
                    <LogOut className="size-4 text-sand-500" />
                    Sign out
                  </button>
                </nav>
              </motion.aside>
            </>
          ) : null}
        </AnimatePresence>,
        document.body,
      )}
    </>
  )
}
