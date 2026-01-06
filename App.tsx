import { StatusBar } from 'expo-status-bar'
import { useEffect, useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { getRandomizedLightColors } from './colors'
import Accomplishment from './Components/Accomplishment'
import Lists from './Components/Lists'
import StartButton from './Components/StartButton'
import dummyTasks, { dummyTasks2 } from './dummyTasks'
import { connectGoogle, initGoogleAuth } from './googleAuth'
import { GTask, GTaskList, listTaskLists, listTasks } from './googleTasksApi'
import { RUNNING, SessionPhase } from './state/session'
const dummyLists = {
  General: {
    id: '12345',
    tasks: dummyTasks,
  },
  Finances: {
    id: 'abcde',
    tasks: dummyTasks2,
  },
}
export default function App() {
  const [status, setStatus] = useState<SessionPhase>({ status: 'IDLE' })
  const [connected, setConnected] = useState(false)
  const [taskLists, setTaskLists] = useState<GTaskList[]>([])
  const [tasksByList, setTasksByList] = useState<Record<string, GTask[]>>({})
  const started = status.status === RUNNING
  useEffect(() => {
    initGoogleAuth()
  }, [])
  async function connect() {
    const token = await connectGoogle()
    console.log(token.slice(0, 10))

    const listsRes = await listTaskLists(token)
    const lists = listsRes.items ?? []
    setTaskLists(lists)

    const byList: Record<string, GTask[]> = {}
    for (const l of lists) {
      const tRes = await listTasks(token, l.id)
      byList[l.id] = tRes.items ?? []
    }
    setTasksByList(byList)
    setConnected(true)
  }

  return !connected ? (
    <View
      style={{
        flex: 1,
        backgroundColor: 'white',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Pressable
        onPress={connect}
        style={{
          backgroundColor: getRandomizedLightColors()[0],
          paddingHorizontal: 35,
          paddingVertical: 20,
        }}
      >
        <Text>AUTH</Text>
      </Pressable>
    </View>
  ) : (
    <>
      <View
        style={{
          backgroundColor: !started ? '#fff' : '#111',
          paddingTop: 20,
          flex: 1,
        }}
      >
        <View style={{ alignItems: 'center', marginVertical: 35 }}>
          <StartButton
            status={status}
            setStatus={(st: SessionPhase) => setStatus(st)}
          />
        </View>
        <Lists status={status} setStatus={setStatus} lists={dummyLists} />

        {/* <TaskView status={status} setStatus={setStatus} /> */}
        <StatusBar style='auto' />
      </View>
      <Accomplishment status={status} setStatus={setStatus} />
    </>
  )
}
