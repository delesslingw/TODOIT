import { StatusBar } from 'expo-status-bar'
import { useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Accomplishment from './Components/Accomplishment'
import StartButton from './Components/StartButton'
import TaskView from './Components/TaskView'
export const IDLE = 'IDLE' as const,
  RUNNING = 'RUNNING' as const,
  ACCOMPLISHMENT = 'ACCOMPLISHMENT' as const
export type SessionPhase =
  | { status: typeof IDLE }
  | { status: typeof RUNNING; highlightedTaskId: string | null }
  | { status: typeof ACCOMPLISHMENT }
export default function App() {
  const [status, setStatus] = useState<SessionPhase>({ status: 'IDLE' })
  const started = status.status === RUNNING
  return (
    <>
      <View
        style={{
          backgroundColor: !started ? '#fff' : '#111',
          paddingTop: 30,
          paddingBottom: 10,
          paddingHorizontal: 10,
          flex: 1,
        }}
      >
        <Text
          style={[
            styles.header,
            { color: !started ? '#111' : '#fff' },
            { fontSize: 30 },
          ]}
        >
          TODO.IT
        </Text>
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
          <StartButton
            status={status}
            setStatus={(st: SessionPhase) => setStatus(st)}
          />
        </View>
        <TaskView status={status} setStatus={setStatus} />
        <StatusBar style='auto' />
      </View>
      <Accomplishment status={status} setStatus={setStatus} />
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#111',
    paddingTop: 30,
    paddingBottom: 10,
    paddingHorizontal: 10,
    flex: 1,
  },
  header: {
    color: '#fff',
  },
})
