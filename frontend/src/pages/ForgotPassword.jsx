import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail } from 'lucide-react'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import Button from '../components/Button'
import LinkButton from '../components/LinkButton'

const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { requestPasswordReset } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    try {
      await requestPasswordReset(email)
      setMessage(
        'If an account exists for this email, a password reset link has been sent.'
      )
      setEmail('')
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
      setEmail('')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-950 flex flex-col">
      <Navbar userType="none" />
      <div className="flex-grow flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Reset Your Password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-300">
            Enter your email address to receive a password reset link.
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white dark:bg-gray-900 border dark:border-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="text-red-500 text-sm text-center">{error}</div>
              )}
              {message && (
                <div className="text-green-500 text-sm text-center">
                  {message}
                </div>
              )}

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-200"
                >
                  Email address
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
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading}
                  className="gap-2 items-center w-full text-sm"
                >
                  Send Reset Link
                </Button>
              </div>
            </form>

            <div className="mt-2 text-center">
              <LinkButton
                to="/candidate/login"
                variant="link"
                className="font-medium text-indigo-600 dark:text-indigo-300 hover:text-indigo-500 dark:hover:text-indigo-400 text-sm"
              >
                Back to Login
              </LinkButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword
