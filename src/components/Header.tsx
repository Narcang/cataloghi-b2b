'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronDown, Menu, X, BookOpen, Phone, MapPin, LogIn } from 'lucide-react'

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
    href: '#dove-siamo',
    icon: MapPin,
  },
]

export default function Header() {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
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
                <Link href="/login" className="ladiva-dropdown-item accent" onClick={() => setDropdownOpen(false)}>
                  <LogIn size={16} />
                  Accedi al Portale
                </Link>
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
          <Link href="/login" className="ladiva-mobile-item accent" onClick={() => setMobileOpen(false)}>
            <LogIn size={18} />
            Accedi al Portale
          </Link>
        </div>
      )}
    </header>
  )
}
