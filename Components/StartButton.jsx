import FontAwesome from '@react-native-vector-icons/fontawesome'
import { useEffect, useRef, useState } from 'react'
import { Alert, Text, TouchableOpacity } from 'react-native'
import { useSessionState } from '../hooks/useSessionState'
import { ACCOMPLISHMENT, IDLE, RUNNING, useStatus } from '../hooks/useStatus'
import useTimer from '../hooks/useTimer'
import { KeepAwakeWhileRunning } from './KeepAwakeWhileRunning'
import { useToggleComplete } from '../hooks/useToggleComplete'
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'
const AnimatedTouchableOpacity =
  Animated.createAnimatedComponent(TouchableOpacity)
const StartButton = () => {
  const { status, setStatus } = useStatus()
  const { setTimer, timerActive, timer, clearTimer } = useTimer()
  const { setCompletedTimeString, highlightedTaskId, tasksCompleted } = useSessionState()
  // const toggleComplete = useToggleComplete(listId)
  const didCompleteRef = useRef(false)
  const colorProgress = useSharedValue(0)
  useEffect(() => {
    colorProgress.value = withSpring(timerActive ? 1 : 0)
  }, [timerActive])

  const colorChangeStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: interpolateColor(colorProgress.value, [0,1], ["#333", "#fff"])
    }
  })
  const handleStartPress = () => {
    if (!timerActive) {
      didCompleteRef.current = false
      setTimer()
      setStatus({ status: RUNNING, highlightedTaskId: null })
    } else {
      createCancelAlert()
    }
  }

  const createCancelAlert = () =>
    Alert.alert('End Session?', 'Would you like to end your session?', [
      { text: 'Continue Session', onPress: () => null },
      {
        text: 'End Session',
        onPress: () => {
          const {timeString} = timer.elapsed
    clearTimer()
    if(tasksCompleted > 0){
      setCompletedTimeString(timeString)

      setStatus({ status: ACCOMPLISHMENT })
    }else{
      setStatus({status: IDLE})
    }
        },
      },
    ])
    function showDidYouComplete() {
      // TODO: add highlighted task test
      Alert.alert('Did you finish your task?', [
        {
          text: "Yes!",
          onPress: () => {
            // TODO: Mark task as complete
              didCompleteRef.current = true
              setCompletedTimeString(timer.elapsed.timeString)
              clearTimer()
              setStatus({ status: ACCOMPLISHMENT })
          }
        },
        {
          text: "No",
          onPress: () => {
              didCompleteRef.current = true
              setCompletedTimeString(timer.elapsed.timeString)
              clearTimer()
              setStatus({ status: ACCOMPLISHMENT })
          }
        },

      ])
    //   Alert.alert('Did you finish your task?', [
    //   { text: 'Yes!',
    //     onPress: () => {
    //       didCompleteRef.current = true

    //       setCompletedTimeString(timer.elapsed.timeString)
    //       clearTimer()
    //       setStatus({ status: ACCOMPLISHMENT })
    //   },
    // },
    //   {
    //     text: 'End Session',
    //     onPress: () => {
    //       const { timeString, ms } = timer.elapsed
    //       setCompletedTimeString(timeString)
    //       clearTimer()
    //       if (ms < 1000) {
    //         setStatus({ status: IDLE })
    //       }else{
    //         setStatus({status: ACCOMPLISHMENT})
    //       }
    //     },
    //   },
    }
  useEffect(() => {
    if (!timerActive) {
      didCompleteRef.current = false
      return
    }
    if (timer.remaining.ms > 0) return
    if (didCompleteRef.current) return
    if (!highlightedTaskId) {
      showDidYouComplete()
      return
    }
    didCompleteRef.current = true
    const {timeString} = timer.elapsed
    clearTimer()
    if(tasksCompleted > 0){
      setCompletedTimeString(timeString)

      setStatus({ status: ACCOMPLISHMENT })
    }else{
      setStatus({status: IDLE})
    }
  }, [
    timerActive,
    timer.remaining.ms,
    timer.elapsed.timeString,
    clearTimer,
    setStatus,
    setCompletedTimeString,
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
        <Text style={{ color: '#111', fontSize: 30, textAlignVertical: 'center' }}>
          {timer.remaining.timeString}
        </Text>
      )}
    </AnimatedTouchableOpacity>
  )
}

export default StartButton
