import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { AppState } from 'react-native'
import useNotification from './useNotification'

type TimeObject = {
  ms: number
  minutes: number
  seconds: number
  timeString: string
}

type TimerSnapshot = {
  elapsed: TimeObject
  remaining: TimeObject
}
// TODO: refactor to timer.set, timer.clear, timer.elapsed, etc
type ContextType = {
  /** Starts (or restarts) a timer that ends at now + durationInMs. */
  setTimer: () => void
  /** Clears the current timer and cancels any scheduled "timer complete" notification. */
  clearTimer: () => void
  /** Live wall-clock snapshot, updated by the provider while timerActive. */
  timer: TimerSnapshot
  timerActive: boolean
  setDurationInMs: (durationInMs: number) => void
  durationInMs: number
}

const TimerContext = createContext<ContextType | null>(null)

export const TimerProvider = ({ children }: { children: React.ReactNode }) => {
  const [targetTime, setTargetTime] = useState<Date | null>(null)
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [timerActive, setTimerActive] = useState<boolean>(false)
  const [durationInMs, setDurationInMs] = useState<number>(25 * 60 * 1000)
  // Provider-owned clock for UI refresh
  const [nowMs, setNowMs] = useState<number>(() => Date.now())

  const { schedule, cancelScheduled } = useNotification()

  /**
   * Scheduled notification id for the active timer.
   * Stored in a ref so cancellation is reliable and synchronous.
   */
  const scheduledNotifIdRef = useRef<string | null>(null)

  const setTimer = () => {
    // Cancel any previously scheduled notification
    if (scheduledNotifIdRef.current) {
      void cancelScheduled(scheduledNotifIdRef.current)
      scheduledNotifIdRef.current = null
    }

    const msNow = Date.now()
    const start = new Date(msNow)
    const target = new Date(msNow + durationInMs)

    setStartTime(start)
    setTargetTime(target)
    setTimerActive(true)
    setNowMs(msNow)

    // Schedule notification at wall-clock end time
    void (async () => {
      const res = await schedule(
        {
          title: 'You did it!',
          body: 'Pomodoro complete.',
          channelId: 'pomodoro',
          data: {
            kind: 'timer_complete',
            targetTimeMs: target.getTime(),
          },
        },
        { at: target }
      )

      if (res.ok && res.notificationId) {
        scheduledNotifIdRef.current = res.notificationId
      } else {
        console.warn(
          '[useTimer] Failed to schedule timer notification:',
          res.reason
        )
      }
    })()
  }

  const clearTimer = () => {
    if (scheduledNotifIdRef.current) {
      void cancelScheduled(scheduledNotifIdRef.current)
      scheduledNotifIdRef.current = null
    }

    setTargetTime(null)
    setStartTime(null)
    setTimerActive(false)
    setNowMs(Date.now())
  }

  /**
   * Provider-driven ticking:
   * - Interval while active (UI refresh only)
   * - Immediate refresh on app resume
   */
  useEffect(() => {
    if (!timerActive) return

    const tick = () => setNowMs(Date.now())

    tick()

    const intervalId = setInterval(tick, 1000)
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') tick()
    })

    return () => {
      clearInterval(intervalId)
      sub.remove()
    }
  }, [timerActive])

  /**
   * Compute the live timer snapshot from wall clock
   */
  const timer: TimerSnapshot = useMemo(() => {
    const remainingMs = targetTime == null ? -1 : targetTime.getTime() - nowMs
    const elapsedMs = startTime == null ? -1 : nowMs - startTime.getTime()

    return {
      remaining: makeTimeObject(remainingMs),
      elapsed: makeTimeObject(elapsedMs),
    }
  }, [nowMs, startTime, targetTime])

  const value: ContextType = {
    setTimer,
    clearTimer,
    timer,
    timerActive,
    setDurationInMs,
    durationInMs,
  }

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>
}

const useTimer = (): ContextType => {
  const ctx = useContext(TimerContext)
  if (!ctx) {
    throw new Error(
      'useTimer may only be used in a component that is a descendent of TimerProvider'
    )
  }
  return ctx
}

/**
 * Converts milliseconds to a TimeObject suitable for display.
 */
function makeTimeObject(ms: number): TimeObject {
  const safeMs = Math.max(0, ms)
  const minutes = Math.floor(safeMs / 60000)
  const seconds = Math.floor((safeMs % 60000) / 1000)
  return {
    ms,
    minutes,
    seconds,
    timeString: formatTime(minutes, seconds),
  }
}

function formatTime(minutes: number, seconds: number) {
  return `${minutes < 10 ? `0${minutes}` : minutes}:${
    seconds < 10 ? `0${seconds}` : seconds
  }`
}

export default useTimer
