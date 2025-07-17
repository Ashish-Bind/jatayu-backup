import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const AuthRoute = () => {
  const { user } = useAuth()
  const location = useLocation()

  if (user) {
    let redirectPath = '/'

    // Dynamic redirect logic
    if (location.pathname.startsWith('/candidate')) {
      redirectPath = '/candidate'
    } else if (location.pathname.startsWith('/admin')) {
      redirectPath = '/admin'
    } else if (location.pathname.startsWith('/recruiter')) {
      redirectPath = '/recruiter'
    } else if (location.pathname.startsWith('/superadmin/login')) {
      redirectPath = '/admin'
    }

    return <Navigate to={redirectPath} replace />
  }

  return <Outlet />
}

export default AuthRoute
