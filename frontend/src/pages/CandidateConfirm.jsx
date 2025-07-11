import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Mail, ArrowRight } from 'lucide-react'
import LinkButton from '../components/LinkButton'
import Navbar from '../components/Navbar'

const CandidateConfirm = () => {
  const [searchParams] = useSearchParams()
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const confirmEmail = async () => {
    if (!token) {
      setError('Invalid confirmation link.')
      return
    }

    setLoading(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch('http://localhost:5000/api/auth/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to confirm email.')
      }

      setMessage('Email confirmed successfully. Redirecting to login...')
      setTimeout(() => navigate('/candidate/login'), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-950 flex flex-col">
      <Navbar userType="none" />
      <div className="flex-grow flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Email Confirmation
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-300">
            Already confirmed?{' '}
            <LinkButton to="/candidate/login" variant="link">
              Sign in
            </LinkButton>
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white dark:bg-gray-900 border dark:border-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
            {error && (
              <div className="text-red-500 text-sm text-center mb-4">
                {error}
              </div>
            )}
            {message && (
              <div className="text-green-500 text-sm text-center mb-4">
                {message}
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300 my-2">
                Please verify your email address by clicking the confirm email
                button below.
              </p>
            </div>
            <div className="mt-1 relative rounded-md shadow-sm mb-4">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400 dark:text-gray-300" />
              </div>
              <input
                type="text"
                value={token || ''}
                readOnly
                className="py-2 pl-10 block w-full border border-gray-300 dark:border-gray-700 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200"
                placeholder="Confirmation token"
              />
            </div>
            <div>
              <button
                onClick={confirmEmail}
                disabled={loading || !token}
                className={`w-full flex justify-center items-center gap-2 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  loading || !token
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-indigo-500 hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                }`}
              >
                {loading ? 'Confirming...' : 'Confirm Email'}
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CandidateConfirm
