"use client"

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react"
import { getClientPb } from "@/lib/pocketbase"

const AuthContext = createContext(undefined)

export function AuthProvider({ children, initialAuth }) {
  const pb = getClientPb()
  const [currentUser, setCurrentUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const refreshTimeoutRef = useRef(null)

  // Initialize auth store from server-provided data and immediately refresh
  useEffect(() => {
    const initializeAuth = async () => {
      if (initialAuth?.token && initialAuth?.model) {
        pb.authStore.save(initialAuth.token, initialAuth.model)
      } else {
        pb.authStore.clear()
      }

      // Attempt to refresh auth immediately to get the latest user data from DB
      // This is crucial for reflecting admin-side changes like profileStatus
      if (pb.authStore.isValid) {
        try {
          const timestamp = new Date().getTime()
          await pb.collection("users").authRefresh({
            requestKey: `auth-refresh-initial-${timestamp}`, // Unique key for initial refresh
          })
          setCurrentUser(pb.authStore.model)
        } catch (error) {
          console.error("Initial auth refresh failed:", error)
          pb.authStore.clear()
          setCurrentUser(null)
        }
      } else {
        setCurrentUser(null)
      }
      setIsLoading(false)
    }

    initializeAuth()
  }, [initialAuth?.token, initialAuth?.model, pb.authStore, pb.collection]) // Added pb.collection to dependencies

  // Listen for auth store changes (client-side only)
  useEffect(() => {
    const unsubscribe = pb.authStore.onChange((token, model) => {
      setCurrentUser(model)
    })
    return () => unsubscribe()
  }, [pb.authStore])

  // Clear any existing refresh timeout when component unmounts
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }
    }
  }, [])

  const refreshAuth = useCallback(async () => {
    if (isLoading) return

    setIsLoading(true)
    try {
      if (pb.authStore.isValid) {
        const timestamp = new Date().getTime()
        await pb.collection("users").authRefresh({
          requestKey: `auth-refresh-${timestamp}`,
        })
        setCurrentUser(pb.authStore.model)
      } else {
        setCurrentUser(null)
      }
    } catch (error) {
      console.error("Failed to refresh auth token:", error)
      pb.authStore.clear()
      setCurrentUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [pb, isLoading])

  const login = useCallback(
    async (email, password) => {
      setIsLoading(true)
      try {
        await pb.collection("users").authWithPassword(email, password)
        setCurrentUser(pb.authStore.model)
      } catch (error) {
        console.error("Login failed:", error)
        throw new Error(error.message || "Login failed")
      } finally {
        setIsLoading(false)
      }
    },
    [pb],
  )

  const register = useCallback(
    async (userData) => {
      setIsLoading(true)
      try {
        await pb.collection("users").create(userData)
      } catch (error) {
        console.error("Registration failed:", error.response?.data || error.message)
        throw new Error(error.message || "Registration failed")
      } finally {
        setIsLoading(false)
      }
    },
    [pb],
  )

  const logout = useCallback(() => {
    setIsLoading(true)
    pb.authStore.clear()
    setCurrentUser(null)
    setIsLoading(false)
  }, [pb])

  const requestOTP = useCallback(
    async (email) => {
      setIsLoading(true)
      try {
        const timestamp = new Date().getTime()
        const response = await pb.collection("users").requestOTP(email, {
          requestKey: `request-otp-${timestamp}`,
        })
        return response.otpId
      } catch (error) {
        console.error("Request OTP failed:", error)
        throw new Error(error.message || "Failed to request OTP")
      } finally {
        setIsLoading(false)
      }
    },
    [pb],
  )

  const authWithOTP = useCallback(
    async (otpId, otp) => {
      setIsLoading(true)
      try {
        const authData = await pb.collection("users").authWithOTP(otpId, otp)
        setCurrentUser(authData.record)
        await pb.collection("users").update(authData.record.id, { verified: true })
        setCurrentUser({ ...authData.record, verified: true })
      } catch (error) {
        console.error("OTP verification failed:", error)
        throw new Error(error.message || "OTP verification failed")
      } finally {
        setIsLoading(false)
      }
    },
    [pb],
  )

  const value = {
    pb,
    currentUser,
    isLoading,
    login,
    register,
    logout,
    requestOTP,
    authWithOTP,
    refreshAuth,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
