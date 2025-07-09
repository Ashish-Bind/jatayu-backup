import clsx from 'clsx'
import { Link } from 'react-router-dom'

function LinkButton({ children, className, variant = 'none', ...props }) {
  const variants = {
    primary:
      'px-6 py-3 rounded-md text-sm font-medium text-white bg-indigo-600 dark:bg-indigo-600 hover:bg-indigo-700 dark:hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800',
    secondary:
      'px-6 py-3 rounded-md text-sm font-medium text-indigo-600 dark:text-indigo-300 border border-indigo-600 dark:border-indigo-300 bg-white dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-indigo-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800',
    bordered:
      'font-mono px-6 py-3 rounded-md text-sm font-medium text-indigo-600 dark:text-indigo-300 bg-white dark:bg-gray-800 border border-indigo-600 dark:border-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800',
    link: 'text-base font-medium text-indigo-600 dark:text-indigo-300 hover:text-indigo-700 dark:hover:text-indigo-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800',
    none: '',
  }

  const classes = clsx(variants[variant], className)

  return (
    <Link className={classes} {...props}>
      {children}
    </Link>
  )
}

export default LinkButton
