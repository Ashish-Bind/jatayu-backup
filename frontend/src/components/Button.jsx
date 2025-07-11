import clsx from 'clsx'
import { useNavigate } from 'react-router-dom'

function Button({
  children,
  className,
  variant = 'primary',
  disabled,
  to,
  ...props
}) {
  const navigate = useNavigate()

  const handleClick = (e) => {
    if (disabled) {
      e.preventDefault()
      return
    }
    if (to) {
      navigate(to) // navigate to the route
    }
    if (props.onClick) {
      props.onClick(e)
    }
  }

  const variants = {
    primary:
      'flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-600 dark:bg-indigo-600 hover:bg-indigo-700 dark:hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800',
    secondary:
      'flex justify-center py-2 px-4 border border-indigo-600 dark:border-indigo-300 rounded-md shadow-sm text-base font-medium text-indigo-600 dark:text-indigo-300 bg-white dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-indigo-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800',
    disabled:
      'flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-gray-400 dark:bg-gray-600 cursor-not-allowed',
  }

  const classes = clsx(variants[disabled ? 'disabled' : variant], className)

  return (
    <button
      className={classes}
      disabled={disabled}
      {...props}
      onClick={handleClick}
    >
      {children}
    </button>
  )
}

export default Button
