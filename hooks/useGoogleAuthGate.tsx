// hooks/useGoogleAuthGate.ts
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  connectGoogle,
  initGoogleAuth,
  trySilentGoogleConnect,
} from '../helpers/googleAuth'

type UseGoogleAuthGateOpts = {
  /** If false, skip silent connect on mount */
  silentOnMount?: boolean
}

export function useGoogleAuthGate(opts: UseGoogleAuthGateOpts = {}) {
  const { silentOnMount = true } = opts

  const [connected, setConnected] = useState(false)
  const [authBooting, setAuthBooting] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)

  // Prevent setState after unmount
  const aliveRef = useRef(true)

  useEffect(() => {
    aliveRef.current = true

    // init should happen once per mount (dev refresh remounts will rerun)
    initGoogleAuth()

    if (!silentOnMount) {
      setAuthBooting(false)
      return () => {
        aliveRef.current = false
      }
    }

    ;(async () => {
      try {
        const token = await trySilentGoogleConnect()
        if (!aliveRef.current) return

        if (token) setConnected(true)
      } catch (err) {
        if (!aliveRef.current) return
        setAuthError(String(err))
      } finally {
        if (!aliveRef.current) return
        setAuthBooting(false)
      }
    })()

    return () => {
      aliveRef.current = false
    }
  }, [silentOnMount])

  const connect = useCallback(async () => {
    try {
      setAuthError(null)
      setAuthBooting(true)

      const token = await connectGoogle()
      console.log('token ok:', token.slice(0, 10))

      if (!aliveRef.current) return
      setConnected(true)
    } catch (err) {
      if (!aliveRef.current) return
      setAuthError(String(err))
    } finally {
      if (!aliveRef.current) return
      setAuthBooting(false)
    }
  }, [])

  const disconnect = useCallback(() => {
    // optional: you may also want to revoke token / signOut here
    if (!aliveRef.current) return
    setConnected(false)
  }, [])

  return {
    connected,
    authBooting,
    authError,
    connect,
    disconnect, // optional but nice
    // escape hatches if you want them:
    setConnected,
    setAuthError,
  }
}
