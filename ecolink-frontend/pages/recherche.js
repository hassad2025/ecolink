// pages/recherche.js
import { useEffect, useState } from "react"
import { useRouter } from "next/router"
import Layout from "../components/Layout"
import AnnonceCard from "../components/AnnonceCard"
import Cityautocomplete from "../components/Cityautocomplete"
import { getItems } from "../lib/api"

const CATEGORIES = [
  { slug: "",             label: "Toutes" },
  { slug: "electronique", label: "Électronique" },
  { slug: "livres",       label: "Livres" },
  { slug: "mobilier",     label: "Mobilier" },
  { slug: "vetements",    label: "Vêtements" },
  { slug: "sport",        label: "Sport" },
  { slug: "cuisine",      label: "Cuisine" },
]

const CONDITIONS = [
  { slug: "",         label: "Tous états" },
  { slug: "new",      label: "Neuf" },
  { slug: "like_new", label: "Comme neuf" },
  { slug: "good",     label: "Bon état" },
  { slug: "fair",     label: "Acceptable" },
  { slug: "poor",     label: "Usé" },
]

const LIMIT = 12

export default function Recherche() {
  const router = useRouter()

  const [search,    setSearch]    = useState("")
  const [category,  setCategory]  = useState("")
  const [condition, setCondition] = useState("")
  const [location,  setLocation]  = useState("")
  const [page,      setPage]      = useState(1)

  const [annonces, setAnnonces] = useState([])
  const [total,    setTotal]    = useState(0)
  const [loading,  setLoading]  = useState(false)

  useEffect(() => {
    if (router.isReady) {
      setCategory(router.query.category || router.query.categorie || "")
      setSearch(router.query.q || router.query.search || "")
    }
  }, [router.isReady])

  useEffect(() => {
    const params = {
      page,
      limit: LIMIT,
      ...(search    && { q: search }),
      ...(category  && { category }),
      ...(condition && { condition }),
      ...(location  && { location }),
    }
    setLoading(true)
    getItems(params)
      .then((res) => {
        const data = res.data
        setAnnonces(data.items || data)
        setTotal(data.total || 0)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [search, category, condition, location, page])

  const totalPages = Math.ceil(total / LIMIT)

  return (
    <Layout title="Recherche" description="Trouvez des objets près de chez vous">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="font-display text-3xl font-semibold text-gray-900 mb-6">Rechercher un objet</h1>

        {/* FILTRES */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-8" style={{overflow: "visible"}}>
          <div className="flex flex-col md:flex-row gap-3">
            {/* Barre de recherche */}
            <input
              type="text"
              placeholder="Que cherchez-vous ?"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="input flex-1 min-w-0"
            />
            {/* Catégorie */}
            <select
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(1) }}
              className="input md:w-40"
            >
              {CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.label}</option>)}
            </select>
            {/* État */}
            <select
              value={condition}
              onChange={(e) => { setCondition(e.target.value); setPage(1) }}
              className="input md:w-40"
            >
              {CONDITIONS.map((c) => <option key={c.slug} value={c.slug}>{c.label}</option>)}
            </select>
            {/* Ville avec autocomplétion */}
            <div className="md:w-44">
              <Cityautocomplete
                value={location}
                onChange={(val) => { setLocation(val); setPage(1) }}
                placeholder="Ville"
                className="input w-full"
              />
            </div>
          </div>
        </div>

        {/* RÉSULTATS */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => <div key={i} className="card h-60 animate-pulse bg-gray-100" />)}
          </div>
        ) : annonces.length > 0 ? (
          <>
            <p className="text-sm text-gray-500 mb-4">{total} résultat(s)</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {annonces.map((a) => <AnnonceCard key={a.id} annonce={a} />)}
            </div>
          </>
        ) : (
          <div className="text-center py-20">
         
            <p className="text-gray-500">Aucun objet trouvé. Essayez d'autres filtres.</p>
          </div>
        )}

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-10">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary text-sm disabled:opacity-40">← Précédent</button>
            <span className="flex items-center text-sm text-gray-600 px-4">Page {page} / {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-secondary text-sm disabled:opacity-40">Suivant →</button>
          </div>
        )}
      </div>
    </Layout>
  )
}