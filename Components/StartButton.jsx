import FontAwesome from '@react-native-vector-icons/fontawesome'
import { useEffect, useState } from 'react'
import { Alert, Text, TouchableOpacity } from 'react-native'
import { ACCOMPLISHMENT, RUNNING } from '../state/session'
import { useStatus } from '../hooks/useStatus'
const StartButton = () => {
  const {status, setStatus} = useStatus()
  const timerLength = 1
  const [startTime, setStartTime] = useState(null)
  const [elapsedMs, setElapsedMs] = useState(0)
  useEffect(() => {
    if(status.status === RUNNING && startTime === null){
      console.log("STARTING TIMER")
      setStartTime(new Date())
    }
  }, [status])
  const started = status.status === RUNNING
  const handleStartPress = () => {
    if (!started) {
      setStartTime(new Date())
      setStatus({status: RUNNING, highlightedTaskId: null})
    } else {
      createCancelAlert()
    }
  }
  const createCancelAlert = () =>
    Alert.alert('End Session?', 'Would you like to end your session?', [
      {text: 'Continue Session', onPress: () => null,},
      {
        text: 'End Session',
        onPress: () => {
          setStartTime(null)
      setElapsedMs(0)
      setStatus({status: ACCOMPLISHMENT})
        },

      },
    ]);
  const totalMs = 60 * 1000 * timerLength
  useEffect(() => {
    if (!started) return

    const interval = setInterval(() => {

      setElapsedMs(Date.now() - startTime.getTime())
    }, 1000)

    return () => clearInterval(interval)
  }, [startTime])

  const minutes = Math.floor((totalMs - elapsedMs) / 60000)
  const seconds = Math.floor(((totalMs - elapsedMs) % 60000) / 1000)
  useEffect(() => {
    if(minutes <= 0 & seconds < 0){
        setStartTime(null)
        setElapsedMs(0)
        setStatus({status: ACCOMPLISHMENT})

    }
  }, [minutes, seconds])
  return (
    <TouchableOpacity
      style={[
        !started
          ? {
              backgroundColor: '#333',
            }
          : {
              backgroundColor: '#fff',
            },
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
      {startTime == null ? (
        <FontAwesome name='play' size={50} color='#fff'></FontAwesome>
      ) : (
        <Text
          style={{ color: '#111', fontSize: 30, textAlignVertical: "center" }}
        >{formatTime(minutes, seconds)}</Text>
      )}
    </TouchableOpacity>
  )
}
function formatTime(minutes, seconds) {
  return `${minutes < 10 ? `0${minutes}` : minutes}:${seconds < 10 ? `0${seconds}`: seconds}`
}
export default StartButton
