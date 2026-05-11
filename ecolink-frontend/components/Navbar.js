// components/Navbar.js
import Link from "next/link"
import { useRouter } from "next/router"
import { useState } from "react"
import { useAuth } from "../context/AuthContext"

export default function Navbar() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  const links = [
    { href: "/recherche", label: "Rechercher" },
    { href: "/impact",    label: "Impact" },
    { href: "/a-propos",  label: "À propos" },
  ]

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🌿</span>
          <span className="font-display font-semibold text-eco-primary text-xl">EcoLink</span>
        </Link>

        {/* Navigation desktop */}
        <div className="hidden md:flex items-center gap-6">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`text-sm font-medium transition-colors ${
                router.pathname === l.href
                  ? "text-eco-primary"
                  : "text-gray-600 hover:text-eco-primary"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* Actions desktop */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <Link href="/publier" className="btn-primary text-sm">
                + Publier
              </Link>
              <Link href="/profil" className="text-sm font-medium text-gray-700 hover:text-eco-primary">
                Mon profil
              </Link>
              <button onClick={logout} className="text-sm text-gray-400 hover:text-red-500">
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <Link href="/connexion" className="btn-secondary text-sm">
                Connexion
              </Link>
              <Link href="/inscription" className="btn-primary text-sm">
                Inscription
              </Link>
            </>
          )}
        </div>

        {/* Bouton burger mobile */}
        <button
          className="md:hidden p-2 text-gray-600"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Menu mobile */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 pb-4 flex flex-col gap-3">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-gray-700 py-1"
              onClick={() => setMenuOpen(false)}
            >
              {l.label}
            </Link>
          ))}
          <hr className="border-gray-100" />
          {user ? (
            <>
              <Link href="/publier" className="btn-primary text-sm text-center">+ Publier</Link>
              <Link href="/profil"  className="text-sm text-gray-700">Mon profil</Link>
              <button onClick={logout} className="text-sm text-red-400 text-left">Déconnexion</button>
            </>
          ) : (
            <>
              <Link href="/connexion"  className="btn-secondary text-sm text-center">Connexion</Link>
              <Link href="/inscription" className="btn-primary text-sm text-center">Inscription</Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
