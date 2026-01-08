import {
  QueryClient,
  QueryClientProvider,
  useQueries,
  useQuery,
} from '@tanstack/react-query'
import { StatusBar } from 'expo-status-bar'
import { useMemo } from 'react'
import { View } from 'react-native'

import Accomplishment from './Components/Accomplishment'
import Lists from './Components/Lists'
import SplashLoadingScreen from './Components/SplashLoadingScreen'
import StartButton from './Components/StartButton'
import { GTask, GTaskList, listTaskLists, listTasks } from './googleTasksApi'
import { getAccessTokenOrThrow } from './googleToken'
import { useForceOtaOnLaunch } from './hooks/useForceOtaOnLaunch'
import { useGoogleAuthGate } from './hooks/useGoogleAuthGate'
import { RUNNING, StatusProvider, useStatus } from './hooks/useStatus'

function AppView() {
  const otaReady = useForceOtaOnLaunch()

  const { connected, authBooting, authError, connect } = useGoogleAuthGate({
    silentOnMount: true,
  })

  const { status } = useStatus()
  const started = status.status === RUNNING

  // React Query hooks...
  const taskListsQuery = useQuery({
    queryKey: ['tasklists'],
    enabled: otaReady && connected,
    queryFn: async (): Promise<GTaskList[]> => {
      const token = await getAccessTokenOrThrow()
      const listsRes = await listTaskLists(token)
      return listsRes.items ?? []
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  })

  const taskLists: GTaskList[] = taskListsQuery.data ?? []

  const tasksQueries = useQueries({
    queries: taskLists.map((l) => ({
      queryKey: ['tasks', l.id],
      enabled: otaReady && connected && taskListsQuery.isSuccess,
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

  const dataBooting =
    connected && (taskListsQuery.status !== 'success' || anyTasksLoading)

  const dataError =
    (taskListsQuery.isError ? taskListsQuery.error : null) ?? anyTasksError

  const showSplash = !otaReady || authBooting || !connected || dataBooting
  const splashBusy = !otaReady || authBooting || dataBooting

  const listsForUI = useMemo(() => {
    const out: Record<string, { id: string; tasks: GTask[] }> = {}
    taskLists.forEach((l, idx) => {
      const tasks = tasksQueries[idx]?.data ?? []
      const key = out[l.title] ? `${l.title} (${l.id.slice(0, 4)})` : l.title
      out[key] = { id: l.id, tasks }
    })
    return out
  }, [taskLists, tasksQueries])

  if (showSplash) {
    return (
      <SplashLoadingScreen
        authError={dataError ? String(dataError) : authError}
        authBooting={splashBusy}
        connect={connect}
      />
    )
  }

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
          <StartButton />
        </View>

        <Lists lists={listsForUI} />
        <StatusBar style='auto' />
      </View>

      <Accomplishment />
    </>
  )
}

const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <StatusProvider>
        <AppView />
      </StatusProvider>
    </QueryClientProvider>
  )
}
