import React from 'react'
import { XCircle } from 'lucide-react'
import Button from './Button'

const FullScreenWarning = ({
  fullscreenWarnings,
  maxWarnings,
  setShowFullscreenWarning,
  handleFullscreenChange,
  warningType,
}) => {
  const isPermissionError = warningType === 'permission'
  const message = isPermissionError
    ? 'Failed to enter fullscreen mode. Please enable fullscreen to continue the assessment.'
    : `Warning: You have exited fullscreen mode (${fullscreenWarnings}/${maxWarnings}). Please stay in fullscreen to continue the assessment.`

  return (
    <div
      className="bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-500 text-yellow-700 dark:text-yellow-300 p-3 mb-6 rounded-md text-sm flex items-center gap-2"
      role="alert"
    >
      <XCircle className="w-4 h-4" />
      <p>{message}</p>
      <Button
        onClick={() => {
          setShowFullscreenWarning(false)
          if (!isPermissionError) {
            handleFullscreenChange()
          }
        }}
        variant="secondary"
        size="sm"
        className="ml-auto gap-1"
      >
        {isPermissionError ? 'OK' : 'Re-enter Fullscreen'}
      </Button>
    </div>
  )
}

export default FullScreenWarning
