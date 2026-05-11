// pages/modifier/[id].js — Modifier une annonce existante
import { useEffect, useState } from "react"
import { useRouter } from "next/router"
import Link from "next/link"
import Layout from "../../components/Layout"
import { getItem, updateItem, deleteItem } from "../../lib/api"
import { useAuth } from "../../context/AuthContext"

const CONDITIONS = [
  { value: "new",  label: "Neuf" },
  { value: "good", label: "Bon état" },
  { value: "fair", label: "Acceptable" },
  { value: "poor", label: "Usé" },
]

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

function imgUrl(path) {
  if (!path) return null
  return path.startsWith("http") ? path : `${BASE}${path}`
}

export default function ModifierAnnonce() {
  const router = useRouter()
  const { id } = router.query
  const { user, loading: authLoading } = useAuth()

  const [form, setForm] = useState({
    title:         "",
    description:   "",
    condition:     "good",
    location_city: "",
  })
  const [existingPhotos, setExistingPhotos] = useState([])
  const [newPhotos,      setNewPhotos]      = useState([])
  const [newPreviews,    setNewPreviews]    = useState([])

  const [loading,    setLoading]    = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [deleting,   setDeleting]   = useState(false)
  const [error,      setError]      = useState("")
  const [success,    setSuccess]    = useState(false)
  const [notOwner,   setNotOwner]   = useState(false)

  useEffect(() => {
    if (!authLoading && !user) router.push("/connexion")
  }, [user, authLoading])

  useEffect(() => {
    if (!id || !user) return
    getItem(id)
      .then((res) => {
        const item = res.data
        if (item.user_id !== user.id && item.owner?.id !== user.id) {
          setNotOwner(true)
          return
        }
        setForm({
          title:         item.title || "",
          description:   item.description || "",
          condition:     item.condition || "good",
          location_city: item.location_city || "",
        })
        setExistingPhotos(item.images || [])
      })
      .catch(() => setError("Annonce introuvable."))
      .finally(() => setLoading(false))
  }, [id, user])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleNewPhotos = (e) => {
    const files = Array.from(e.target.files)
    setNewPhotos((prev) => {
      const merged = [...prev, ...files].slice(0, 5 - existingPhotos.length)
      setNewPreviews(merged.map((f) => URL.createObjectURL(f)))
      return merged
    })
    e.target.value = ""
  }

  const removeNewPhoto = (idx) => {
    setNewPhotos((prev) => {
      const updated = prev.filter((_, i) => i !== idx)
      setNewPreviews(updated.map((f) => URL.createObjectURL(f)))
      return updated
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    if (!form.title.trim())       return setError("Le titre est obligatoire.")
    if (!form.description.trim()) return setError("La description est obligatoire.")

    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append("title",         form.title.trim())
      fd.append("description",   form.description.trim())
      fd.append("condition",     form.condition)
      fd.append("location_city", form.location_city.trim())
      newPhotos.forEach((file) => fd.append("images", file))

      await updateItem(id, fd)
      setSuccess(true)
      setTimeout(() => router.push(`/objet/${id}`), 1500)
    } catch (err) {
      const msg = err.response?.data?.detail || "Erreur lors de la modification."
      setError(typeof msg === "string" ? msg : JSON.stringify(msg))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Supprimer définitivement cette annonce ? Cette action est irréversible.")) return
    setDeleting(true)
    try {
      await deleteItem(id)
      router.push("/profil")
    } catch {
      setError("Erreur lors de la suppression.")
      setDeleting(false)
    }
  }

  if (authLoading || (!loading && !user)) return null

  if (loading) return (
    <Layout title="Chargement...">
      <div className="max-w-2xl mx-auto px-4 py-16 text-center text-gray-400">Chargement...</div>
    </Layout>
  )

  if (notOwner) return (
    <Layout title="Accès refusé">
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-5xl mb-4">🔒</p>
        <p className="text-gray-500 mb-6">Vous n'êtes pas le propriétaire de cette annonce.</p>
        <Link href="/profil" className="btn-primary">Retour au profil</Link>
      </div>
    </Layout>
  )

  if (error && !form.title) return (
    <Layout title="Introuvable">
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-5xl mb-4">😕</p>
        <p className="text-gray-500 mb-6">{error}</p>
        <Link href="/profil" className="btn-primary">Retour au profil</Link>
      </div>
    </Layout>
  )

  const totalPhotos = existingPhotos.length + newPhotos.length

  return (
    <Layout title="Modifier l'annonce">
      <div className="max-w-2xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-3xl font-semibold text-gray-900">Modifier l'annonce</h1>
            <Link href={`/objet/${id}`} className="text-sm text-eco-primary hover:underline mt-1 inline-block">
              ← Voir l'annonce
            </Link>
          </div>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="border border-red-200 text-red-500 hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {deleting ? "Suppression..." : "🗑️ Supprimer"}
          </button>
        </div>

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 text-sm">
            ✅ Annonce modifiée ! Redirection en cours...
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
              className="input" maxLength={100} required
            />
          </div>

          <div>
            <label className="label">Description *</label>
            <textarea
              name="description" value={form.description} onChange={handleChange}
              className="input min-h-[120px] resize-y" maxLength={1000} required
            />
            <p className="text-xs text-gray-400 mt-1">{form.description.length}/1000</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">État</label>
              <select name="condition" value={form.condition} onChange={handleChange} className="input">
                {CONDITIONS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Ville</label>
              <input
                name="location_city" value={form.location_city} onChange={handleChange}
                className="input" placeholder="Paris, Lyon..."
              />
            </div>
          </div>

          {/* Photos existantes (lecture seule) */}
          {existingPhotos.length > 0 && (
            <div>
              <label className="label">Photos actuelles ({existingPhotos.length})</label>
              <div className="flex gap-3 flex-wrap">
                {existingPhotos.map((img, i) => (
                  <div key={img.id} className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200">
                    <img src={imgUrl(img.image_url)} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                    {img.is_primary && (
                      <span className="absolute bottom-1 left-1 bg-eco-primary text-white text-xs rounded px-1">✓</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Nouvelles photos */}
          {totalPhotos < 5 && (
            <div>
              <label className="label">Ajouter des photos ({totalPhotos}/5)</label>
              <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-lg p-5 cursor-pointer hover:border-eco-secondary transition-colors">
                <span className="text-xl">📷</span>
                <span className="text-sm text-gray-500">
                  Cliquez pour ajouter ({5 - totalPhotos} restante{5 - totalPhotos > 1 ? "s" : ""})
                </span>
                <input type="file" accept="image/*" multiple onChange={handleNewPhotos} className="hidden" />
              </label>

              {newPreviews.length > 0 && (
                <div className="flex gap-3 mt-3 flex-wrap">
                  {newPreviews.map((url, i) => (
                    <div key={i} className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200 group">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button" onClick={() => removeNewPhoto(i)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 mt-2">
            <Link href={`/objet/${id}`} className="btn-secondary flex-1 text-center">
              Annuler
            </Link>
            <button type="submit" disabled={submitting || success} className="btn-primary flex-1">
              {submitting ? "⏳ Enregistrement..." : "💾 Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  )
}