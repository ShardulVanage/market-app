import PocketBase from "pocketbase"
import Cookies from "js-cookie" // For client-side

// Client-side PocketBase instance
let clientPb = null

export function getClientPb() {
  if (!clientPb) {
    clientPb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL)
    // Configure client-side PocketBase to use js-cookie for persistence
    clientPb.authStore.onChange(() => {
      if (clientPb?.authStore.isValid) {
        Cookies.set(
          "pb_auth",
          JSON.stringify({
            token: clientPb.authStore.token,
            model: clientPb.authStore.model,
          }),
          { expires: 7, path: "/" },
        ) // Store for 7 days
      } else {
        Cookies.remove("pb_auth", { path: "/" })
      }
    })
  }
  return clientPb
}

// Server-side PocketBase instance
export function getServerPb(requestCookies) {
  const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL)

  // Attempt to load auth state from the request cookies
  const pbAuthCookie = requestCookies.get("pb_auth")
  if (pbAuthCookie && pbAuthCookie.value && pbAuthCookie.value !== "null") {
    // Added "null" check
    try {
      const authData = JSON.parse(pbAuthCookie.value)
      if (authData.token && authData.model) {
        pb.authStore.save(authData.token, authData.model)
      }
    } catch (error) {
      console.error("Failed to parse pb_auth cookie on server:", error)
      // Clear the cookie if it's malformed to prevent future errors
      requestCookies.delete("pb_auth")
    }
  }
  return pb
}
