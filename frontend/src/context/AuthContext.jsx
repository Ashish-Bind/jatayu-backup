import { createContext, useContext, useEffect, useState } from 'react'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [locationError, setLocationError] = useState(null) // For UI feedback

  const checkAuth = async (signal) => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/check', {
        credentials: 'include',
        signal,
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      } else {
        setUser(null)
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('checkAuth error:', error)
        setUser(null)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const controller = new AbortController()
    checkAuth(controller.signal)
    return () => controller.abort()
  }, [])

  const getLocation = async () => {
    return new Promise(async (resolve, reject) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const location = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              city: '',
              region: '',
              country: '',
              ip: '',
            }
            console.log('Geolocation retrieved:', location)
            setLocationError(null)
            resolve(location)
          },
          (error) => {
            let errorMsg
            switch (error.code) {
              case error.PERMISSION_DENIED:
                errorMsg = 'Location permission denied. Using IP fallback.'
                break
              case error.POSITION_UNAVAILABLE:
                errorMsg = 'Location unavailable. Using IP fallback.'
                break
              case error.TIMEOUT:
                errorMsg = 'Location request timed out. Using IP fallback.'
                break
              default:
                errorMsg = 'Unknown error. Using IP fallback.'
            }
            console.warn('Geolocation error:', errorMsg)
            setLocationError(errorMsg)
            getIPLocation().then(resolve).catch(reject)
          },
          { timeout: 10000, enableHighAccuracy: true }
        )
      } else {
        console.warn('Geolocation not supported. Using IP fallback.')
        setLocationError('Your browser does not support location services.')
        getIPLocation().then(resolve).catch(reject)
      }
    })
  }

  const getIPLocation = async () => {
    try {
      const response = await fetch('https://ipapi.co/json/')
      if (!response.ok) throw new Error('Failed to fetch IP location')
      const data = await response.json()
      const location = {
        ip: data.ip,
        city: data.city,
        region: data.region,
        country: data.country_name,
        latitude: data.latitude,
        longitude: data.longitude,
      }
      console.log('IP-based location retrieved:', location)
      return location
    } catch (err) {
      console.warn('Failed to fetch IP location:', err)
      return {
        ip: 'localhost',
        city: '',
        region: '',
        country: '',
        latitude: null,
        longitude: null,
      }
    }
  }

  const login = async (email, password, role) => {
    try {
      const location = await getLocation()
      console.log('Sending location data to backend:', location)

      const response = await fetch(`http://localhost:5000/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password, role, location }),
      })

      if (response.ok) {
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
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to request password reset')
      }
    } catch (error) {
      throw new Error(error.message)
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
    locationError,
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)