// pages/reset-password.js
// Accessible via /reset-password?token=xxx (lien reçu par email)

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/router"
import Layout from "../components/Layout"
import { resetPassword } from "../lib/api"

export default function ResetPassword() {
  const router = useRouter()
  const { token } = router.query  // token JWT depuis l'URL

  const [form,    setForm]    = useState({ password: "", confirm: "" })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error,   setError]   = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    if (form.password.length < 8)
      return setError("Le mot de passe doit contenir au moins 8 caractères.")
    if (form.password !== form.confirm)
      return setError("Les mots de passe ne correspondent pas.")
    if (!token)
      return setError("Lien invalide ou expiré. Refaites une demande.")

    setLoading(true)
    try {
      // Le backend attend { token, newPassword } en camelCase
      await resetPassword(token, form.password)
      setSuccess(true)
      setTimeout(() => router.push("/connexion"), 3000)
    } catch (err) {
      const msg = err.response?.data?.detail
      setError(typeof msg === "string" ? msg : "Lien invalide ou expiré.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout title="Nouveau mot de passe" description="Réinitialisez votre mot de passe EcoLink">
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <p className="text-4xl mb-2">🔐</p>
            <h1 className="font-display text-2xl font-semibold text-gray-900">
              Nouveau mot de passe
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Choisissez un nouveau mot de passe sécurisé.
            </p>
          </div>

          <div className="card p-8">
            {success ? (
              <div className="text-center">
                <p className="text-3xl mb-3">✅</p>
                <p className="font-medium text-gray-800 mb-2">Mot de passe modifié !</p>
                <p className="text-sm text-gray-500 mb-5">Redirection vers la connexion...</p>
                <Link href="/connexion" className="btn-primary">Se connecter</Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label className="label">Nouveau mot de passe</label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="input"
                    placeholder="8 caractères minimum"
                    required
                    minLength={8}
                    autoFocus
                  />
                </div>

                <div>
                  <label className="label">Confirmer le mot de passe</label>
                  <input
                    type="password"
                    value={form.confirm}
                    onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                    className="input"
                    placeholder="Répétez le mot de passe"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !token}
                  className="btn-primary w-full py-3 mt-2"
                >
                  {loading ? "Enregistrement..." : "Enregistrer le mot de passe"}
                </button>

                <p className="text-center text-sm text-gray-400">
                  <Link href="/mot-de-passe-oublie" className="hover:text-eco-primary">
                    Renvoyer un lien
                  </Link>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}