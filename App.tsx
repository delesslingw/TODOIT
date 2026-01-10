import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StatusBar } from 'expo-status-bar'
import { useState } from 'react'
import { View } from 'react-native'
import Accomplishment from './Components/Accomplishment'
import Lists from './Components/Lists'
import Menu, { MenuButton } from './Components/Menu'
import SplashLoadingScreen from './Components/SplashLoadingScreen'
import StartButton from './Components/StartButton'
import { useForceOtaOnLaunch } from './hooks/useForceOtaOnLaunch'
import { useGoogleAuthGate } from './hooks/useGoogleAuthGate'
import { SessionStateProvider } from './hooks/useSessionState'
import { RUNNING, StatusProvider, useStatus } from './hooks/useStatus'
import { useTasks } from './hooks/useTasks'
// ...

function AppView() {
  const otaReady = useForceOtaOnLaunch()
  const { connected, authBooting, authError, connect } = useGoogleAuthGate({
    silentOnMount: true,
  })
  const [duration, setDuration] = useState(25)
  const [showMenu, setShowMenu] = useState(false)
  const { status } = useStatus()
  const started = status.status === RUNNING
  const enabled = otaReady && connected

  const { listsForUI, dataBooting, dataError, addTaskMutation } = useTasks({
    enabled,
    showCompleted: false,
  })

  const showSplash = !otaReady || authBooting || !connected || dataBooting
  const splashBusy = !otaReady || authBooting || dataBooting

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
        <View style={{ alignSelf: 'flex-end', padding: 12 }}>
          <MenuButton open={() => setShowMenu(true)} />
        </View>
        <View style={{ alignItems: 'center', marginVertical: 35 }}>
          <StartButton duration={duration} />
        </View>

        <Lists
          lists={listsForUI}
          onAddTask={async (listId, title) => {
            await addTaskMutation.mutateAsync({ listId, title })
          }}
        />
        <StatusBar style='auto' />
      </View>
      {showMenu ? (
        <Menu
          duration={duration}
          updateDuration={setDuration}
          close={() => setShowMenu(false)}
        />
      ) : null}
      <Accomplishment />
    </>
  )
}

const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <StatusProvider>
        <SessionStateProvider>
          <AppView />
        </SessionStateProvider>
      </StatusProvider>
    </QueryClientProvider>
  )
}
