// pages/profil.js
import { useEffect, useState } from "react"
import { useRouter } from "next/router"
import Link from "next/link"
import Layout from "../components/Layout"
import AnnonceCard from "../components/AnnonceCard"
import { getMyItems, deleteItem, getMyStats, updateMe, deleteAccount } from "../lib/api"
import { useAuth } from "../context/AuthContext"

export default function Profil() {
  const router = useRouter()
  const { user, setUser, loading: authLoading, logout } = useAuth()

  const [tab,         setTab]        = useState("annonces")
  const [myItems,     setMyItems]    = useState([])
  const [stats,       setStats]      = useState(null)
  const [loadingData, setLoadingData] = useState(true)

  // Formulaire paramètres — on sépare name en first/last pour le backend
  const [form,    setForm]    = useState({ first_name: "", last_name: "", email: "" })
  const [saving,  setSaving]  = useState(false)
  const [saveMsg, setSaveMsg] = useState("")

  useEffect(() => {
    if (!authLoading && !user) router.push("/connexion")
  }, [user, authLoading])

  useEffect(() => {
    if (!user) return

    // Pré-remplir le formulaire depuis le user en cache
    // user.name = "Jean Dupont" → on split en first/last
    const parts = (user.name || "").split(" ")
    setForm({
      first_name: parts[0] || "",
      last_name:  parts.slice(1).join(" ") || "",
      email:      user.email || "",
      phone:      user.phone || "",
    })

    Promise.all([
      getMyItems(user.id).catch(() => ({ data: [] })),
      getMyStats().catch(() => ({ data: null })),
    ]).then(([itemsRes, statsRes]) => {
      setMyItems(itemsRes.data?.items || itemsRes.data || [])
      setStats(statsRes.data)
    }).finally(() => setLoadingData(false))
  }, [user])

  const handleDelete = async (id) => {
    if (!confirm("Supprimer cette annonce ?")) return
    try {
      await deleteItem(id)
      setMyItems((prev) => prev.filter((i) => i.id !== id))
    } catch {
      alert("Erreur lors de la suppression.")
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setSaveMsg("")
    try {
      // Le backend attend { first_name, last_name, email }
      const payload = {
        first_name: form.first_name.trim() || undefined,
        last_name:  form.last_name.trim()  || undefined,
        email:      form.email.trim()      || undefined,
        phone:      form.phone.trim()      || undefined,
      }
      const res = await updateMe(payload)
      // Le backend retourne { success, user: { id, name, email, avatar } }
      if (res.data?.user) {
        setUser(res.data.user)
      }
      setSaveMsg("✅ Profil mis à jour !")
    } catch (err) {
      const msg = err.response?.data?.detail
      setSaveMsg(typeof msg === "string" ? `❌ ${msg}` : "❌ Erreur lors de la mise à jour.")
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!confirm("Supprimer définitivement votre compte ? Cette action est irréversible.")) return
    if (!confirm("Êtes-vous vraiment sûr ? Toutes vos annonces seront supprimées.")) return
    try {
      await deleteAccount()
      logout()
    } catch {
      alert("Erreur lors de la suppression du compte.")
    }
  }

  if (authLoading || !user) return null

  const itemsDonnes = stats?.totalItemsGiven || 0
  const co2        = stats?.co2Saved        || 0
  const points     = stats?.points          || 0

  return (
    <Layout title="Mon profil">
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* HEADER */}
        <div className="card p-6 flex flex-col sm:flex-row items-center sm:items-start gap-5 mb-8">
          <div className="w-16 h-16 rounded-full bg-eco-primary text-white flex items-center justify-center text-2xl font-display font-semibold flex-shrink-0">
            {user.name?.[0]?.toUpperCase() || "?"}
          </div>
          <div className="text-center sm:text-left">
            <h1 className="font-display text-2xl font-semibold text-gray-900">{user.name}</h1>
            <p className="text-sm text-gray-500">{user.email}</p>
            <p className="text-xs text-eco-primary mt-1 font-medium">
              {points} points · {itemsDonnes} objet{itemsDonnes > 1 ? "s" : ""} donné{itemsDonnes > 1 ? "s" : ""} · {co2} kg CO₂ économisé
            </p>
          </div>
          <div className="sm:ml-auto flex gap-3">
            <Link href="/impact" className="btn-secondary text-sm">🌱 Mon impact</Link>
            <button onClick={logout} className="text-sm text-red-400 hover:text-red-600 border border-red-200 px-4 py-2 rounded-lg">
              Déconnexion
            </button>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="card p-4 text-center">
            <p className="text-2xl font-display font-semibold text-eco-primary">{myItems.length}</p>
            <p className="text-xs text-gray-500 mt-1">Annonces publiées</p>
          </div>

          <div className="card p-4 text-center">
            <p className="text-2xl font-display font-semibold text-eco-primary">{co2} kg</p>
            <p className="text-xs text-gray-500 mt-1">CO₂ économisé</p>
          </div>
        </div>

        {/* ONGLETS */}
        <div className="flex gap-1 border-b border-gray-100 mb-6">
          {[
            { key: "annonces", label: "Mes annonces" },
            { key: "settings", label: "Paramètres" },
          ].map((t) => (
            <button
              key={t.key} onClick={() => setTab(t.key)}
              className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key
                  ? "border-eco-primary text-eco-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Mes annonces ──────────────────────────────── */}
        {tab === "annonces" && (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">{myItems.length} annonce(s)</p>
              <Link href="/publier" className="btn-primary text-sm">+ Nouvelle annonce</Link>
            </div>
            {loadingData ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => <div key={i} className="card h-52 animate-pulse bg-gray-100" />)}
              </div>
            ) : myItems.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {myItems.map((item) => (
                  <div key={item.id} className="relative group">
                    <AnnonceCard annonce={item} />
                    <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link
                        href={{ pathname: "/modifier/[id]", query: { id: item.id } }}
                        className="bg-white text-eco-primary text-xs px-2 py-1 rounded shadow"
                      >
                        Modifier
                      </Link>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="bg-red-500 text-white text-xs px-2 py-1 rounded shadow"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-4xl mb-3">📦</p>
                <p className="text-gray-500 mb-4">Vous n'avez pas encore publié d'annonce.</p>
                <Link href="/publier" className="btn-primary">Publier ma première annonce</Link>
              </div>
            )}
          </>
        )}



        {/* ── Paramètres ────────────────────────────────── */}
        {tab === "settings" && (
          <div className="max-w-md">
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <h2 className="font-semibold text-gray-800">Modifier mes informations</h2>

              {saveMsg && (
                <p className={`text-sm px-3 py-2 rounded ${
                  saveMsg.startsWith("✅") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                }`}>
                  {saveMsg}
                </p>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Prénom</label>
                  <input
                    className="input"
                    value={form.first_name}
                    onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                    placeholder="Jean"
                  />
                </div>
                <div>
                  <label className="label">Nom</label>
                  <input
                    className="input"
                    value={form.last_name}
                    onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                    placeholder="Dupont"
                  />
                </div>
              </div>

              <div>
                <label className="label">Adresse email</label>
                <input
                  className="input"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="jean@example.com"
                />
              </div>

              <div>
                <label className="label">Numéro de téléphone</label>
                <input
                  className="input"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+33 6 12 34 56 78"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Affiché sur vos annonces si renseigné.
                </p>
              </div>

              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? "Enregistrement..." : "Enregistrer les modifications"}
              </button>
            </form>

            {/* Danger zone */}
            <div className="mt-10 pt-6 border-t border-red-100">
              <h3 className="text-sm font-semibold text-red-600 mb-2">Zone dangereuse</h3>
              <p className="text-xs text-gray-500 mb-3">
                La suppression de votre compte est irréversible. Toutes vos annonces seront supprimées.
              </p>
              <button
                onClick={handleDeleteAccount}
                className="text-sm border border-red-300 text-red-500 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors"
              >
                Supprimer mon compte
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}