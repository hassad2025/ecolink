// pages/inscription.js
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/router"
import Cookies from "js-cookie"
import Layout from "../components/Layout"
import { register } from "../lib/api"
import { useAuth } from "../context/AuthContext"

export default function Inscription() {
  const router = useRouter()
  const { setUser } = useAuth()

  const [form, setForm] = useState({
    first_name: "",
    last_name:  "",
    email:      "",
    password:   "",
    confirm:    "",
  })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState("")

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    if (form.password !== form.confirm)
      return setError("Les mots de passe ne correspondent pas.")
    if (form.password.length < 8)
      return setError("Le mot de passe doit contenir au moins 8 caractères.")

    setLoading(true)
    try {
      // register() fusionne first_name + last_name en `name` pour le backend
      const res = await register(form)
      // Le backend retourne { token, refreshToken, user }
      const { token, refreshToken, user } = res.data

      Cookies.set("token",        token,        { expires: 7 })
      Cookies.set("refreshToken", refreshToken, { expires: 30 })

      setUser(user)
      router.push("/profil")
    } catch (err) {
      const msg = err.response?.data?.detail
      setError(typeof msg === "string" ? msg : "Erreur lors de l'inscription. Email peut-être déjà utilisé.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout title="Inscription" description="Créez votre compte EcoLink">
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <p className="text-4xl mb-2">🌿</p>
            <h1 className="font-display text-3xl font-semibold text-gray-900">Créer un compte</h1>
            <p className="text-gray-500 text-sm mt-1">Rejoignez la communauté EcoLink</p>
          </div>

          <div className="card p-8">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-5 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Prénom *</label>
                  <input name="first_name" value={form.first_name} onChange={handleChange}
                    className="input" placeholder="Jean" required />
                </div>
                <div>
                  <label className="label">Nom *</label>
                  <input name="last_name" value={form.last_name} onChange={handleChange}
                    className="input" placeholder="Dupont" required />
                </div>
              </div>

              <div>
                <label className="label">Adresse email *</label>
                <input type="email" name="email" value={form.email} onChange={handleChange}
                  className="input" placeholder="jean@example.com" required />
              </div>

              <div>
                <label className="label">Mot de passe *</label>
                <input type="password" name="password" value={form.password} onChange={handleChange}
                  className="input" placeholder="8 caractères minimum" required minLength={8} />
              </div>

              <div>
                <label className="label">Confirmer le mot de passe *</label>
                <input type="password" name="confirm" value={form.confirm} onChange={handleChange}
                  className="input" placeholder="Répétez votre mot de passe" required />
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2">
                {loading ? "Création du compte..." : "Créer mon compte 🌱"}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-5">
              Déjà inscrit ?{" "}
              <Link href="/connexion" className="text-eco-primary font-medium hover:underline">
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </div>
    </Layout>
  )
}