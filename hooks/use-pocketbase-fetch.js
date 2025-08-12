"use client"

import { useEffect, useCallback, useState } from "react"

/**
 * Custom hook for PocketBase data fetching with auto-cancellation handling
 * @param {Function} fetchFn - Function that performs the fetch operation, receives AbortSignal as parameter
 * @param {Array} deps - Dependencies array for useEffect
 * @param {number} delay - Debounce delay in milliseconds (default: 100)
 */
export function usePocketBaseFetch(fetchFn, deps, delay = 100) {
  const memoizedFetchFn = useCallback(fetchFn, deps)

  useEffect(() => {
    const controller = new AbortController()

    const timeout = setTimeout(() => {
      memoizedFetchFn(controller.signal)
    }, delay)

    return () => {
      controller.abort()
      clearTimeout(timeout)
    }
  }, [memoizedFetchFn, delay])
}

/**
 * Enhanced version with loading state management
 * @param {Function} fetchFn - Function that performs the fetch operation
 * @param {Array} deps - Dependencies array
 * @param {number} delay - Debounce delay in milliseconds
 * @returns {boolean} isLoading - Loading state
 */
export function usePocketBaseFetchWithLoading(fetchFn, deps, delay = 100) {
  const [isLoading, setIsLoading] = useState(true)

  const wrappedFetchFn = useCallback(
    async (signal) => {
      setIsLoading(true)
      try {
        await fetchFn(signal)
      } finally {
        setIsLoading(false)
      }
    },
    [fetchFn],
  )

  usePocketBaseFetch(wrappedFetchFn, deps, delay)

  return isLoading
}
