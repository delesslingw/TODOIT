import { StatusBar } from 'expo-status-bar'
import { useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
// import { Feather } from "@react-native-vector-icons/feather";
import StartButton from './Components/StartButton'
import TaskView from './Components/TaskView'
export type SessionPhase =
  | { status: 'IDLE' }
  | { status: 'RUNNING'; highlightedTaskId: string | null }
  | { status: 'ACCOMPLISHMENT' }
export default function App() {
  // const [started, setStarted] = useState(false)
  const [status, setStatus] = useState<SessionPhase>({ status: 'IDLE' })
  const started = status.status === 'RUNNING'
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: !started ? '#fff' : '#111' },
      ]}
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
          onPress={(st: SessionPhase) => setStatus(st)}
        />
      </View>
      <TaskView status={status} setStatus={setStatus} />
      <StatusBar style='auto' />
    </View>
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
