import { useEffect, useState } from 'react'

/**
 * Custom hook para debounce de valores
 * Útil para otimizar buscas e reduzir requisições desnecessárias
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}