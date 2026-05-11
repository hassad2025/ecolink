// components/Layout.js
import Head from "next/head"
import Link from "next/link"
import Navbar from "./Navbar"

export default function Layout({ children, title = "EcoLink", description = "Donnez une seconde vie à vos objets" }) {
  return (
    <>
      <Head>
        <title>{title} – EcoLink</title>
        <meta name="description" content={description} />
        <meta property="og:title"       content={`${title} – EcoLink`} />
        <meta property="og:description" content={description} />
        <meta property="og:type"        content="website" />
      </Head>

      <div className="min-h-screen flex flex-col">
        <Navbar />

        <main className="flex-1">
          {children}
        </main>

        <footer className="bg-eco-dark text-white py-10 mt-16">
          <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <p className="font-display text-xl font-semibold mb-2">🌿 EcoLink</p>
              <p className="text-sm text-green-200">
                Plateforme de don et d'échange d'objets entre étudiants.
              </p>
            </div>
            <div>
              <p className="font-semibold mb-3 text-sm uppercase tracking-wider text-green-300">Navigation</p>
              <div className="flex flex-col gap-2 text-sm text-green-100">
                <Link href="/recherche" className="hover:text-white">Rechercher</Link>
                <Link href="/publier"   className="hover:text-white">Publier une annonce</Link>
                <Link href="/impact"    className="hover:text-white">Mon impact</Link>
                <Link href="/a-propos"  className="hover:text-white">À propos</Link>
              </div>
            </div>
            <div>
              <p className="font-semibold mb-3 text-sm uppercase tracking-wider text-green-300">Contact</p>
              <p className="text-sm text-green-100">contact@ecolink.fr</p>
            </div>
          </div>
          <p className="text-center text-xs text-green-400 mt-8">
        
          </p>
        </footer>
      </div>
    </>
  )
}
