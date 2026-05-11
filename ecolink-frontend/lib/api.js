// lib/api.js — Appels vers le backend FastAPI
import axios from "axios"
import Cookies from "js-cookie"

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

const api = axios.create({ baseURL: `${BASE_URL}/api` })

api.interceptors.request.use((config) => {
  const token = Cookies.get("token")
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== "undefined") {
      Cookies.remove("token")
      Cookies.remove("refreshToken")
      window.location.href = "/connexion"
    }
    return Promise.reject(err)
  }
)

// ── AUTH ─────────────────────────────────────────────────
export const register = ({ first_name, last_name, email, password }) =>
  api.post("/auth/register", { name: `${first_name} ${last_name}`.trim(), email, password })
export const login          = (data)        => api.post("/auth/login", data)
export const refreshToken   = (rt)          => api.post("/auth/refresh", { refreshToken: rt })
export const logoutApi      = ()            => api.post("/auth/logout")
export const forgotPassword = (email)       => api.post("/auth/forgot-password", { email })
export const resetPassword  = (token, pwd)  => api.post("/auth/reset-password", { token, newPassword: pwd })

// ── USERS ────────────────────────────────────────────────
// Route réelle : PUT /api/user/profile  (prefix=/user)
// Body JSON : { first_name, last_name, email, avatar_url }
export const getProfile = () => api.get("/user/profile")
export const updateMe   = (data) => api.put("/user/profile", data)
export const deleteAccount = () => api.delete("/user")

// ── ITEMS ────────────────────────────────────────────────
// GET /api/items/search?q=&category=&condition=&page=&limit=
export const getItems  = (params) => api.get("/items/search", { params })

// GET /api/items/recent?limit=6
export const getRecentItems = (limit = 6) => api.get("/items/recent", { params: { limit } })

// GET /api/items/:id
export const getItem = (id) => api.get(`/items/${id}`)

// POST /api/items — multipart/form-data avec images incluses
// Le backend attend Form fields + File[] images (PAS de JSON)
export const createItem = (formData) =>
  api.post("/items", formData, { headers: { "Content-Type": "multipart/form-data" } })

// DELETE /api/items/:id
export const deleteItem = (id)    => api.delete(`/items/${id}`)

// PUT /api/items/:id  (multipart/form-data)
export const updateItem = (id, fd) => api.put(`/items/${id}`, fd, { headers: { "Content-Type": "multipart/form-data" } })

// Mes annonces : on récupère recent puis on filtre par user_id côté frontend
// (le backend n'a pas de route /items/mine)
export const getMyItems = (userId) =>
  api.get("/items/search", { params: { limit: 100, page: 1 } })
    .then((res) => {
      const all = res.data?.items || res.data || []
      const mine = userId ? all.filter((item) => item.user_id === userId) : all
      return { data: mine }
    })

// GET /api/items/user/stats
export const getMyStats = () => api.get("/items/user/stats")

// ── FAVORIS supprimés ───────────────────────────────────

// ── CATEGORIES ───────────────────────────────────────────
export const getCategories = () => api.get("/categories")


// ── IMPACT ───────────────────────────────────────────────
// Utilise getMyStats (même route /items/user/stats)
// Champs retournés : { totalItemsGiven, co2Saved, points, communityRank, totalCommunityItems }

// ── WebSocket ────────────────────────────────────────────
export const wsNotificationsUrl = () => {
  const token = Cookies.get("token")
  const wsBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace("http", "ws")
  return `${wsBase}/api/ws/notifications?token=${token}`
}

export default api