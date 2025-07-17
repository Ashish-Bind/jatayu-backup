import React from 'react'

const FormInput = ({
  label,
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  min,
  step,
  options,
  ...props
}) => (
  <div>
    <label
      htmlFor={id}
      className="block text-base font-medium text-gray-700 dark:text-gray-200 mb-1"
    >
      {label}
    </label>
    {type === 'select' ? (
      <select
        id={id}
        value={value}
        onChange={onChange}
        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md focus:ring-indigo-600 focus:border-indigo-600 dark:bg-gray-700 dark:text-gray-200 text-base transition-all duration-200"
        required={required}
        {...props}
      >
        <option value="">Select a degree</option>
        {options?.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    ) : (
      <input
        type={type}
        id={id}
        value={value}
        onChange={onChange}
        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md focus:ring-indigo-600 focus:border-indigo-600 dark:bg-gray-700 dark:text-gray-200 text-base placeholder-gray-400 dark:placeholder-gray-300 transition-all duration-200"
        placeholder={placeholder}
        required={required}
        min={min}
        step={step}
        {...props}
      />
    )}
  </div>
)
export default FormInput
