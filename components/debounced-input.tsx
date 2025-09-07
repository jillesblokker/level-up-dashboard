import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface DebouncedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  debounceMs?: number;
  medieval?: boolean;
  className?: string;
}

export function DebouncedInput({
  value,
  onChange,
  debounceMs = 300,
  medieval = true,
  className,
  ...props
}: DebouncedInputProps) {
  const [localValue, setLocalValue] = useState(value);

  // Update local value when prop value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Debounced onChange
  const debouncedOnChange = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (newValue: string) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          onChange(newValue);
        }, debounceMs);
      };
    })(),
    [onChange, debounceMs]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    debouncedOnChange(newValue);
  };

  const inputClasses = medieval
    ? 'bg-amber-50/10 border-amber-600/30 text-amber-100 placeholder-amber-300/50 focus:border-amber-500 focus:ring-amber-500/20 backdrop-blur-sm'
    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500/20';

  return (
    <Input
      {...props}
      value={localValue}
      onChange={handleChange}
      className={cn(
        'transition-all duration-200',
        inputClasses,
        medieval && 'rounded-lg shadow-inner',
        className
      )}
    />
  );
}

// Debounced search input
interface DebouncedSearchProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  medieval?: boolean;
  className?: string;
  debounceMs?: number;
}

export function DebouncedSearch({
  onSearch,
  placeholder = 'Search...',
  medieval = true,
  className,
  debounceMs = 300,
}: DebouncedSearchProps) {
  const [query, setQuery] = useState('');

  const handleSearch = useCallback((newQuery: string) => {
    onSearch(newQuery);
  }, [onSearch]);

  return (
    <DebouncedInput
      value={query}
      onChange={handleSearch}
      debounceMs={debounceMs}
      medieval={medieval}
      placeholder={placeholder}
      {...(className && { className })}
    />
  );
}

// Debounced textarea
interface DebouncedTextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  debounceMs?: number;
  medieval?: boolean;
  className?: string;
}

export function DebouncedTextarea({
  value,
  onChange,
  debounceMs = 300,
  medieval = true,
  className,
  ...props
}: DebouncedTextareaProps) {
  const [localValue, setLocalValue] = useState(value);

  // Update local value when prop value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Debounced onChange
  const debouncedOnChange = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (newValue: string) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          onChange(newValue);
        }, debounceMs);
      };
    })(),
    [onChange, debounceMs]
  );

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    debouncedOnChange(newValue);
  };

  const textareaClasses = medieval
    ? 'bg-amber-50/10 border-amber-600/30 text-amber-100 placeholder-amber-300/50 focus:border-amber-500 focus:ring-amber-500/20 backdrop-blur-sm'
    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500/20';

  return (
    <textarea
      {...props}
      value={localValue}
      onChange={handleChange}
      className={cn(
        'flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2',
        textareaClasses,
        medieval && 'rounded-lg shadow-inner',
        className
      )}
    />
  );
}

// Quest search component
interface QuestSearchProps {
  onSearch: (query: string) => void;
  className?: string;
}

export function QuestSearch({ onSearch, className }: QuestSearchProps) {
  return (
    <div className={cn('relative', className)}>
      <DebouncedSearch
        onSearch={onSearch}
        placeholder="Search quests..."
        medieval={true}
        className="pl-10"
      />
      <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
        <svg className="h-4 w-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
    </div>
  );
}

// Kingdom search component
interface KingdomSearchProps {
  onSearch: (query: string) => void;
  className?: string;
}

export function KingdomSearch({ onSearch, className }: KingdomSearchProps) {
  return (
    <div className={cn('relative', className)}>
      <DebouncedSearch
        onSearch={onSearch}
        placeholder="Search kingdom tiles..."
        medieval={true}
        className="pl-10"
      />
      <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
        <svg className="h-4 w-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
    </div>
  );
}
