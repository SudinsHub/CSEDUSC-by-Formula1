'use client';

import React from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  isLoading?: boolean;
  onClear?: () => void;
}

export default function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  isLoading = false,
  onClear,
  className,
  ...props
}: SearchInputProps) {
  const handleClear = () => {
    onChange('');
    if (onClear) {
      onClear();
    }
  };

  return (
    <div className={cn('relative flex items-center w-full', className)}>
      <div className="absolute left-3.5 text-gray-400 pointer-events-none">
        <Search className="w-4 h-4" />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-2 border border-gray-200 rounded-lg text-sm bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent transition-all duration-200"
        {...props}
      />
      <div className="absolute right-3 flex items-center gap-1.5">
        {isLoading && (
          <Loader2 className="w-4 h-4 text-gold-500 animate-spin" />
        )}
        {!isLoading && value && (
          <button
            type="button"
            onClick={handleClear}
            className="text-gray-450 hover:text-gray-650 p-0.5 rounded-full hover:bg-gray-100 transition-all duration-200"
            title="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
