'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronDown, Menu, X, BookOpen, Phone, MapPin, LogIn, LogOut, LayoutDashboard, KeyRound } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { User } from '@supabase/supabase-js'

const menuItems = [
  {
    label: 'Cataloghi',
    href: '/dashboard#cataloghi',
    icon: BookOpen,
  },
  {
    label: 'Contatti Diretti',
    href: '/dashboard#contatti',
    icon: Phone,
  },
  {
    label: 'Dove Siamo',
    href: '/dove-siamo',
    icon: MapPin,
  },
]

export default function Header() {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const accountMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Gestione click esterno
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setDropdownOpen(false)
      }
      if (accountMenuRef.current && !accountMenuRef.current.contains(target)) {
        setAccountMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    
    // Gestione stato autenticazione
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      subscription.unsubscribe()
    }
  }, [])

  return (
    <header className="ladiva-header">
      <div className="ladiva-header-inner">
        {/* Logo */}
        <Link href="/" className="ladiva-logo">
          <Image src="/logo.png" alt="Ladiva Ceramica" width={140} height={50} style={{ objectFit: 'contain', filter: 'brightness(0)' }} />
        </Link>

        <div className="ladiva-header-actions">
          <div className="ladiva-header-auth">
            {user ? (
              <div className="ladiva-account-menu" ref={accountMenuRef}>
                <div className="ladiva-account-trigger-row">
                  <Link
                    href="/dashboard"
                    className="ladiva-account-link-main"
                    onClick={() => {
                      setAccountMenuOpen(false)
                      setDropdownOpen(false)
                    }}
                  >
                    <LayoutDashboard size={16} aria-hidden />
                    Area Riservata
                  </Link>
                  <button
                    type="button"
                    className="ladiva-account-chevron-btn"
                    onClick={() => {
                      setAccountMenuOpen(!accountMenuOpen)
                      setDropdownOpen(false)
                    }}
                    aria-expanded={accountMenuOpen}
                    aria-haspopup="menu"
                    aria-controls="ladiva-account-menu-panel"
                    aria-label="Apri menu per uscire"
                  >
                    <ChevronDown size={16} className={`ladiva-chevron ${accountMenuOpen ? 'open' : ''}`} />
                  </button>
                </div>
                {accountMenuOpen ? (
                  <div
                    id="ladiva-account-menu-panel"
                    className="ladiva-dropdown-menu ladiva-account-dropdown-panel"
                    role="menu"
                  >
                    <form action="/auth/signout" method="post" className="m-0 block w-full p-0">
                      <button type="submit" className="ladiva-dropdown-item w-full text-left text-[#060d41]" role="menuitem">
                        <LogOut size={16} aria-hidden />
                        Esci
                      </button>
                    </form>
                  </div>
                ) : null}
              </div>
            ) : (
              <>
                <Link href="/login" className="ladiva-header-auth-link ladiva-header-auth-link--primary">
                  <LogIn size={16} aria-hidden />
                  Accedi al Portale
                </Link>
                <Link href="/recupero-password" className="ladiva-header-auth-link ladiva-header-auth-link--muted">
                  <KeyRound size={16} aria-hidden />
                  Recupera password
                </Link>
              </>
            )}
          </div>

          {/* Desktop Nav */}
          <nav className="ladiva-nav-desktop">
            <div className="ladiva-dropdown" ref={dropdownRef}>
              <button
                className="ladiva-dropdown-trigger"
                onClick={() => {
                  setDropdownOpen(!dropdownOpen)
                  setAccountMenuOpen(false)
                }}
                aria-expanded={dropdownOpen}
              >
                Menu <ChevronDown size={16} className={`ladiva-chevron ${dropdownOpen ? 'open' : ''}`} />
              </button>

              {dropdownOpen && (
                <div className="ladiva-dropdown-menu">
                  {menuItems.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="ladiva-dropdown-item"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <item.icon size={16} />
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </nav>

          {/* Mobile Hamburger */}
          <button
            className="ladiva-hamburger"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="ladiva-mobile-menu">
          {menuItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="ladiva-mobile-item"
              onClick={() => setMobileOpen(false)}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  )
}
