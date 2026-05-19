const TOKEN_KEY = 'token'
const USER_KEY = 'user'

export function getAuthToken() {
  return sessionStorage.getItem(TOKEN_KEY)
}

export function getStoredUser() {
  try {
    return JSON.parse(sessionStorage.getItem(USER_KEY) || '{}')
  } catch {
    return {}
  }
}

export function setAuthSession({ token, user }) {
  sessionStorage.setItem(TOKEN_KEY, token)
  sessionStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearAuthSession() {
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(USER_KEY)
}
