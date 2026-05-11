// pages/mot-de-passe-oublie.js — Demande de réinitialisation
import { useState } from "react"
import Link from "next/link"
import Layout from "../components/Layout"
import { forgotPassword } from "../lib/api"

export default function MotDePasseOublie() {
  const [email,   setEmail]   = useState("")
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)
  const [error,   setError]   = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await forgotPassword(email.trim())
      setSent(true)
    } catch (err) {
      setError("Une erreur est survenue. Vérifiez votre email.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout title="Mot de passe oublié">
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <p className="text-4xl mb-2">🔑</p>
            <h1 className="font-display text-2xl font-semibold text-gray-900">Mot de passe oublié</h1>
            <p className="text-gray-500 text-sm mt-1">
              Entrez votre email, nous vous enverrons un lien de réinitialisation.
            </p>
          </div>

          <div className="card p-8">
            {sent ? (
              <div className="text-center">
                <p className="text-3xl mb-3">📬</p>
                <p className="font-medium text-gray-800 mb-2">Email envoyé !</p>
                <p className="text-sm text-gray-500 mb-5">
                  Vérifiez votre boîte mail et suivez les instructions.
                </p>
                <Link href="/connexion" className="btn-primary">
                  Retour à la connexion
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}
                <div>
                  <label className="label">Adresse email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input"
                    placeholder="jean@example.com"
                    required
                    autoFocus
                  />
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                  {loading ? "Envoi..." : "Envoyer le lien"}
                </button>
                <p className="text-center text-sm text-gray-400">
                  <Link href="/connexion" className="hover:text-eco-primary">
                    ← Retour à la connexion
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
