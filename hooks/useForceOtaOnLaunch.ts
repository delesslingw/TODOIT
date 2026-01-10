import * as Updates from 'expo-updates'
import { useEffect, useState } from 'react'

export function useForceOtaOnLaunch() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let mounted = true

    ;(async () => {
      try {
        const result = await Updates.checkForUpdateAsync()
        if (result.isAvailable) {
          await Updates.fetchUpdateAsync()
          // This reloads into the new update immediately
          await Updates.reloadAsync()
          return // reloadAsync replaces the JS, so we won't continue
        }
      } catch (e) {
        // If offline / error, just continue with what we have
        console.log('OTA check failed:', e)
      } finally {
        if (mounted) setReady(true)
      }
    })()

    return () => {
      mounted = false
    }
  }, [])

  return ready
}
