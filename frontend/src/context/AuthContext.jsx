import { createContext, useContext, useEffect, useState } from 'react'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const checkAuth = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/check', {
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      } else {
        setUser(null)
      }
    } catch (error) {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkAuth()
  }, [])

  const login = async (email, password, role) => {
    try {
      const response = await fetch(`http://localhost:5000/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password, role }),
      })

      if (response.ok) {
        // Fetch the latest user data from /check to ensure profile_img is included
        await checkAuth()
        return true
      }
      const data = await response.json()
      throw new Error(data?.error || 'Login failed')
    } catch (error) {
      throw new Error(error.message)
    }
  }

  const requestPasswordReset = async (email) => {
    try {
      const response = await fetch(
        'http://localhost:5000/api/auth/forgot-password',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email }),
        }
      )
    } catch (err) {
      throw err.response.data
    }
  }

  const resetPassword = async (token, password) => {
    const response = await fetch(
      'http://localhost:5000/api/auth/reset-password',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token, password }),
      }
    )

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || 'Something went wrong!')
    }

    return await response.json()
  }

  const logout = async () => {
    try {
      await fetch('http://localhost:5000/api/auth/logout', {
        credentials: 'include',
        method: 'POST',
      })
      setUser(null)
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const value = {
    user,
    loading,
    login,
    logout,
    checkAuth,
    requestPasswordReset,
    resetPassword,
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
