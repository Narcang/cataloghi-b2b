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
  const [mobileOpen, setMobileOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Gestione click esterno
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
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
          <Image src="/logo.png" alt="Ladiva Ceramica" width={140} height={50} style={{ objectFit: 'contain', filter: 'invert(1) brightness(2)' }} />
        </Link>

        {/* Desktop Nav */}
        <nav className="ladiva-nav-desktop">
          <div className="ladiva-dropdown" ref={dropdownRef}>
            <button
              className="ladiva-dropdown-trigger"
              onClick={() => setDropdownOpen(!dropdownOpen)}
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
                <div className="ladiva-dropdown-divider" />
                
                {user ? (
                  <>
                    <Link href="/dashboard" className="ladiva-dropdown-item" onClick={() => setDropdownOpen(false)}>
                      <LayoutDashboard size={16} />
                      La tua Dashboard
                    </Link>
                    <form action="/auth/signout" method="post" className="m-0 p-0 block">
                      <button type="submit" className="ladiva-dropdown-item w-full text-left text-[#060d41]">
                        <LogOut size={16} />
                        Esci dal Portale
                      </button>
                    </form>
                  </>
                ) : (
                  <>
                    <Link href="/login" className="ladiva-dropdown-item accent" onClick={() => setDropdownOpen(false)}>
                      <LogIn size={16} />
                      Accedi al Portale
                    </Link>
                    <Link href="/recupero-password" className="ladiva-dropdown-item" onClick={() => setDropdownOpen(false)}>
                      <KeyRound size={16} />
                      Recupera password
                    </Link>
                  </>
                )}
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
          <div className="ladiva-dropdown-divider" />
          
          {user ? (
            <>
              <Link href="/dashboard" className="ladiva-mobile-item" onClick={() => setMobileOpen(false)}>
                <LayoutDashboard size={18} />
                La tua Dashboard
              </Link>
              <form action="/auth/signout" method="post" className="m-0 p-0 block">
                <button type="submit" className="ladiva-mobile-item w-full text-left text-[#060d41]">
                  <LogOut size={18} />
                  Esci dal Portale
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="ladiva-mobile-item accent" onClick={() => setMobileOpen(false)}>
                <LogIn size={18} />
                Accedi al Portale
              </Link>
              <Link href="/recupero-password" className="ladiva-mobile-item" onClick={() => setMobileOpen(false)}>
                <KeyRound size={18} />
                Recupera password
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  )
}
