// components/KeepAwakeWhileRunning.tsx
import { useKeepAwake } from 'expo-keep-awake'

export function KeepAwakeWhileRunning() {
  useKeepAwake()
  return null
}
