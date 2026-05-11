// pages/objet/[id].js
// Structure réelle du backend :
// item = { id, title, description, condition, status, location_city,
//           images: [{id, image_url, is_primary}],
//           owner: {id, name, avatar}, user_id, created_at }

import { useEffect, useState } from "react"
import { useRouter } from "next/router"
import Link from "next/link"
import Layout from "../../components/Layout"
import { getItem } from "../../lib/api"
import { useAuth } from "../../context/AuthContext"

const conditionLabel = {
  new:      "Neuf",
  good:     "Bon état",
  fair:     "Acceptable",
  poor:     "Usé",
}
const conditionColor = {
  new:      "bg-green-100 text-green-700",
  good:     "bg-blue-100 text-blue-700",
  fair:     "bg-yellow-100 text-yellow-700",
  poor:     "bg-gray-100 text-gray-600",
}

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

// Construit l'URL complète d'une image (gère /static/uploads/... et http://...)
function imgUrl(path) {
  if (!path) return null
  return path.startsWith("http") ? path : `${BASE}${path}`
}

export default function FicheObjet() {
  const router   = useRouter()
  const { id }   = router.query
  const { user } = useAuth()

  const [item,       setItem]       = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [photoIdx,   setPhotoIdx]   = useState(0)
  const [error,      setError]      = useState("")

  useEffect(() => {
    if (!id) return
    getItem(id)
      .then((res) => {
        setItem(res.data)
      })
      .catch(() => setError("Objet introuvable."))
      .finally(() => setLoading(false))
  }, [id])


  if (loading) return (
    <Layout title="Chargement...">
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-gray-400">Chargement...</div>
    </Layout>
  )

  if (error || !item) return (
    <Layout title="Introuvable">
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-5xl mb-4">😕</p>
        <p className="text-gray-500">{error || "Objet introuvable."}</p>
        <Link href="/recherche" className="btn-primary mt-6 inline-block">Retour à la recherche</Link>
      </div>
    </Layout>
  )

  // ── Données réelles du backend ─────────────────────────
  // images est un tableau [{id, image_url, is_primary}]
  const images  = item.images || []
  const photos  = images.map((img) => imgUrl(img.image_url)).filter(Boolean)
  const owner   = item.owner || {}
  // owner.name (pas first_name/last_name)
  const isOwner = user && (user.id === item.user_id || user.id === owner.id)

  return (
    <Layout
      title={item.title}
      description={item.description?.slice(0, 150)}
    >
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Fil d'Ariane */}
        <nav className="text-sm text-gray-400 mb-6">
          <Link href="/" className="hover:text-eco-primary">Accueil</Link>
          {" / "}
          <Link href="/recherche" className="hover:text-eco-primary">Recherche</Link>
          {" / "}
          <span className="text-gray-700">{item.title}</span>
        </nav>

        <div className="grid md:grid-cols-2 gap-8">

          {/* ── PHOTOS ──────────────────────────────── */}
          <div>
            <div className="card overflow-hidden h-72 md:h-96 bg-gray-100">
              {photos.length > 0 ? (
                <img
                  src={photos[photoIdx]}
                  alt={`${item.title} photo ${photoIdx + 1}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl">📦</div>
              )}
            </div>

            {photos.length > 1 && (
              <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                {photos.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => setPhotoIdx(i)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                      i === photoIdx ? "border-eco-primary" : "border-transparent"
                    }`}
                  >
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── INFOS ───────────────────────────────── */}
          <div className="flex flex-col gap-4">

            {/* Titre + favori */}
            <div className="flex items-start justify-between gap-3">
              <h1 className="font-display text-2xl font-semibold text-gray-900">{item.title}</h1>

            </div>

            {/* Condition + statut */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${conditionColor[item.condition] || "bg-gray-100 text-gray-600"}`}>
                {conditionLabel[item.condition] || item.condition}
              </span>
              {item.status && item.status !== "available" && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-orange-100 text-orange-700 font-medium">
                  {item.status === "reserved" ? "Réservé" : item.status === "given" ? "Donné" : item.status}
                </span>
              )}
              {item.pickup_only && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                  🤝 Remise en main propre
                </span>
              )}
            </div>

            {/* Description */}
            <div className="card p-4">
              <p className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">Description</p>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {item.description || "Aucune description."}
              </p>
            </div>

            {/* Lieu */}
            {item.location_city && (
              <div className="card p-3 text-sm">
                <p className="text-gray-400 text-xs">Lieu</p>
                <p className="font-medium text-gray-700 mt-0.5">📍 {item.location_city}</p>
              </div>
            )}

            {/* Propriétaire + contact */}
            {owner.id && (
              <div className="card p-4">
                {/* Identité */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-eco-accent flex items-center justify-center text-eco-primary font-semibold text-lg flex-shrink-0">
                    {owner.name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{owner.name}</p>
                    <p className="text-xs text-gray-400">
                      Publié le {item.created_at ? new Date(item.created_at).toLocaleDateString("fr-FR") : "—"}
                    </p>
                  </div>
                </div>

                {/* Coordonnées — visibles seulement si connecté et pas propriétaire */}
                {user && !isOwner && (
                  <div className="border-t border-gray-100 pt-3 flex flex-col gap-2">
                    {owner.email && (
                      <a
                        href={`mailto:${owner.email}`}
                        className="flex items-center gap-2 text-sm text-eco-primary hover:underline"
                      >
                        <span>✉️</span>
                        <span>{owner.email}</span>
                      </a>
                    )}
                    {owner.phone && (
                      <a
                        href={`tel:${owner.phone}`}
                        className="flex items-center gap-2 text-sm text-eco-primary hover:underline"
                      >
                        <span>📞</span>
                        <span>{owner.phone}</span>
                      </a>
                    )}
                  </div>
                )}

                {/* Invité non connecté */}
                {!user && (
                  <div className="border-t border-gray-100 pt-3">
                    <p className="text-xs text-gray-400">
                      <Link href={`/connexion?redirect=/objet/${id}`} className="text-eco-primary underline">
                        Connectez-vous
                      </Link>{" "}pour voir les coordonnées.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* CTA selon qui consulte */}
            <div className="mt-auto flex flex-col gap-2">
              {!user && (
                <Link href={`/connexion?redirect=/objet/${id}`} className="btn-primary text-center">
                  Connectez-vous pour contacter
                </Link>
              )}

              {user && !isOwner && (
                <Link href={`/messages?item=${id}`} className="btn-secondary text-center">
                  💬 Envoyer un message
                </Link>
              )}

              {isOwner && (
                <div className="flex gap-2">
                  <Link href={{ pathname: "/modifier/[id]", query: { id } }} className="btn-secondary flex-1 text-center text-sm">
                    ✏️ Modifier
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}