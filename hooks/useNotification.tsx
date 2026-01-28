// hooks/useNotification.ts
/**
 * useNotification
 * =============================================================================
 * Expo / React Native (Android-first) local notifications helper built for:
 *
 * 1) Permission management
 *    - Tracks permission status ('unknown' | 'granted' | 'denied')
 *    - Can request permission on mount (Android 13+ requires runtime permission)
 *
 * 2) Android notification channels
 *    - Creates/ensures channels exist (idempotent)
 *    - Caches ensured channel IDs in-memory to avoid repeated native calls
 *
 * 3) Immediate notifications
 *    - notify(payload) -> shows a notification now (trigger: null)
 *
 * 4) Scheduled notifications
 *    - schedule(payload, trigger) -> schedules a notification for the future
 *    - cancelScheduled(id) -> cancels a single scheduled notification
 *    - cancelAllScheduled() -> cancels all scheduled notifications
 *
 * What this hook DOES NOT do:
 * - Push tokens / push notifications
 * - Background services to run JS while app is in background
 * - Any app-specific timer logic (useTimer owns that)
 *
 * Recommended pattern with a wall-clock timer:
 * - When a timer starts, schedule a notification for the target end Date.
 * - When a timer is canceled/ended early, cancel the scheduled notification by id.
 * - When the app resumes, your timer logic should still update UI/state (notifications do not).
 *
 * Foreground behavior note:
 * - Android may not show a heads-up banner if the app is in the foreground unless you
 *   set a notification handler. Consider adding this ONCE near app startup:
 *
 *   import * as Notifications from 'expo-notifications'
 *   Notifications.setNotificationHandler({
 *     handleNotification: async () => ({
 *       shouldShowAlert: true,
 *       shouldPlaySound: true,
 *       shouldSetBadge: false,
 *     }),
 *   })
 */

import * as Notifications from 'expo-notifications'
import React, {
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
  /** Stable channel id. Changing this creates a new channel in Android settings. */
  id: string
  /** Human readable name visible in Android system settings. */
  name: string
  /** Optional description visible in Android system settings. */
  description?: string
  /** Abstracted importance; mapped to expo-notifications AndroidImportance. */
  importance?: 'min' | 'low' | 'default' | 'high' | 'max'
  /** Best-effort default at channel creation time. User can override in OS settings. */
  sound?: boolean // default true
  /** Best-effort default at channel creation time. User can override in OS settings. */
  vibration?: boolean // default true
  /** Best-effort default at channel creation time. User can override in OS settings. */
  lights?: boolean // default false
}

export type UseNotificationOptions = {
  /** Master switch. When false, all operations become no-ops. */
  enabled?: boolean
  /** Default channel used when payload.channelId is omitted. */
  defaultChannelId?: string
  /** Declared channels to ensure exist on Android. */
  channels?: ReadonlyArray<AndroidChannelSpec>
  /** If true, requests permission + ensures channels once on mount. */
  requestPermissionOnMount?: boolean
  /** If true, logs a single warning when permission is denied. */
  warnOnceOnDenied?: boolean
}

export type NotifyPayload = {
  title: string
  body?: string
  data?: Record<string, unknown>
  /** Android channel id (defaults to defaultChannelId). */
  channelId?: string
  /** Best-effort. Android is largely channel-driven; iOS behavior differs. */
  sound?: boolean
  /** Best-effort. Android is largely channel-driven; iOS behavior differs. */
  vibration?: boolean
  /**
   * Optional identifier used for grouping/replacement semantics.
   * Note: support varies by expo-notifications version/typings.
   * If you need stable identification across scheduled notifications,
   * consider embedding { tag } in payload.data instead.
   */
  tag?: string
}

/**
 * ScheduleTrigger
 * Convenience wrapper around expo-notifications triggers.
 *
 * - { at: Date } schedules at an absolute time (best for wall-clock timers)
 * - { inSeconds: number } schedules relative to "now"
 */
export type ScheduleTrigger = { at: Date } | { inSeconds: number }

export type NotifyResult = {
  ok: boolean
  reason?: 'disabled' | 'permission_denied' | 'not_ready' | 'error'
  notificationId?: string
}

