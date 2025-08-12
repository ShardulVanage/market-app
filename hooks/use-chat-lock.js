"use client"

import { useState, useRef, useEffect } from "react"

export function useChatLock(lockDuration = 30000) {
  const [isLocked, setIsLocked] = useState(false)
  const lockTimeoutRef = useRef(null)

  const acquireLock = () => {
    setIsLocked(true)

    // Clear existing timeout
    if (lockTimeoutRef.current) {
      clearTimeout(lockTimeoutRef.current)
    }

    // Set new timeout
    lockTimeoutRef.current = setTimeout(() => {
      setIsLocked(false)
    }, lockDuration)
  }

  const releaseLock = () => {
    setIsLocked(false)
    if (lockTimeoutRef.current) {
      clearTimeout(lockTimeoutRef.current)
      lockTimeoutRef.current = null
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (lockTimeoutRef.current) {
        clearTimeout(lockTimeoutRef.current)
      }
    }
  }, [])

  return {
    isLocked,
    acquireLock,
    releaseLock,
  }
}
