// hooks/useNotification.ts
import * as Notifications from 'expo-notifications'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Platform } from 'react-native'

export type PermissionStatus = 'unknown' | 'granted' | 'denied'

export type AndroidChannelSpec = {
  id: string
  name: string
  description?: string
  importance?: 'min' | 'low' | 'default' | 'high' | 'max'
  sound?: boolean // default true
  vibration?: boolean // default true
  lights?: boolean // default false
}
export type UseNotificationOptions = {
  enabled?: boolean
  defaultChannelId?: string
  channels?: ReadonlyArray<AndroidChannelSpec>
  requestPermissionOnMount?: boolean
  warnOnceOnDenied?: boolean
}
export type NotifyPayload = {
  title: string
  body?: string
  data?: Record<string, unknown>
  channelId?: string
  sound?: boolean
  vibration?: boolean
  tag?: string
}

export type UseNotificationReturn = {
  permissionStatus: PermissionStatus

  ensureReady: (opts?: {
    requestPermission?: boolean
    ensureChannels?: boolean
  }) => Promise<{
    permissionStatus: PermissionStatus
    channelsEnsured: string[]
  }>

  notify: (payload: NotifyPayload) => Promise<{
    ok: boolean
    reason?: 'disabled' | 'permission_denied' | 'not_ready' | 'error'
    notificationId?: string
  }>

  hasEnsuredChannel: (channelId: string) => boolean
}

/**
 * useNotification
 *
 * Expo / React Native friendly local notification helper with:
 * - permission tracking
 * - Android channel setup (idempotent)
 * - safe notify() that never throws
 */
