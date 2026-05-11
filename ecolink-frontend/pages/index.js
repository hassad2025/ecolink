// pages/index.js — Page d'accueil
import { useEffect, useState } from "react"
import Link from "next/link"
import Layout from "../components/Layout"
import AnnonceCard from "../components/AnnonceCard"
import { getRecentItems } from "../lib/api"

// Stats affichées sur la page d'accueil (chiffres fictifs pour la démo)
const STATS = [
  { emoji: "♻️", label: "Objets donnés",    value: "1 240" },
  { emoji: "🌱", label: "kg CO₂ économisé", value: "3 800" },
  { emoji: "👥", label: "Étudiants actifs",  value: "520" },
]

export default function Accueil() {
  const [annonces, setAnnonces] = useState([])
  const [loading, setLoading]   = useState(true)

  // Charger les 6 annonces les plus récentes
  useEffect(() => {
    getRecentItems(6)
      .then((res) => setAnnonces(res.data.items || res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <Layout title="Accueil" description="Donnez une seconde vie à vos objets entre étudiants">
      {/* ── HERO ──────────────────────────────────────── */}
      <section className="bg-eco-primary text-white py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="font-display text-4xl md:text-5xl font-semibold leading-tight mb-4">
            Donnez une seconde vie<br />à vos objets 🌿
          </h1>
          <p className="text-green-100 text-lg mb-8">
            EcoLink connecte les étudiants pour donner, échanger et recycler.
            Ensemble, réduisons notre impact.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/recherche" className="bg-white text-eco-primary font-semibold px-8 py-3 rounded-lg hover:bg-green-50 transition">
              Trouver un objet
            </Link>
            <Link href="/publier" className="border border-white text-white font-semibold px-8 py-3 rounded-lg hover:bg-eco-dark transition">
              Publier une annonce
            </Link>
          </div>
        </div>
      </section>

      {/* ── STATS ─────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 -mt-8">
        <div className="grid grid-cols-3 gap-4">
          {STATS.map((s) => (
            <div key={s.label} className="card p-6 text-center">
              <p className="text-3xl mb-1">{s.emoji}</p>
              <p className="text-2xl font-display font-semibold text-eco-primary">{s.value}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── ANNONCES RÉCENTES ─────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 mt-16 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl font-semibold text-gray-800">Annonces récentes</h2>
          <Link href="/recherche" className="text-sm text-eco-primary font-medium hover:underline">
            Voir tout →
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card h-64 animate-pulse bg-gray-100" />
            ))}
          </div>
        ) : annonces.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {annonces.map((a) => (
              <AnnonceCard key={a.id} annonce={a} />
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-12">
            Pas encore d'annonces. <Link href="/publier" className="text-eco-primary underline">Soyez le premier !</Link>
          </p>
        )}
      </section>
    </Layout>
  )
}