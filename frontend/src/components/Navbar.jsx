import React, { useState, useContext } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { ThemeContext } from '../context/ThemeContext'
import {
  Zap,
  User,
  LogOut,
  Menu,
  X,
  Briefcase,
  Home,
  FileText,
  Sun,
  Moon,
  BarChart2,
} from 'lucide-react'
import LinkButton from './LinkButton'
import Button from './Button'
import { capitalizeFirstLetter } from '../utils/utils'

const Navbar = ({
  scrollToTestimonials,
  scrollToFeatures,
  scrollToHowItWorks,
}) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { theme, toggleTheme } = useContext(ThemeContext)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/')
    setIsMenuOpen(false)
  }

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const navLinks = [
    { name: 'Features', action: scrollToFeatures, show: pathname === '/' },
    {
      name: 'How It Works',
      action: scrollToHowItWorks,
      show: pathname === '/',
    },
    {
      name: 'Testimonials',
      action: scrollToTestimonials,
      show: pathname === '/',
    },
    {
      name: 'Analytics',
      to: '/recruiter/analytics',
      show: user && user.role === 'recruiter' && pathname.startsWith('/recruiter'),
    },
  ]

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <Zap className="h-8 w-8 text-indigo-600 dark:text-indigo-300 transition-colors duration-200" />
              <h1 className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-300 ml-2">
                Quizzer
              </h1>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) =>
              link.show ? (
                link.to ? (
                  <LinkButton
                    key={link.name}
                    to={link.to}
                    variant="link"
                    className="text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-300 font-medium transition-colors duration-200"
                  >
                    {link.name}
                  </LinkButton>
                ) : (
                  <LinkButton
                    key={link.name}
                    variant="link"
                    onClick={link.action}
                    className="text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-300 font-medium transition-colors duration-200"
                  >
                    {link.name}
                  </LinkButton>
                )
              ) : null
            )}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full bg-indigo-500 dark:bg-indigo-600 text-white hover:bg-indigo-600 dark:hover:bg-indigo-700 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? (
                <Moon className="w-5 h-5" />
              ) : (
                <Sun className="w-5 h-5" />
              )}
            </button>
            {user ? (
              <div className="relative group">
                <button className="flex items-center space-x-2 text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-300 focus:outline-none">
                  <span className="font-medium">
                    {capitalizeFirstLetter(user.name) || 'User'}
                  </span>
                  {user.profile_img ? (
                    <img
                      src={`http://localhost:5000/static/uploads/${user.profile_img}`}
                      alt="Profile"
                      className="h-8 w-8 rounded-full object-cover border-2 border-indigo-200 dark:border-indigo-600"
                    />
                  ) : (
                    <User className="h-8 w-8 rounded-full border-2 border-indigo-200 dark:border-indigo-600 p-1 text-gray-700 dark:text-gray-200" />
                  )}
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 rounded-md shadow-lg py-1 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transform translate-y-2 transition-all duration-200 invisible group-hover:visible">
                  {user.role === 'candidate' ? (
                    <>
                      <LinkButton
                        to="/candidate/dashboard"
                        variant="link"
                        className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-600/30 flex items-center"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Home className="w-4 h-4 mr-2" />
                        Dashboard
                      </LinkButton>
                      <LinkButton
                        to="/candidate/complete-profile"
                        variant="link"
                        className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-600/30 flex items-center"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Edit Profile
                      </LinkButton>
                    </>
                  ) : (
                    <LinkButton
                      to="/recruiter/dashboard"
                      variant="link"
                      className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-600/30 flex items-center"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Briefcase className="w-4 h-4 mr-2" />
                      Dashboard
                    </LinkButton>
                  )}
                  <Button
                    variant="link"
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-600/30 flex items-center"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <LinkButton
                  to="/candidate/login"
                  variant="secondary"
                  className="text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-300 px-4 py-2 rounded-md font-medium transition-colors duration-200"
                >
                  Candidate Login
                </LinkButton>
                <Button
                  to="/recruiter/login"
                  variant="primary"
                  className="bg-indigo-500 dark:bg-indigo-600 text-white hover:bg-indigo-600 dark:hover:bg-indigo-700 px-4 py-2 rounded-md font-medium transition-colors duration-200"
                >
                  Recruiter Login
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMenu}
              className="text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-300 focus:outline-none"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map((link) =>
              link.show ? (
                link.to ? (
                  <LinkButton
                    key={link.name}
                    to={link.to}
                    variant="link"
                    className="block px-3 py-2 text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-600/30 font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {link.name}
                  </LinkButton>
                ) : (
                  <LinkButton
                    key={link.name}
                    variant="link"
                    onClick={() => {
                      link.action()
                      setIsMenuOpen(false)
                    }}
                    className="block px-3 py-2 text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-600/30 font-medium"
                  >
                    {link.name}
                  </LinkButton>
                )
              ) : null
            )}
            <button
              onClick={toggleTheme}
              className="w-full text-left px-3 py-2 text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-600/30 flex items-center"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? (
                <Moon className="w-4 h-4 mr-2" />
              ) : (
                <Sun className="w-4 h-4 mr-2" />
              )}
              Toggle Theme
            </button>
            {user ? (
              <>
                {user.role === 'candidate' ? (
                  <>
                    <LinkButton
                      to="/candidate/dashboard"
                      variant="link"
                      className="px-3 py-2 text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-600/30 flex items-center"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Home className="w-4 h-4 mr-2" />
                      Dashboard
                    </LinkButton>
                    <LinkButton
                      to="/candidate/complete-profile"
                      variant="link"
                      className="px-3 py-2 text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-600/30 flex items-center"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Edit Profile
                    </LinkButton>
                  </>
                ) : (
                  <LinkButton
                    to="/recruiter/dashboard"
                    variant="link"
                    className="px-3 py-2 text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-600/30 flex items-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Briefcase className="w-4 h-4 mr-2" />
                    Dashboard
                  </LinkButton>
                )}
                <Button
                  variant="link"
                  className="w-full text-left px-3 py-2 text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-600/30 flex items-center"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <LinkButton
                  to="/candidate/login"
                  variant="secondary"
                  className="block px-3 py-2 text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-600/30"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Candidate Login
                </LinkButton>
                <Button
                  to="/recruiter/login"
                  variant="primary"
                  className="block px-3 py-2 bg-indigo-500 dark:bg-indigo-600 text-white hover:bg-indigo-600 dark:hover:bg-indigo-700"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Recruiter Login
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar