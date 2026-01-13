import FontAwesome from '@react-native-vector-icons/fontawesome'
import { useEffect, useRef } from 'react'
import { Alert, Text, TouchableOpacity } from 'react-native'
import { useSessionState } from '../hooks/useSessionState'
import { ACCOMPLISHMENT, RUNNING, useStatus } from '../hooks/useStatus'
import useTimer from '../hooks/useTimer'

const StartButton = () => {
  const { status, setStatus } = useStatus()
  const { setTimer, timerActive, timer, clearTimer } = useTimer()
  const { setCompletedTimeString } = useSessionState()

  const didCompleteRef = useRef(false)

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
          const { timeString, ms } = timer.elapsed
          setCompletedTimeString(timeString)
          clearTimer()
          if (ms < 1000) {
            setStatus({ status: IDLE })
          }else{
            setStatus({status: ACCOMPLISHMENT})
          }
        },
      },
    ])

  useEffect(() => {
    if (!timerActive) {
      didCompleteRef.current = false
      return
    }
    if (timer.remaining.ms > 0) return
    if (didCompleteRef.current) return

    didCompleteRef.current = true

    setCompletedTimeString(timer.elapsed.timeString)
    clearTimer()
    setStatus({ status: ACCOMPLISHMENT })
  }, [
    timerActive,
    timer.remaining.ms,
    timer.elapsed.timeString,
    clearTimer,
    setStatus,
    setCompletedTimeString,
  ])

  return (
    <TouchableOpacity
      style={[
        !timerActive ? { backgroundColor: '#333' } : { backgroundColor: '#fff' },
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
      {!timerActive ? (
        <FontAwesome name="play" size={50} color="#fff" />
      ) : (
        <Text style={{ color: '#111', fontSize: 30, textAlignVertical: 'center' }}>
          {timer.remaining.timeString}
        </Text>
      )}
    </TouchableOpacity>
  )
}

export default StartButton
