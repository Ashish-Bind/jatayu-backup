import { Clock } from 'lucide-react'

function ClockLoader() {
  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800">
      <Clock className="w-8 h-8 text-indigo-600 animate-spin" />
    </div>
  )
}

export default ClockLoader
