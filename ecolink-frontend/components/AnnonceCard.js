// components/AnnonceCard.js
// Structure réelle du backend :
// { id, title, description, condition, status, location_city, images: [{image_url, is_primary}] }
import Link from "next/link"

const conditionColor = {
  new:       "bg-green-100 text-green-700",
  good:      "bg-blue-100 text-blue-700",
  fair:      "bg-yellow-100 text-yellow-700",
  poor:      "bg-gray-100 text-gray-600",
}
const conditionLabel = {
  new:       "Neuf",
  good:      "Bon état",
  fair:      "Acceptable",
  poor:      "Usé",
}

export default function AnnonceCard({ annonce }) {
  const { id, title, description, condition, location_city, images } = annonce

  // Priorité à l'image primaire, sinon la première
  const primaryImg = images?.find((i) => i.is_primary) || images?.[0]
  const photoUrl   = primaryImg?.image_url || null

  // Les URLs /static/uploads/... sont servies par le backend
  const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
  const imgSrc = photoUrl
    ? photoUrl.startsWith("http") ? photoUrl : `${BASE}${photoUrl}`
    : null

  return (
    <Link href={`/objet/${id}`}>
      <div className="card hover:shadow-md transition-shadow duration-200 cursor-pointer">
        {/* Image */}
        <div className="h-44 bg-gray-100 overflow-hidden">
          {imgSrc ? (
            <img src={imgSrc} alt={title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl">📦</div>
          )}
        </div>

        {/* Contenu */}
        <div className="p-4">
          <p className="font-medium text-sm text-gray-900 line-clamp-1">{title}</p>
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{description}</p>

          <div className="mt-3 flex items-center justify-between">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${conditionColor[condition] || "bg-gray-100 text-gray-600"}`}>
              {conditionLabel[condition] || condition}
            </span>
            {location_city && <span className="text-xs text-gray-400">📍 {location_city}</span>}
          </div>
        </div>
      </div>
    </Link>
  )
}