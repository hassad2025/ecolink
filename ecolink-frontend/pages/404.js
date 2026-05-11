// pages/404.js
import Link from "next/link"
import Layout from "../components/Layout"

export default function NotFound() {
  return (
    <Layout title="Page introuvable">
      <div className="min-h-[70vh] flex items-center justify-center px-4 text-center">
        <div>
          <p className="text-7xl mb-4">🌿</p>
          <h1 className="font-display text-5xl font-semibold text-gray-900 mb-3">404</h1>
          <p className="text-gray-500 mb-8">Cette page n'existe pas ou a été déplacée.</p>
          <div className="flex gap-3 justify-center">
            <Link href="/"         className="btn-primary">Retour à l'accueil</Link>
            <Link href="/recherche" className="btn-secondary">Rechercher un objet</Link>
          </div>
        </div>
      </div>
    </Layout>
  )
}
