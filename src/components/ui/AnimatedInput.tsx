'use client';

import type { ReactNode } from 'react';
import React, { forwardRef, useState } from 'react';

interface AnimatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  type?: string;
  placeholder?: string;
  icon?: ReactNode;
  rightIcon?: ReactNode;
  error?: string | undefined;
  className?: string;
}

const AnimatedInput = forwardRef<HTMLInputElement, AnimatedInputProps>(
  ({ label, type = 'text', placeholder, icon, rightIcon, error, className = '', ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const [hasValue, setHasValue] = useState(false);

    const handleFocus = () => setIsFocused(true);
    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      setHasValue(!!e.target.value);
      props.onBlur?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasValue(!!e.target.value);
      props.onChange?.(e);
    };

    return (
      <div className='relative'>
        {/* Input container */}
        <div className='relative'>
          {/* Left icon */}
          {icon && (
            <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3'>
              <div
                className={`transition-colors duration-200 ${
                  isFocused ? 'text-blue-500' : error ? 'text-red-400' : 'text-gray-400'
                }`}>
                {icon}
              </div>
            </div>
          )}

          {/* Input field */}
          <input
            {...props}
            ref={ref}
            type={type}
            className={`peer block w-full appearance-none rounded-md border px-3 py-3 text-gray-900 transition-all duration-200 ${icon ? 'pl-10' : 'pl-3'} ${rightIcon ? 'pr-10' : 'pr-3'} ${
              error
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
            } ${isFocused ? 'ring-opacity-20 ring-2' : ''} focus:outline-none ${className} `}
            placeholder={isFocused || hasValue ? placeholder : ''}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleChange}
          />

          {/* Floating label */}
          <label
            className={`pointer-events-none absolute left-3 transition-all duration-200 ${icon ? 'left-10' : 'left-3'} ${
              isFocused || hasValue
                ? 'top-0 -translate-y-1/2 bg-white px-1 text-xs font-medium'
                : 'top-1/2 -translate-y-1/2 text-sm'
            } ${isFocused ? (error ? 'text-red-500' : 'text-blue-500') : error ? 'text-red-400' : 'text-gray-500'} `}>
            {label}
          </label>

          {/* Right icon */}
          {rightIcon && <div className='absolute inset-y-0 right-0 flex items-center pr-3'>{rightIcon}</div>}
        </div>

        {/* Error message */}
        {error && (
          <div className='animate-fade-in mt-1'>
            <p className='text-sm text-red-600'>{error}</p>
          </div>
        )}
      </div>
    );
  },
);

AnimatedInput.displayName = 'AnimatedInput';

export default AnimatedInput;
