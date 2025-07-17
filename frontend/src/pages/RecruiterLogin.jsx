import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, ArrowRight } from 'lucide-react'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import Button from '../components/Button'

const RecruiterLogin = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const { user, recruiterLogin, loading } = useAuth()

  console.log(user)

  if (loading) {
    return <div>Loading...</div>
  }

  if (user) {
    navigate('/recruiter/dashboard')
    return
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    try {
      const response = await recruiterLogin(email, password)

      if (response) {
        navigate('/')
      } else {
        setError('Invalid credentials')
      }
    } catch (err) {
      setError('An error occurred during login')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-gray-950 dark:to-gray-900 flex flex-col">
      <Navbar userType="none" />
      <div className="flex-grow flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Recruiter Login
          </h2>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white dark:bg-gray-900 border dark:border-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="text-red-500 dark:text-red-300 text-sm text-center">
                  {error}
                </div>
              )}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-200"
                >
                  Work email address
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400 dark:text-gray-300" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="py-2 pl-10 block w-full border border-gray-300 dark:border-gray-700 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200"
                    placeholder="you@company.com"
                    onChange={(e) => setEmail(e.target.value)}
                    value={email}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-200"
                >
                  Password
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400 dark:text-gray-300" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className="py-2 pl-10 block w-full border border-gray-300 dark:border-gray-700 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200"
                    placeholder="••••••••"
                    onChange={(e) => setPassword(e.target.value)}
                    value={password}
                  />
                </div>
              </div>

              <div>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading}
                  className="gap-2 items-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white dark:border-gray-200"></div>
                      Signing in
                    </>
                  ) : (
                    <>
                      Sign in
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RecruiterLogin
