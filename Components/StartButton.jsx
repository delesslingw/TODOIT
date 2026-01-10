import FontAwesome from '@react-native-vector-icons/fontawesome'
import { useEffect, useState } from 'react'
import { Alert, Text, TouchableOpacity } from 'react-native'
import { ACCOMPLISHMENT, RUNNING } from '../hooks/useStatus'
import { useStatus } from '../hooks/useStatus'
import { useSessionState } from '../hooks/useSessionState'

const StartButton = ({duration}) => {
  const {status, setStatus} = useStatus()
  const [startTime, setStartTime] = useState(null)
  const [elapsedMs, setElapsedMs] = useState(0)
  const {setCompletedTimeString} = useSessionState()
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
          // TODO: Change to sane amount
          if(elapsedMs > 1000){
            setCompletedTimeString(minutesAndSecondsFromMs(elapsedMs).timeString)
          }
          setStartTime(null)
      setElapsedMs(0)
      setStatus({status: ACCOMPLISHMENT})
        },

      },
    ]);
  const totalMs = 60 * 1000 * duration
  useEffect(() => {
    if (!started) return

    const interval = setInterval(() => {

      setElapsedMs(Date.now() - startTime.getTime())
    }, 1000)

    return () => clearInterval(interval)
  }, [startTime])

  const {minutes, seconds} = minutesAndSecondsFromMs(totalMs - elapsedMs)

  useEffect(() => {
    if(minutes <= 0 & seconds < 0){
        setCompletedTimeString(minutesAndSecondsFromMs(elapsedMs).timeString)
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
        >{minutesAndSecondsFromMs(totalMs - elapsedMs).timeString}</Text>
      )}
    </TouchableOpacity>
  )
}
  function minutesAndSecondsFromMs(ms) {
    const minutes = Math.floor((ms) / 60000)
    const seconds = Math.floor(((ms) % 60000) / 1000)
    return {
      minutes,
      seconds,
      timeString: formatTime(minutes, seconds)
    }
  }
function formatTime(minutes, seconds) {
  return `${minutes < 10 ? `0${minutes}` : minutes}:${seconds < 10 ? `0${seconds}`: seconds}`
}
export default StartButton
