// components/CityAutocomplete.js
import { useState, useEffect, useRef, useCallback } from "react"

export default function CityAutocomplete({ value, onChange, placeholder = "Ville", className = "" }) {
  const [query,       setQuery]       = useState(value || "")
  const [suggestions, setSuggestions] = useState([])
  const [loading,     setLoading]     = useState(false)
  const [open,        setOpen]        = useState(false)
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 })
  const debounceRef = useRef(null)
  const inputRef    = useRef(null)
  const wrapperRef  = useRef(null)

  // Ferme si clic en dehors
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  useEffect(() => { setQuery(value || "") }, [value])

  // Calcule la position absolue de l'input pour positionner le dropdown en fixed
  const updatePos = () => {
    if (!inputRef.current) return
    const rect = inputRef.current.getBoundingClientRect()
    setDropdownPos({
      top:   rect.bottom + window.scrollY + 4,
      left:  rect.left + window.scrollX,
      width: rect.width,
    })
  }

  const fetchCities = useCallback((text) => {
    if (text.length < 2) { setSuggestions([]); setOpen(false); return }
    setLoading(true)
    fetch(
      `https://nominatim.openstreetmap.org/search?` +
        new URLSearchParams({ q: text, format: "json", addressdetails: "1", limit: "8", "accept-language": "fr" })
    )
      .then((r) => r.json())
      .then((data) => {
        const seen = new Set()
        const cities = []
        for (const item of data) {
          const a    = item.address || {}
          const city = a.city || a.town || a.village || a.hamlet || item.display_name.split(",")[0].trim()
          const sub  = [a.county || a.state, a.country].filter(Boolean).join(", ")
          if (!seen.has(city.toLowerCase()) && city) {
            seen.add(city.toLowerCase())
            cities.push({ city, sub })
          }
          if (cities.length >= 6) break
        }
        setSuggestions(cities)
        if (cities.length > 0) { updatePos(); setOpen(true) }
        else setOpen(false)
      })
      .catch(() => { setSuggestions([]); setOpen(false) })
      .finally(() => setLoading(false))
  }, [])

  const handleChange = (e) => {
    const text = e.target.value
    setQuery(text)
    onChange(text)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchCities(text), 350)
  }

  const handleSelect = (city) => {
    setQuery(city)
    onChange(city)
    setSuggestions([])
    setOpen(false)
  }

  return (
    <div ref={wrapperRef} className="relative w-full">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={handleChange}
        onFocus={() => { if (suggestions.length > 0) { updatePos(); setOpen(true) } }}
        onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
      />
      {loading && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-300">...</span>
      )}

      {/* Dropdown en position absolue par rapport à la page — évite tout overflow-hidden parent */}
      {open && suggestions.length > 0 && (
        <ul
          style={{
            position: "absolute",
            top:      "calc(100% + 4px)",
            left:     0,
            width:    "100%",
            zIndex:   9999,
          }}
          className="bg-white rounded-lg border border-gray-200 shadow-xl overflow-hidden"
        >
          {suggestions.map((item, i) => (
            <li key={i}>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); handleSelect(item.city) }}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
              >
                <p className="text-sm font-medium text-gray-900">{item.city}</p>
                {item.sub && <p className="text-xs text-gray-400 mt-0.5">{item.sub}</p>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}