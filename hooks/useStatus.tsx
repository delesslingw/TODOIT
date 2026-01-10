import React, {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from 'react'

export const IDLE = 'IDLE' as const
export const RUNNING = 'RUNNING' as const
export const ACCOMPLISHMENT = 'ACCOMPLISHMENT' as const

export type SessionPhase =
  | { status: typeof IDLE }
  | { status: typeof RUNNING; highlightedTaskId: string | null }
  | { status: typeof ACCOMPLISHMENT }

type StatusContextValue = {
  status: SessionPhase
  setStatus: React.Dispatch<React.SetStateAction<SessionPhase>>
}

const StatusContext = createContext<StatusContextValue | undefined>(undefined)

export function StatusProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SessionPhase>({ status: IDLE })

  return (
    <StatusContext.Provider value={{ status, setStatus }}>
      {children}
    </StatusContext.Provider>
  )
}

export function useStatus() {
  const ctx = useContext(StatusContext)
  if (!ctx) {
    throw new Error('useStatus must be used within a StatusProvider')
  }
  return ctx // { status, setStatus }
}
