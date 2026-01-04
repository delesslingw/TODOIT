export const IDLE = 'IDLE' as const,
  RUNNING = 'RUNNING' as const,
  ACCOMPLISHMENT = 'ACCOMPLISHMENT' as const
export type SessionPhase =
  | { status: typeof IDLE }
  | { status: typeof RUNNING; highlightedTaskId: string | null }
  | { status: typeof ACCOMPLISHMENT }
