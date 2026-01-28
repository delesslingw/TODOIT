import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StatusBar } from 'expo-status-bar'
import { useEffect, useState } from 'react'
import { View } from 'react-native'
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'
import Accomplishment from './Components/Accomplishment'
import Lists from './Components/Lists'
import Menu, { MenuButton } from './Components/Menu'
import SplashLoadingScreen from './Components/SplashLoadingScreen'
import StartButton from './Components/StartButton'
import { TODOIT_CHANNELS } from './helpers/consts'
import { ActiveListProvider } from './hooks/useActiveList'
import { useForceOtaOnLaunch } from './hooks/useForceOtaOnLaunch'
import { useGoogleAuthGate } from './hooks/useGoogleAuthGate'
import { NotificationProvider } from './hooks/useNotification'
import { SessionStateProvider } from './hooks/useSessionState'
import { RUNNING, StatusProvider, useStatus } from './hooks/useStatus'
import { useTasks } from './hooks/useTasks'
import { TimerProvider } from './hooks/useTimer'
// ...

function AppView() {
  const otaReady = useForceOtaOnLaunch()
  const { connected, authBooting, authError, connect } = useGoogleAuthGate({
    silentOnMount: true,
  })
  // const [duration, setDuration] = useState(25)
  const [showMenu, setShowMenu] = useState(false)
  const { status } = useStatus()
  const started = status.status === RUNNING
  const enabled = otaReady && connected
  const backgroundColorProgress = useSharedValue(0)
  const { listsForUI, dataBooting, dataError, addTaskMutation } = useTasks({
    enabled,
    showCompleted: false,
  })

  const showSplash = !otaReady || authBooting || !connected || dataBooting
  const splashBusy = !otaReady || authBooting || dataBooting
  useEffect(() => {
    backgroundColorProgress.value = withSpring(started ? 1 : 0)
  }, [started])

  const animatedBgStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: interpolateColor(
        backgroundColorProgress.value,
        [0, 1],
        ['#fff', '#333']
      ),
    }
  })

  return showSplash ? (
    <SplashLoadingScreen
      authError={dataError ? String(dataError) : authError}
      authBooting={splashBusy}
      connect={connect}
    />
  ) : (
    <>
      <Animated.View
        style={[
          {
            paddingTop: 20,
            flex: 1,
          },
          animatedBgStyle,
        ]}
      >
        <View style={{ alignSelf: 'flex-end', padding: 12 }}>
          <MenuButton open={() => setShowMenu(true)} />
        </View>
        <View style={{ alignItems: 'center', marginVertical: 35 }}>
          <StartButton />
        </View>

        <Lists
          lists={listsForUI}
          onAddTask={async (listId, title) => {
            await addTaskMutation.mutateAsync({ listId, title })
          }}
        />
        <StatusBar style='auto' />
      </Animated.View>
      {showMenu ? (
        <Menu
          // duration={duration}
          // updateDuration={setDuration}
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
    <NotificationProvider channels={TODOIT_CHANNELS}>
      <TimerProvider>
        <QueryClientProvider client={queryClient}>
          <StatusProvider>
            <SessionStateProvider>
              <ActiveListProvider>
                <AppView />
              </ActiveListProvider>
            </SessionStateProvider>
          </StatusProvider>
        </QueryClientProvider>
      </TimerProvider>
    </NotificationProvider>
  )
}
