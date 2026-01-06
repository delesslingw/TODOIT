import {
  QueryClient,
  QueryClientProvider,
  useQueries,
  useQuery,
} from '@tanstack/react-query'
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
import { getAccessTokenOrThrow } from './googleToken'
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

function AppView() {
  const [status, setStatus] = useState<SessionPhase>({ status: 'IDLE' })
  const [connected, setConnected] = useState(false)
  const started = status.status === RUNNING

  useEffect(() => {
    initGoogleAuth()
  }, [])

  // ✅ Iteration 1: Fetch tasklists via React Query
  const taskListsQuery = useQuery({
    queryKey: ['tasklists'],
    enabled: connected, // don’t run until user has authenticated
    queryFn: async (): Promise<GTaskList[]> => {
      const token = await getAccessTokenOrThrow()
      const listsRes = await listTaskLists(token)
      return listsRes.items ?? []
    },
    staleTime: 30_000,
  })
  const taskLists: GTaskList[] = taskListsQuery.data ?? []

  // Fetch tasks for each list (in parallel)
  const tasksQueries = useQueries({
    queries: taskLists.map((l) => ({
      queryKey: ['tasks', l.id],
      enabled: connected && taskListsQuery.isSuccess,
      queryFn: async (): Promise<GTask[]> => {
        const token = await getAccessTokenOrThrow()
        const res = await listTasks(token, l.id, { showCompleted: false })
        return res.items ?? []
      },
      staleTime: 15_000,
    })),
  })

  const anyTasksLoading = tasksQueries.some((q) => q.isLoading)
  const anyTasksError = tasksQueries.find((q) => q.isError)?.error

  // Shape data into what <Lists /> already expects: { [title]: { id, tasks } }
  const listsForUI: Record<string, { id: string; tasks: GTask[] }> = {}
  taskLists.forEach((l, idx) => {
    const tasks = tasksQueries[idx]?.data ?? []
    // If titles ever collide, this still stays stable-ish by including a short id suffix
    const key = listsForUI[l.title]
      ? `${l.title} (${l.id.slice(0, 4)})`
      : l.title
    listsForUI[key] = { id: l.id, tasks }
  })

  async function connect() {
    // This prompts the Google auth UI (user gesture) and establishes sign-in.
    const token = await connectGoogle()
    console.log('token ok:', token.slice(0, 10))
    setConnected(true)
    // No manual fetching here anymore — React Query will fetch automatically.
  }

  if (!connected) {
    return (
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
    )
  }

  // Connected view
  return (
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

        {/* TEMP: show query state so we can confirm it’s working */}
        <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
          {taskListsQuery.isLoading ? (
            <Text style={{ color: started ? '#fff' : '#111' }}>
              Loading tasklists…
            </Text>
          ) : taskListsQuery.isError ? (
            <Text style={{ color: started ? '#fff' : '#111' }}>
              Error loading tasklists: {String(taskListsQuery.error)}
            </Text>
          ) : anyTasksLoading ? (
            <Text style={{ color: started ? '#fff' : '#111' }}>
              Loading tasks…
            </Text>
          ) : anyTasksError ? (
            <Text style={{ color: started ? '#fff' : '#111' }}>
              Error loading tasks: {String(anyTasksError)}
            </Text>
          ) : (
            <Text style={{ color: started ? '#fff' : '#111' }}>
              Loaded {taskLists.length} lists
            </Text>
          )}
        </View>

        <Lists status={status} setStatus={setStatus} lists={listsForUI} />

        <StatusBar style='auto' />
      </View>

      <Accomplishment status={status} setStatus={setStatus} />
    </>
  )
}

const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppView />
    </QueryClientProvider>
  )
}
