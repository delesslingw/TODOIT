// src/googleToken.ts
import { GoogleSignin } from '@react-native-google-signin/google-signin'

let inFlight: Promise<string> | null = null

/**
 * Returns a valid access token if the user is signed in.
 * Ensures we never call GoogleSignin.getTokens() concurrently.
 */
export async function getAccessTokenOrThrow(): Promise<string> {
  if (inFlight) return inFlight

  inFlight = (async () => {
    const { accessToken } = await GoogleSignin.getTokens()
    if (!accessToken) throw new Error('No access token available')
    return accessToken
  })()

  try {
    return await inFlight
  } finally {
    inFlight = null
  }
}
