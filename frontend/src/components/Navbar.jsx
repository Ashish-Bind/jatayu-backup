import React from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { Zap, Briefcase, User, User2Icon } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

const Navbar = ({
  scrollToTestimonials,
  scrollToFeatures,
  scrollToHowItWorks,
}) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const url = location.pathname

  console.log(url)

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <Zap className="h-8 w-8 text-indigo-600" />
              <h1 className="text-2xl font-extrabold text-indigo-600 ml-2">
                Quizzer
              </h1>
            </Link>
            <div className="hidden md:block ml-10">
              {url === '/' && (
                <div className="flex space-x-8">
                  <Link
                    onClick={scrollToFeatures}
                    className="text-gray-700 hover:text-indigo-600 px-3 py-2  font-medium"
                  >
                    Features
                  </Link>
                  <Link
                    onClick={scrollToHowItWorks}
                    className="text-gray-700 hover:text-indigo-600 px-3 py-2  font-medium"
                  >
                    How It Works
                  </Link>
                  <Link
                    onClick={scrollToTestimonials}
                    className="text-gray-700 hover:text-indigo-600 px-3 py-2  font-medium"
                  >
                    Testimonials
                  </Link>
                </div>
              )}
            </div>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-4">
              {user?.role === 'candidate' ? (
                <>
                  <Link
                    to="/candidate/dashboard"
                    className="text-gray-700 hover:text-indigo-600 px-3 py-2  font-medium flex items-center"
                  >
                    Dashboard
                  </Link>
                  <button
                    className="px-3 py-2  font-medium text-gray-700 hover:text-indigo-600"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                  {user.profile_img ? (
                    <Link to="/candidate/complete-profile">
                      <img
                        src={`http://localhost:5000/static/uploads/${user.profile_img}`}
                        alt="Profile"
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    </Link>
                  ) : (
                    <Link to="/candidate/complete-profile">
                      <User className="h-8 w-8 rounded-full object-cover border" />
                    </Link>
                  )}
                </>
              ) : user?.role === 'recruiter' ? (
                <>
                  <Link
                    to="/recruiter/dashboard"
                    className="text-gray-700 hover:text-indigo-600 px-3 py-2 text-sm font-medium flex items-center"
                  >
                    Dashboard
                  </Link>
                  <button
                    className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                  <User className="h-8 w-8 rounded-full object-cover border" />
                </>
              ) : (
                <>
                  <Link
                    to="/candidate/login"
                    className="px-4 py-2 rounded-md text-sm font-medium text-indigo-600 hover:bg-indigo-50"
                  >
                    Candidate Login
                  </Link>
                  <Link
                    to="/recruiter/login"
                    className="px-4 py-2 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    Recruiter Login
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
