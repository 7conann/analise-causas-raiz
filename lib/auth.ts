export interface User {
  username: string
}

export const FIXED_CREDENTIALS = {
  username: "analista",
  password: "rca@2025", // Updated password from beely@2025 to rca@2025
} as const

export function login(username: string, password: string): boolean {
  if (username === FIXED_CREDENTIALS.username && password === FIXED_CREDENTIALS.password) {
    localStorage.setItem("auth", "true")
    localStorage.setItem("user", JSON.stringify({ username }))
    return true
  }
  return false
}

export function logout(): void {
  localStorage.removeItem("auth")
  localStorage.removeItem("user")
}

export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false
  return localStorage.getItem("auth") === "true"
}

export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null
  const userStr = localStorage.getItem("user")
  return userStr ? JSON.parse(userStr) : null
}
