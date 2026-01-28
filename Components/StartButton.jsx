// StartButton.tsx
import FontAwesome from '@react-native-vector-icons/fontawesome'
import { useCallback, useEffect, useRef } from 'react'
import { Alert, Text, TouchableOpacity } from 'react-native'
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'

import { useSessionState } from '../hooks/useSessionState'
import { ACCOMPLISHMENT, IDLE, RUNNING, useStatus } from '../hooks/useStatus'
import useTimer from '../hooks/useTimer'
import { KeepAwakeWhileRunning } from './KeepAwakeWhileRunning'
import useActiveList from '../hooks/useActiveList'
import { useToggleComplete } from '../hooks/useToggleComplete'

const AnimatedTouchableOpacity =
  Animated.createAnimatedComponent(TouchableOpacity)

const StartButton = () => {
  const { status, setStatus } = useStatus()
  const { setTimer, timerActive, timer, clearTimer } = useTimer()
  const { setCompletedTimeString, tasksCompleted, incrementTasksCompleted } =
    useSessionState()

  const {activeList} = useActiveList()
  const toggleComplete = useToggleComplete()

  /**
   * Re-entrancy guard: when remaining.ms hits 0, React can re-render/effect-run
   * multiple times while values keep updating. This ensures we handle "timer ended"
   * exactly once per session.
   */
  const handledTimerEndRef = useRef(false)

  // --- Button background animation (dark when idle, light when active) ---
  const colorProgress = useSharedValue(0)

  useEffect(() => {
    colorProgress.value = withSpring(timerActive ? 1 : 0)
  }, [timerActive, colorProgress])

  const colorChangeStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: interpolateColor(
        colorProgress.value,
        [0, 1],
        ['#333', '#fff']
      ),
    }
  })

  // --- Core: end session in exactly one place ---
  const finishSession = useCallback(() => {
    const { timeString } = timer.elapsed

    clearTimer()

    // Current rule: only show accomplishment if any tasks were completed
    if (tasksCompleted > 0) {
      setCompletedTimeString(timeString)
      setStatus({ status: ACCOMPLISHMENT })
    } else {
      setStatus({ status: IDLE })
    }
  }, [
    timer.elapsed,
    clearTimer,
    tasksCompleted,
    setCompletedTimeString,
    setStatus,
  ])

  const promptEndSession = useCallback(() => {
    Alert.alert('End Session?', 'Would you like to end your session?', [
      { text: 'Continue Session', style: 'cancel' },
      { text: 'End Session', style: 'destructive', onPress: () => {
        if(status.highlightedTaskId){
          promptDidYouComplete()
        }else{
          finishSession()
        }
      } },
    ])
  }, [finishSession])

  const promptDidYouComplete = useCallback(() => {
    Alert.alert('Did you finish your task?', undefined, [
      {
        text: 'Yes!',
        onPress: () => {
          // TODO: when task completion is wired up, mutate here
          console.log(activeList)
          toggleComplete.mutate({
            taskId: status.highlightedTaskId,
            listId: activeList,
            completed: true
          })
          incrementTasksCompleted()
          finishSession()
        },
      },
      {
        text: 'No',
        style: 'cancel',
        onPress: finishSession, // same behavior for now
      },
    ])
  }, [finishSession])

  const handleStartPress = useCallback(() => {
    if (!timerActive) {
      handledTimerEndRef.current = false
      setTimer()
      setStatus({ status: RUNNING, highlightedTaskId: null })
      return
    }
    promptEndSession()
  }, [timerActive, setTimer, setStatus, promptEndSession])

  // Reset guard whenever timer is not active (manual cancel or session end)
  useEffect(() => {
    if (!timerActive) {
      handledTimerEndRef.current = false
    }
  }, [timerActive])

  // Timer completion: run exactly once when remaining.ms reaches 0
  useEffect(() => {
    if (!timerActive) return
    if (timer.remaining.ms > 0) return
    if (handledTimerEndRef.current) return

    handledTimerEndRef.current = true

    // Current behavior:
    // - No highlighted task: ask the user
    // - Highlighted task: auto-finish (you can swap for "end/continue" prompt later)

    if (status.highlightedTaskId) {
      promptDidYouComplete()
    } else {
      finishSession()
    }
  }, [
    timerActive,
    timer.remaining.ms,
    status.highlightedTaskId,
    promptDidYouComplete,
    finishSession,
  ])

  return (
    <AnimatedTouchableOpacity
      style={[
        colorChangeStyle,
        {
          justifyContent: 'center',
          alignItems: 'center',
          width: 200,
          height: 200,
          borderRadius: 200,
        },
      ]}
      onPress={handleStartPress}
    >
      {status.status === RUNNING && <KeepAwakeWhileRunning />}

      {!timerActive ? (
        <FontAwesome name="play" size={50} color="#fff" />
      ) : (
        <Text
          style={{
            color: '#111',
            fontSize: 30,
            textAlignVertical: 'center',
          }}
        >
          {timer.remaining.timeString}
        </Text>
      )}
    </AnimatedTouchableOpacity>
  )
}

export default StartButton
