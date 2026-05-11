// pages/impact.js
import { useEffect, useState } from "react"
import { useRouter } from "next/router"
import Layout from "../components/Layout"
import { getMyStats, getMyItems } from "../lib/api"
import { useAuth } from "../context/AuthContext"

const ALL_BADGES = [
  { id: "first_post",   emoji: "📢", label: "Première annonce",  desc: "Vous avez publié votre première annonce", field: "objetsPublies", threshold: 1 },
  { id: "first_gift",   emoji: "🌱", label: "Premier don",       desc: "Vous avez donné votre premier objet",     field: "objetsDonnes",  threshold: 1 },
  { id: "five_gifts",   emoji: "🌿", label: "5 dons",            desc: "Vous avez donné 5 objets",                field: "objetsDonnes",  threshold: 5 },
  { id: "ten_gifts",    emoji: "🌳", label: "10 dons",           desc: "Vous avez donné 10 objets",               field: "objetsDonnes",  threshold: 10 },
  { id: "eco_hero",     emoji: "♻️", label: "Éco-héros",         desc: "Vous avez économisé 10 kg de CO₂",        field: "co2Economise",  threshold: 10 },
  { id: "eco_champion", emoji: "🏆", label: "Champion vert",     desc: "Vous avez économisé 50 kg de CO₂",        field: "co2Economise",  threshold: 50 },
]

function ProgressBar({ value, max, color = "bg-eco-secondary" }) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  return (
    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
      <div className={`${color} h-2.5 rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
    </div>
  )
}

function StatCard({ emoji, value, label, unit = "" }) {
  return (
    <div className="card p-5 text-center">
      <p className="text-3xl mb-2">{emoji}</p>
      <p className="text-3xl font-display font-semibold text-eco-primary">
        {value}<span className="text-lg font-sans ml-1">{unit}</span>
      </p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  )
}

export default function Impact() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [stats,   setStats]   = useState(null)
  const [myItems, setMyItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) router.push("/connexion")
  }, [user, authLoading])

  useEffect(() => {
    if (!user) return
    Promise.all([
      getMyStats().catch(() => ({ data: null })),
      getMyItems(user.id).catch(() => ({ data: [] })),
    ]).then(([statsRes, itemsRes]) => {
      setStats(statsRes.data)
      setMyItems(itemsRes.data?.items || itemsRes.data || [])
    }).finally(() => setLoading(false))
  }, [user])

  if (authLoading || !user) return null

  // Champs exacts retournés par GET /api/items/user/stats
  const objetsDonnes  = stats?.totalItemsGiven  || 0
  const co2Economise  = stats?.co2Saved         || 0
  const points        = stats?.points           || 0
  const rang          = stats?.communityRank    || "-"
  const objetsPublies = myItems.length

  const values = { objetsPublies, objetsDonnes, co2Economise }

  const badgesDebloqués = ALL_BADGES.filter((b) => values[b.field] >= b.threshold)
  const prochainBadge   = ALL_BADGES.find((b) => values[b.field] < b.threshold)

  return (
    <Layout title="Mon impact" description="Visualisez votre impact environnemental sur EcoLink">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="font-display text-3xl font-semibold text-gray-900 mb-2">Mon impact</h1>
        <p className="text-gray-500 text-sm mb-8">
          Chaque don compte. Voici le bilan de votre engagement écologique.
        </p>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="card h-32 animate-pulse bg-gray-100" />)}
          </div>
        ) : (
          <>
            {/* STATS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              <StatCard emoji="📦" value={objetsPublies} label="Annonces publiées" />
              <StatCard emoji="🎁" value={objetsDonnes}  label="Objets donnés" />
              <StatCard emoji="🌱" value={co2Economise}  label="CO₂ économisé" unit="kg" />
              <StatCard emoji="🏅" value={points}        label="Points obtenus" />
            </div>

            {/* PROGRESSION CO₂ */}
            <div className="card p-6 mb-8">
              <h2 className="font-semibold text-gray-800 mb-4">Progression CO₂ économisé</h2>
              <div className="space-y-4">
                {[
                  { label: "Objectif 10 kg",  max: 10,  color: "bg-green-400" },
                  { label: "Objectif 50 kg",  max: 50,  color: "bg-eco-secondary" },
                  { label: "Objectif 100 kg", max: 100, color: "bg-eco-primary" },
                ].map((bar) => (
                  <div key={bar.label}>
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>{bar.label}</span>
                      <span className="font-medium">{Math.min(co2Economise, bar.max)} / {bar.max} kg</span>
                    </div>
                    <ProgressBar value={co2Economise} max={bar.max} color={bar.color} />
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-4">
                * Calculé par le backend : 17,5 kg CO₂ par objet donné.
              </p>
            </div>

            {/* GRAPHIQUE ACTIVITÉ */}
            <div className="card p-6 mb-8">
              <h2 className="font-semibold text-gray-800 mb-4">Activité récente</h2>
              {myItems.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-6">
                  Publiez votre première annonce pour voir votre activité !
                </p>
              ) : (
                <div className="flex items-end gap-2 h-28">
                  {Array.from({ length: 6 }, (_, i) => {
                    const d = new Date()
                    d.setMonth(d.getMonth() - (5 - i))
                    const mois  = d.getMonth()
                    const annee = d.getFullYear()
                    const count = myItems.filter((item) => {
                      const id = new Date(item.created_at)
                      return id.getMonth() === mois && id.getFullYear() === annee
                    }).length
                    const maxCount = Math.max(...Array.from({ length: 6 }, (_, j) => {
                      const dd = new Date()
                      dd.setMonth(dd.getMonth() - (5 - j))
                      return myItems.filter((item) => {
                        const id = new Date(item.created_at)
                        return id.getMonth() === dd.getMonth() && id.getFullYear() === dd.getFullYear()
                      }).length
                    }), 1)
                    const height    = Math.max(8, Math.round((count / maxCount) * 100))
                    const monthName = d.toLocaleDateString("fr-FR", { month: "short" })
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-xs text-gray-500">{count > 0 ? count : ""}</span>
                        <div className="w-full bg-eco-secondary rounded-t-md transition-all duration-500"
                          style={{ height: `${height}%` }} />
                        <span className="text-xs text-gray-400">{monthName}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* BADGES */}
            <div className="card p-6">
              <h2 className="font-semibold text-gray-800 mb-5">
                Mes badges ({badgesDebloqués.length}/{ALL_BADGES.length})
              </h2>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                {ALL_BADGES.map((badge) => {
                  const unlocked = badgesDebloqués.includes(badge)
                  return (
                    <div
                      key={badge.id}
                      className={`flex flex-col items-center gap-1 text-center p-2 rounded-xl transition-all ${
                        unlocked ? "opacity-100" : "opacity-30 grayscale"
                      }`}
                      title={badge.desc}
                    >
                      <span className="text-3xl">{badge.emoji}</span>
                      <span className="text-xs font-medium text-gray-700">{badge.label}</span>
                    </div>
                  )
                })}
              </div>

              {prochainBadge && (
                <div className="mt-6 bg-eco-accent rounded-xl p-4 flex items-center gap-3">
                  <span className="text-2xl grayscale opacity-50">{prochainBadge.emoji}</span>
                  <div>
                    <p className="text-sm font-medium text-eco-dark">Prochain badge : {prochainBadge.label}</p>
                    <p className="text-xs text-gray-500">{prochainBadge.desc}</p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}