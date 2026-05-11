// context/AuthContext.js
// Le backend retourne { token, refreshToken, user } à l'inscription/connexion.
// On stocke le user en localStorage pour éviter un appel /users/me à chaque refresh.
// Si /users/me existe, on l'utilise pour rafraîchir les données.

import { createContext, useContext, useEffect, useState } from "react"
import Cookies from "js-cookie"
import api from "../lib/api"

const AuthContext = createContext(null)

const USER_KEY = "ecolink_user"

export function AuthProvider({ children }) {
  const [user,    setUserState] = useState(null)
  const [loading, setLoading]   = useState(true)

  // Persiste le user dans localStorage
  const setUser = (u) => {
    setUserState(u)
    if (u) localStorage.setItem(USER_KEY, JSON.stringify(u))
    else   localStorage.removeItem(USER_KEY)
  }

  useEffect(() => {
    const token     = Cookies.get("token")
    const savedUser = typeof window !== "undefined" ? localStorage.getItem(USER_KEY) : null

    if (!token) {
      setLoading(false)
      return
    }

    // Affiche immédiatement le user depuis localStorage (pas de flash de déconnexion)
    if (savedUser) {
      try { setUserState(JSON.parse(savedUser)) } catch (_) {}
    }

    // /users/me n'existe pas dans ce backend — on utilise uniquement le cache localStorage
    setLoading(false)
  }, [])

  const doLogout = () => {
    Cookies.remove("token")
    Cookies.remove("refreshToken")
    setUser(null)
    window.location.href = "/"
  }

  return (
    <AuthContext.Provider value={{ user, setUser, loading, logout: doLogout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}