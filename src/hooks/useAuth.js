
import { useState, useCallback } from 'react'
import {
  isLoggedIn,
  getUsername,
  logout,
} from '../services/api'

function useAuth() {
  const [authenticated, setAuthenticated] = useState(
    () => isLoggedIn() && Boolean(getUsername())
  )

  const [currentUsername, setCurrentUsername] = useState(getUsername)

  const handleLoginSuccess = useCallback(() => {
    const username = getUsername()

    if (!username) return

    setCurrentUsername(username)
    setAuthenticated(true)
  }, [])

  const handleLogout = useCallback(() => {
    logout()

    setAuthenticated(false)
    setCurrentUsername('')
  }, [])

  return {
    authenticated,
    currentUsername,
    handleLoginSuccess,
    handleLogout,
  }
}

export default useAuth
