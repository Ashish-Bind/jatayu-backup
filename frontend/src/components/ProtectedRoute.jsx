import { Navigate, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useEffect } from 'react'
import ClockLoader from './ClockLoader'

const ProtectedRoute = ({ allowedRoles = [], redirectPath = '/' }) => {
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!user || (user && !allowedRoles.includes(user.role))) {
      navigate(redirectPath)
    }
  }, [user, allowedRoles, navigate, redirectPath])

  if (!user || (user && !allowedRoles.includes(user.role))) {
    return <ClockLoader />
  }

  return <Outlet />
}

export default ProtectedRoute
