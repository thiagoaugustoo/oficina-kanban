import React from 'react';
import { cn } from '../../utils/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-gray-300">{label}</label>}
      <input
        className={cn(
          'w-full bg-gray-800 border border-gray-600 rounded-xl px-3.5 py-2.5 text-white placeholder-gray-500',
          'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          error && 'border-red-500 focus:ring-red-500',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export function Select({ label, error, className, children, ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-gray-300">{label}</label>}
      <select
        className={cn(
          'w-full bg-gray-800 border border-gray-600 rounded-xl px-3.5 py-2.5 text-white',
          'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          error && 'border-red-500 focus:ring-red-500',
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className, ...props }: TextareaProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-gray-300">{label}</label>}
      <textarea
        className={cn(
          'w-full bg-gray-800 border border-gray-600 rounded-xl px-3.5 py-2.5 text-white placeholder-gray-500',
          'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          error && 'border-red-500 focus:ring-red-500',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

interface ToggleProps {
  label?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function Toggle({ label, checked, onChange, disabled }: ToggleProps) {
  return (
    <label className={cn('flex items-center gap-3 select-none', !disabled && 'cursor-pointer')}>
      <div
        className={cn(
          'relative w-11 h-6 rounded-full transition-colors duration-200',
          disabled ? 'bg-gray-700 opacity-50' : (checked ? 'bg-indigo-600' : 'bg-gray-600')
        )}
        onClick={() => !disabled && onChange(!checked)}
      >
        <div className={cn(
          'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200',
          checked ? 'translate-x-5' : 'translate-x-0'
        )} />
      </div>
      {label && <span className={cn('text-sm', disabled ? 'text-gray-500' : 'text-gray-300')}>{label}</span>}
    </label>
  );
}
