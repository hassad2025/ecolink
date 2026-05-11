// pages/a-propos.js
import Image from "next/image"
import Layout from "../components/Layout"
import Link from "next/link"

const VALEURS = [
  { emoji: "♻️", title: "Économie circulaire",    desc: "Prolonger la vie des objets pour réduire les déchets." },
  { emoji: "🤝", title: "Entraide étudiante",     desc: "Faciliter les échanges au sein de la communauté." },
  { emoji: "🌍", title: "Impact environnemental", desc: "Mesurer et valoriser chaque geste écologique." },
  { emoji: "🔒", title: "Confiance & sécurité",   desc: "Plateforme sécurisée avec authentification JWT." },
]

export default function APropos() {
  return (
    <Layout
      title="À propos"
      description="Découvrez EcoLink, la plateforme de don et d'échange d'objets entre étudiants"
    >
      {/* HERO : texte à gauche + image à droite */}
      <section className="bg-eco-dark text-white">
        <div className="max-w-6xl mx-auto px-4 py-20 flex flex-col md:flex-row items-start gap-12">

          {/* Colonne texte + valeurs */}
          <div className="flex-1 text-center md:text-left">
            <p className="text-4xl mb-4">🌿</p>
            <h1 className="font-display text-4xl font-semibold mb-5 leading-tight">
              À propos d'EcoLink
            </h1>
            <p className="text-green-200 text-lg leading-relaxed mb-8">
              EcoLink est une plateforme étudiante qui facilite le don, l'échange et la
              réutilisation d'objets. Notre mission : réduire les déchets en donnant une
              seconde vie aux objets dont vous n'avez plus besoin.
            </p>
            <div className="flex flex-wrap gap-4 justify-center md:justify-start mb-10">
              {[
                { value: "1 240",    label: "objets donnés" },
                { value: "520",      label: "étudiants actifs" },
                { value: "3 800 kg", label: "CO₂ économisé" },
              ].map((s) => (
                <div key={s.label} className="bg-white/10 rounded-xl px-5 py-3 text-center">
                  <p className="text-xl font-display font-semibold">{s.value}</p>
                  <p className="text-xs text-green-300 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Valeurs — juste sous le texte, dans la colonne gauche */}
            <h2 className="font-display text-xl font-semibold text-white mb-5">
              Nos valeurs
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {VALEURS.map((v) => (
                <div key={v.title} className="bg-white/10 rounded-xl p-4 text-left hover:bg-white/20 transition-colors">
                  <p className="text-2xl mb-2">{v.emoji}</p>
                  <p className="font-semibold text-white text-sm mb-1">{v.title}</p>
                  <p className="text-xs text-green-200 leading-relaxed">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Colonne image */}
          <div className="flex-1 w-full max-w-md">
            <Image
              src="/images/hero-apropos.jpg"
              alt="EcoLink — don et échange d'objets entre étudiants"
              width={480}
              height={360}
              className="w-full rounded-2xl object-cover"
              priority
            />
          </div>
        </div>


      </section>
    </Layout>
  )
}