import React, {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from 'react'

type SessionStateContextValue = {
  tasksCompleted: number
  incrementTasksCompleted: (increment?: number) => void
  resetTasksCompleted: () => void
  completedTimeString: string
  setCompletedTimeString: (value: string) => void
}

const SessionStateContext = createContext<SessionStateContextValue | undefined>(
  undefined
)

export function SessionStateProvider({ children }: { children: ReactNode }) {
  const [tasksCompleted, setTasksCompleted] = useState<number>(0)
  const [completedTimeString, setCompletedTimeString] = useState<string>('')

  const value: SessionStateContextValue = {
    tasksCompleted,
    resetTasksCompleted: () => setTasksCompleted(0),
    incrementTasksCompleted: (inc = 1) => setTasksCompleted((num) => num + inc),
    completedTimeString,
    setCompletedTimeString,
  }
  return (
    <SessionStateContext.Provider value={value}>
      {children}
    </SessionStateContext.Provider>
  )
}

export function useSessionState() {
  const ctx = useContext(SessionStateContext)
  if (!ctx) {
    throw new Error('useStatus must be used within a StatusProvider')
  }
  return ctx // { status, setStatus }
}
