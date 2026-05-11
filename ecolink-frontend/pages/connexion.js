// pages/connexion.js
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/router"
import Cookies from "js-cookie"
import Layout from "../components/Layout"
import { login } from "../lib/api"
import { useAuth } from "../context/AuthContext"

export default function Connexion() {
  const router = useRouter()
  const { setUser } = useAuth()

  const [form,    setForm]    = useState({ email: "", password: "" })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await login({ email: form.email.trim(), password: form.password })
      // Le backend retourne { token, refreshToken, user }
      const { token, refreshToken, user } = res.data

      Cookies.set("token",        token,        { expires: 7 })
      Cookies.set("refreshToken", refreshToken, { expires: 30 })

      // On stocke le user directement — pas besoin d'appeler /users/me
      setUser(user)

      const redirect = router.query.redirect || "/profil"
      router.push(redirect)
    } catch (err) {
      setError("Email ou mot de passe incorrect.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout title="Connexion" description="Connectez-vous à EcoLink">
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <p className="text-4xl mb-2">🌿</p>
            <h1 className="font-display text-3xl font-semibold text-gray-900">Connexion</h1>
            <p className="text-gray-500 text-sm mt-1">Content de vous revoir !</p>
          </div>

          <div className="card p-8">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-5 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="label">Adresse email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="input"
                  placeholder="jean@example.com"
                  required
                  autoFocus
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="label mb-0">Mot de passe</label>
                  <Link href="/mot-de-passe-oublie" className="text-xs text-eco-primary hover:underline">
                    Mot de passe oublié ?
                  </Link>
                </div>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="input"
                  placeholder="••••••••"
                  required
                />
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2">
                {loading ? "Connexion..." : "Se connecter"}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-5">
              Pas encore de compte ?{" "}
              <Link href="/inscription" className="text-eco-primary font-medium hover:underline">
                S'inscrire gratuitement
              </Link>
            </p>
          </div>
        </div>
      </div>
    </Layout>
  )
}