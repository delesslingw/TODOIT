import {
  QueryClient,
  QueryClientProvider,
  useQueries,
  useQuery,
} from '@tanstack/react-query'
import { StatusBar } from 'expo-status-bar'
import { useEffect, useState } from 'react'
import { Text, View } from 'react-native'

import Accomplishment from './Components/Accomplishment'
import Lists from './Components/Lists'
import StartButton from './Components/StartButton'
import {
  connectGoogle,
  initGoogleAuth,
  trySilentGoogleConnect,
} from './googleAuth'
import { GTask, GTaskList, listTaskLists, listTasks } from './googleTasksApi'
import { getAccessTokenOrThrow } from './googleToken'
import SplashLoadingScreen from './Screens/SplashLoadingScreen'
import { RUNNING, SessionPhase } from './state/session'

function AppView() {
  const [status, setStatus] = useState<SessionPhase>({ status: 'IDLE' })
  const [connected, setConnected] = useState(false)
  const [authBooting, setAuthBooting] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)
  const started = status.status === RUNNING

  useEffect(() => {
    let alive = true

    ;(async () => {
      try {
        initGoogleAuth()

        const token = await trySilentGoogleConnect()
        if (!alive) return

        if (token) {
          setTimeout(() => {
            setConnected(true)
          }, 2000)
        }
      } catch (err) {
        if (!alive) return
        setAuthError(String(err))
      } finally {
        if (!alive) return
        setAuthBooting(false)
      }
    })()

    return () => {
      alive = false
    }
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
    refetchInterval: 60_000,
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
    try {
      setAuthError(null)
      setAuthBooting(true)
      const token = await connectGoogle()
      console.log('token ok:', token.slice(0, 10))
      setTimeout(() => {
        setConnected(true)
      }, 2000)
    } catch (err) {
      setAuthError(String(err))
    } finally {
      setAuthBooting(false)
    }
  }

  if (!connected) {
    return (
      <SplashLoadingScreen
        authError={authError}
        authBooting={authBooting}
        connect={connect}
      />
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
        <Text>HELLO DOLLY</Text>
        <View style={{ alignItems: 'center', marginVertical: 35 }}>
          <StartButton
            status={status}
            setStatus={(st: SessionPhase) => setStatus(st)}
          />
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