export type UseNotificationReturn = {
  permissionStatus: PermissionStatus

  /**
   * ensureReady()
   * Idempotent: requests permission (optional) + ensures channels (optional).
   * Useful if you want to control when permission prompts appear.
   */
  ensureReady: (opts?: {
    requestPermission?: boolean
    ensureChannels?: boolean
  }) => Promise<{
    permissionStatus: PermissionStatus
    channelsEnsured: string[]
  }>

  /**
   * notify()
   * Shows a notification immediately (trigger: null).
   * Never throws; returns ok:false with a reason on failure.
   */
  notify: (payload: NotifyPayload) => Promise<NotifyResult>

  /**
   * schedule()
   * Schedules a notification in the future.
   * Use { at: targetDate } for wall-clock timers so it fires even if JS is paused.
   * Never throws; returns ok:false with a reason on failure.
   */
  schedule: (
    payload: NotifyPayload,
    trigger: ScheduleTrigger
  ) => Promise<NotifyResult>

  /**
   * cancelScheduled()
   * Cancels a single scheduled notification by id.
   * Safe to call even if the id is invalid or already fired.
   */
  cancelScheduled: (notificationId: string) => Promise<void>

  /**
   * cancelAllScheduled()
   * Cancels all scheduled notifications for this app.
   * Use with care; generally prefer cancelScheduled(id).
   */
  cancelAllScheduled: () => Promise<void>

  /** Returns whether the channel has been ensured in this runtime session. */
  hasEnsuredChannel: (channelId: string) => boolean
}