function useNotificationApi(
  opts: UseNotificationOptions = {}
): UseNotificationReturn {
  const {
    enabled = true,
    defaultChannelId = 'default',
    channels = [],
    requestPermissionOnMount = true,
    warnOnceOnDenied = true,
  } = opts

  const [permissionStatus, setPermissionStatus] =
    useState<PermissionStatus>('unknown')

  // Runtime-only caches/guards
  const ensuredChannelsRef = useRef<Set<string>>(new Set())
  const warnedDeniedRef = useRef(false)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  // Map our abstract importance values to Expo's AndroidImportance
  const mapImportance = useCallback((i?: AndroidChannelSpec['importance']) => {
    const A = Notifications.AndroidImportance
    switch (i) {
      case 'min':
        return A.MIN
      case 'low':
        return A.LOW
      case 'high':
        return A.HIGH
      case 'max':
        return A.MAX
      case 'default':
      default:
        return A.DEFAULT
    }
  }, [])

  const declaredChannelById = useMemo(() => {
    const m = new Map<string, AndroidChannelSpec>()
    for (const ch of channels) m.set(ch.id, ch)
    return m
  }, [channels])

  const hasEnsuredChannel = useCallback((channelId: string) => {
    return ensuredChannelsRef.current.has(channelId)
  }, [])

  const safeSetPermissionStatus = useCallback((s: PermissionStatus) => {
    if (mountedRef.current) setPermissionStatus(s)
  }, [])

  const requestPermission = useCallback(async (): Promise<PermissionStatus> => {
    try {
      // First check existing
      const current = await Notifications.getPermissionsAsync()
      const grantedNow = !!current.granted

      if (grantedNow) {
        safeSetPermissionStatus('granted')
        return 'granted'
      }

      // Request
      const req = await Notifications.requestPermissionsAsync()
      const granted = !!req.granted
      const status: PermissionStatus = granted ? 'granted' : 'denied'
      safeSetPermissionStatus(status)

      if (!granted && warnOnceOnDenied && !warnedDeniedRef.current) {
        warnedDeniedRef.current = true
        console.warn('[useNotification] Notification permission denied.')
      }

      return status
    } catch (e) {
      // Treat unknown errors as denied for safety; don't crash the app.
      safeSetPermissionStatus('denied')
      if (warnOnceOnDenied && !warnedDeniedRef.current) {
        warnedDeniedRef.current = true
        console.warn(
          '[useNotification] Failed to request notification permission:',
          e
        )
      }
      return 'denied'
    }
  }, [safeSetPermissionStatus, warnOnceOnDenied])

  const ensureAndroidChannel = useCallback(
    async (channelId: string): Promise<boolean> => {
      if (Platform.OS !== 'android') return true
      if (!channelId) return false
      if (ensuredChannelsRef.current.has(channelId)) return true

      const spec =
        declaredChannelById.get(channelId) ??
        ({
          id: channelId,
          name: channelId === defaultChannelId ? 'General' : channelId,
          importance: channelId === 'pomodoro' ? 'high' : 'default',
          sound: true,
          vibration: channelId === 'pomodoro',
          lights: false,
        } satisfies AndroidChannelSpec)

      try {
        await Notifications.setNotificationChannelAsync(spec.id, {
          name: spec.name,
          description: spec.description,
          importance: mapImportance(spec.importance),
          sound: spec.sound === false ? undefined : 'default', // best-effort
          enableVibrate: spec.vibration !== false,
          enableLights: spec.lights === true,
        })
        ensuredChannelsRef.current.add(channelId)
        return true
      } catch (e) {
        console.warn(
          '[useNotification] Failed to ensure Android channel:',
          channelId,
          e
        )
        return false
      }
    },
    [declaredChannelById, defaultChannelId, mapImportance]
  )

  const ensureDeclaredChannels = useCallback(async (): Promise<string[]> => {
    if (Platform.OS !== 'android') return []
    const ids = new Set<string>([
      defaultChannelId,
      ...channels.map((c) => c.id),
    ])
    const ensured: string[] = []

    for (const id of ids) {
      const ok = await ensureAndroidChannel(id)
      if (ok) ensured.push(id)
    }
    return ensured
  }, [channels, defaultChannelId, ensureAndroidChannel])

  const ensureReady = useCallback<UseNotificationReturn['ensureReady']>(
    async (localOpts) => {
      if (!enabled) {
        return { permissionStatus, channelsEnsured: [] }
      }

      const {
        requestPermission: doPermission = true,
        ensureChannels: doChannels = true,
      } = localOpts ?? {}

      let p = permissionStatus
      if (doPermission) {
        p = await requestPermission()
      }

      let channelsEnsured: string[] = []
      if (doChannels) {
        // Even if permission is denied, ensuring channels is harmless on Android;
        // but we can skip to reduce work.
        if (p === 'granted' || Platform.OS === 'android') {
          channelsEnsured = await ensureDeclaredChannels()
        }
      }

      return { permissionStatus: p, channelsEnsured }
    },
    [enabled, permissionStatus, requestPermission, ensureDeclaredChannels]
  )

  const notify = useCallback<UseNotificationReturn['notify']>(
    async (payload) => {
      if (!enabled) return { ok: false, reason: 'disabled' }

      // Permission gate
      let p = permissionStatus
      if (p === 'unknown') {
        // If they call notify() without pre-calling ensureReady, do best-effort.
        p = await requestPermission()
      }
      if (p !== 'granted') return { ok: false, reason: 'permission_denied' }

      // Channel gate (Android)
      const channelId = payload.channelId ?? defaultChannelId
      if (Platform.OS === 'android') {
        const ok = await ensureAndroidChannel(channelId)
        if (!ok) return { ok: false, reason: 'not_ready' }
      }

      try {
        // Expo immediate local notification: trigger = null
        const notificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: payload.title,
            body: payload.body,
            data: payload.data,
            sound: payload.sound === false ? undefined : 'default', // best-effort
            // Android-only fields:
            ...(Platform.OS === 'android'
              ? {
                  channelId,
                  // NOTE: "tag" support depends on library version; safe to ignore if unsupported.
                  // ts-expect-error - tag is not always in typings across expo-notifications versions
                  tag: payload.tag,
                  // priority is optional; channel importance usually governs behavior.
                }
              : {}),
          },
          trigger: null,
        })

        return { ok: true, notificationId }
      } catch (e) {
        console.warn('[useNotification] notify() failed:', e)
        return { ok: false, reason: 'error' }
      }
    },
    [
      enabled,
      permissionStatus,
      requestPermission,
      defaultChannelId,
      ensureAndroidChannel,
    ]
  )

  // Optional auto-boot: request permission + ensure channels once on mount
  useEffect(() => {
    if (!enabled) return
    if (!requestPermissionOnMount) return
    // Fire-and-forget, but safe: ensureReady handles errors internally
    void ensureReady({ requestPermission: true, ensureChannels: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, requestPermissionOnMount])

  return {
    permissionStatus,
    ensureReady,
    notify,
    hasEnsuredChannel,
  }
}

const NotificationContext = createContext<UseNotificationReturn | null>(null)

export const NotificationProvider = ({ children, channels }) => {
  const notifications = useNotificationApi({
    channels: channels,
    defaultChannelId: 'default',
  })
  return (
    <NotificationContext.Provider value={notifications}>
      {children}
    </NotificationContext.Provider>
  )
}

function useNotification() {
  const ctx = useContext(NotificationContext)
  if (!ctx) {
    throw new Error('useNotification must be used within a StatusProvider')
  }
  return ctx
}

export default useNotification
