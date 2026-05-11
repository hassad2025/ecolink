// pages/publier.js
import { useEffect, useState } from "react"
import { useRouter } from "next/router"
import Layout from "../components/Layout"
import { createItem, getCategories } from "../lib/api"
import { useAuth } from "../context/AuthContext"

const CONDITIONS = [
  { value: "new",  label: "Neuf" },
  { value: "good", label: "Bon état" },
  { value: "fair", label: "Acceptable" },
  { value: "poor", label: "Usé" },
]

// Catégories statiques en fallback si /api/categories échoue ou retourne []
const FALLBACK_CATEGORIES = [
  { id: 1, name: "Électronique" },
  { id: 2, name: "Livres" },
  { id: 3, name: "Mobilier" },
  { id: 4, name: "Vêtements" },
  { id: 5, name: "Sport" },
  { id: 6, name: "Cuisine" },
  { id: 7, name: "Autre" },
]

export default function Publier() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [categories, setCategories] = useState([])
  const [form, setForm] = useState({
    title:         "",
    description:   "",
    category_id:   "",
    condition:     "good",
    location_city: "",
  })
  const [photos,     setPhotos]     = useState([])
  const [previews,   setPreviews]   = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]      = useState("")
  const [success,    setSuccess]    = useState(false)

  useEffect(() => {
    if (!authLoading && !user) router.push("/connexion")
  }, [user, authLoading])

  useEffect(() => {
    getCategories()
      .then((res) => {
        const cats = res.data
        // Utilise le fallback si l'API retourne vide ou échoue
        setCategories(Array.isArray(cats) && cats.length > 0 ? cats : FALLBACK_CATEGORIES)
      })
      .catch(() => setCategories(FALLBACK_CATEGORIES))
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handlePhotoChange = (e) => {
    const newFiles = Array.from(e.target.files)
    setPhotos((prev) => {
      const merged = [...prev, ...newFiles].slice(0, 5)
      setPreviews(merged.map((f) => URL.createObjectURL(f)))
      return merged
    })
    e.target.value = ""
  }

  const removePhoto = (idx) => {
    setPhotos((prev) => {
      const updated = prev.filter((_, i) => i !== idx)
      setPreviews(updated.map((f) => URL.createObjectURL(f)))
      return updated
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    if (!form.title.trim())       return setError("Le titre est obligatoire.")
    if (!form.description.trim()) return setError("La description est obligatoire.")
    if (!form.category_id)        return setError("Choisissez une catégorie.")

    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append("title",         form.title.trim())
      fd.append("description",   form.description.trim())
      fd.append("category_id",   parseInt(form.category_id)) // ← parseInt pour garantir un entier
      fd.append("condition",     form.condition)
      fd.append("pickup_only",   "true")
      fd.append("location_city", form.location_city.trim())
      photos.forEach((file) => fd.append("images", file))

      // Debug — visible dans la console navigateur
      console.log("📦 Payload envoyé :")
      for (let [k, v] of fd.entries()) console.log(` ${k}:`, v)

      const res = await createItem(fd)
      setSuccess(true)
      setTimeout(() => router.push(`/objet/${res.data.id}`), 1500)
    } catch (err) {
      const msg = err.response?.data?.detail || "Erreur lors de la publication."
      console.error("❌ Erreur backend:", err.response?.data)
      setError(typeof msg === "string" ? msg : JSON.stringify(msg))
    } finally {
      setSubmitting(false)
    }
  }

  if (authLoading) return null

  return (
    <Layout title="Publier une annonce" description="Publiez votre annonce sur EcoLink">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="font-display text-3xl font-semibold text-gray-900 mb-2">Publier une annonce</h1>
        <p className="text-gray-500 text-sm mb-8">Donnez une seconde vie à vos objets 🌿</p>

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 text-sm">
            ✅ Annonce publiée ! Redirection en cours...
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          <div>
            <label className="label">Titre *</label>
            <input
              name="title" value={form.title} onChange={handleChange}
              placeholder="Ex: Vélo de ville, Ordinateur portable..."
              className="input" maxLength={100} required
            />
          </div>

          <div>
            <label className="label">Description *</label>
            <textarea
              name="description" value={form.description} onChange={handleChange}
              placeholder="Décrivez l'état, les dimensions, l'histoire de l'objet..."
              className="input min-h-[120px] resize-y" maxLength={1000} required
            />
            <p className="text-xs text-gray-400 mt-1">{form.description.length}/1000</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Catégorie *</label>
              <select
                name="category_id" value={form.category_id}
                onChange={handleChange} className="input" required
              >
                <option value="">Choisir...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">État *</label>
              <select name="condition" value={form.condition} onChange={handleChange} className="input">
                {CONDITIONS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Ville</label>
            <input
              name="location_city"
              value={form.location_city}
              onChange={handleChange}
              placeholder="Paris, Lyon..."
              className="input"
            />
          </div>

          <div>
            <label className="label">Photos ({photos.length}/5)</label>
            {photos.length < 5 && (
              <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-lg p-6 cursor-pointer hover:border-eco-secondary transition-colors">
                <span className="text-2xl">📷</span>
                <span className="text-sm text-gray-500">
                  Cliquez pour ajouter ({5 - photos.length} restante{5 - photos.length > 1 ? "s" : ""})
                </span>
                <input type="file" accept="image/*" multiple onChange={handlePhotoChange} className="hidden" />
              </label>
            )}
            {previews.length > 0 && (
              <div className="flex gap-3 mt-3 flex-wrap">
                {previews.map((url, i) => (
                  <div key={i} className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200 group">
                    <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                    <span className="absolute bottom-1 left-1 bg-black/40 text-white text-xs rounded px-1">{i + 1}</span>
                    <button
                      type="button" onClick={() => removePhoto(i)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button type="submit" disabled={submitting || success} className="btn-primary w-full text-base py-3 mt-2">
            {submitting ? "⏳ Publication en cours..." : "🌿 Publier l'annonce"}
          </button>
        </form>
      </div>
    </Layout>
  )
}