/**
 * useNotificationApi
 * Internal hook. Use the exported useNotification() to access the context.
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

  /**
   * Map our abstract importance to expo-notifications AndroidImportance.
   */
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

  /**
   * Lookup declared channels by id.
   */
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

  /**
   * requestPermission()
   * Checks and requests permission if needed. Never throws.
   */
  const requestPermission = useCallback(async (): Promise<PermissionStatus> => {
    try {
      const current = await Notifications.getPermissionsAsync()
      if (current.granted) {
        safeSetPermissionStatus('granted')
        return 'granted'
      }

      const req = await Notifications.requestPermissionsAsync()
      const status: PermissionStatus = req.granted ? 'granted' : 'denied'
      safeSetPermissionStatus(status)

      if (status === 'denied' && warnOnceOnDenied && !warnedDeniedRef.current) {
        warnedDeniedRef.current = true
        console.warn('[useNotification] Notification permission denied.')
      }

      return status
    } catch (e) {
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

  /**
   * ensureAndroidChannel(channelId)
   * Ensures an Android channel exists. Idempotent; never throws.
   *
   * If the channel is not in declared channels, a fallback spec is created.
   */
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
          // Best-effort. Some behaviors are channel/user controlled.
          sound: spec.sound === false ? undefined : 'default',
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

  /**
   * ensureDeclaredChannels()
   * Ensures defaultChannelId + all declared channels exist (Android only).
   */
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

  /**
   * ensureReady()
   * Requests permission (optional) and ensures channels (optional).
   */
  const ensureReady = useCallback<UseNotificationReturn['ensureReady']>(
    async (localOpts) => {
      if (!enabled) return { permissionStatus, channelsEnsured: [] }

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
        // Channels can be ensured even if permission is denied; keep it simple.
        channelsEnsured = await ensureDeclaredChannels()
      }

      return { permissionStatus: p, channelsEnsured }
    },
    [enabled, permissionStatus, requestPermission, ensureDeclaredChannels]
  )

  type PrepResult =
    | { ok: true; channelId: string; reason?: never }
    | { ok: false; reason: NotifyResult['reason'] }

  /**
   * guardAndPrepare(payload)
   * Shared gate logic for notify() and schedule().
   */
  const guardAndPrepare = useCallback(
    async (payload: NotifyPayload): Promise<PrepResult> => {
      if (!enabled) return { ok: false, reason: 'disabled' }

      let p = permissionStatus
      if (p === 'unknown') {
        p = await requestPermission()
      }
      if (p !== 'granted') return { ok: false, reason: 'permission_denied' }

      const channelId = payload.channelId ?? defaultChannelId
      if (Platform.OS === 'android') {
        const ok = await ensureAndroidChannel(channelId)
        if (!ok) return { ok: false, reason: 'not_ready' }
      }

      return { ok: true, channelId }
    },
    [
      enabled,
      permissionStatus,
      requestPermission,
      defaultChannelId,
      ensureAndroidChannel,
    ]
  )

  /**
   * toExpoTrigger(trigger)
   *
   * IMPORTANT:
   * Some expo-notifications versions accept Date or { seconds } directly,
   * but newer runtimes validate triggers and require an object with a `type`.
   *
   * Using SchedulableTriggerInputTypes keeps us compatible with the stricter validator.
   */
  const toExpoTrigger = useCallback((trigger: ScheduleTrigger) => {
    const T = Notifications.SchedulableTriggerInputTypes

    if ('at' in trigger) {
      return {
        type: T.DATE,
        date: trigger.at,
      }
    }

    return {
      type: T.TIME_INTERVAL,
      seconds: Math.max(1, Math.floor(trigger.inSeconds)),
      repeats: false,
    }
  }, [])

  /**
   * notify()
   * Immediate local notification (trigger: null).
   */
  const notify = useCallback<UseNotificationReturn['notify']>(
    async (payload) => {
      const prep = await guardAndPrepare(payload)
      if (!prep.ok) return { ok: false, reason: prep.reason }

      try {
        const notificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: payload.title,
            body: payload.body,
            data: payload.data,
            sound: payload.sound === false ? undefined : 'default',
            ...(Platform.OS === 'android'
              ? {
                  channelId: prep.channelId,
                  // Optional tag support varies by expo-notifications versions/typings.
                  // @ts-expect-error - tag may not exist in some expo-notifications typings
                  tag: payload.tag,
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
    [guardAndPrepare]
  )

  /**
   * schedule()
   * Schedules a notification for a future time.
   *
   * For wall-clock timers, prefer: schedule(payload, { at: targetDate })
   * so it fires even if JS is paused in background.
   */
  const schedule = useCallback<UseNotificationReturn['schedule']>(
    async (payload, trigger) => {
      const prep = await guardAndPrepare(payload)
      if (!prep.ok) return { ok: false, reason: prep.reason }

      try {
        const expoTrigger = toExpoTrigger(trigger)

        const notificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: payload.title,
            body: payload.body,
            data: payload.data,
            sound: payload.sound === false ? undefined : 'default',
            ...(Platform.OS === 'android'
              ? {
                  channelId: prep.channelId,
                  // ts-expect-error - tag may not exist in some expo-notifications typings
                  tag: payload.tag,
                }
              : {}),
          },
          // "as any" because expo-notifications TriggerInput typing varies across versions.
          trigger: expoTrigger as any,
        })

        return { ok: true, notificationId }
      } catch (e) {
        console.warn('[useNotification] schedule() failed:', e)
        return { ok: false, reason: 'error' }
      }
    },
    [guardAndPrepare, toExpoTrigger]
  )

  /**
   * cancelScheduled()
   * Cancels one scheduled notification by its id. Never throws.
   */
  const cancelScheduled = useCallback(async (notificationId: string) => {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId)
    } catch (e) {
      console.warn('[useNotification] cancelScheduled() failed:', e)
    }
  }, [])

  /**
   * cancelAllScheduled()
   * Cancels all scheduled notifications for the app. Never throws.
   */
  const cancelAllScheduled = useCallback(async () => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync()
    } catch (e) {
      console.warn('[useNotification] cancelAllScheduled() failed:', e)
    }
  }, [])

  /**
   * Auto-boot on mount
   * - Requests permission (optional)
   * - Ensures channels (optional)
   *
   * This runs once per mount; safe even in dev/hot reload scenarios.
   */
  useEffect(() => {
    if (!enabled) return
    if (!requestPermissionOnMount) return
    void ensureReady({ requestPermission: true, ensureChannels: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, requestPermissionOnMount])

  return {
    permissionStatus,
    ensureReady,
    notify,
    schedule,
    cancelScheduled,
    cancelAllScheduled,
    hasEnsuredChannel,
  }
}

const NotificationContext = createContext<UseNotificationReturn | null>(null)

/**
 * NotificationProvider
 * Wrap your app once so useNotification() is accessible anywhere.
 *
 * Example:
 *   <NotificationProvider channels={TODOIT_CHANNELS}>
 *     <App />
 *   </NotificationProvider>
 */
export const NotificationProvider = ({
  children,
  channels,
}: {
  children: React.ReactNode
  channels: ReadonlyArray<AndroidChannelSpec>
}) => {
  const notifications = useNotificationApi({
    channels,
    defaultChannelId: 'default',
  })

  return (
    <NotificationContext.Provider value={notifications}>
      {children}
    </NotificationContext.Provider>
  )
}

/**
 * useNotification
 * Access the notification API from anywhere inside NotificationProvider.
 */
function useNotification() {
  const ctx = useContext(NotificationContext)
  if (!ctx) {
    throw new Error(
      'useNotification must be used within a NotificationProvider'
    )
  }
  return ctx
}

export default useNotification
