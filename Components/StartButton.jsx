import FontAwesome from '@react-native-vector-icons/fontawesome'
import { useEffect, useState } from 'react'
import { Alert, Text, TouchableOpacity } from 'react-native'
const StartButton = ({ status, onPress }) => {
  const [startTime, setStartTime] = useState(null)
  const [elapsedMs, setElapsedMs] = useState(0)
  useEffect(() => {
    if(status.status === "RUNNING" && startTime === null){
      console.log("STARTING TIMER")
      setStartTime(new Date())
    }
  }, [status])
  const started = status.status === "RUNNING"
  const handleStartPress = () => {
    if (!started) {
      setStartTime(new Date())
      onPress({status: "RUNNING", highlightedTaskId: null})
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
      onPress({status: "IDLE"})
        },

      },
    ]);
  const totalMs = 60 * 1000 * 25
  useEffect(() => {
    if (!started) return

    const interval = setInterval(() => {
      setElapsedMs(Date.now() - startTime.getTime())
    }, 1000)

    return () => clearInterval(interval)
  }, [startTime])

  const minutes = Math.floor((totalMs - elapsedMs) / 60000)
  const seconds = Math.floor(((totalMs - elapsedMs) % 60000) / 1000)
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
          style={{ color: '#111', fontSize: 30 }}
        >{formatTime(minutes, seconds)}</Text>
      )}
    </TouchableOpacity>
  )
}
function formatTime(minutes, seconds) {
  return `${minutes < 10 ? `0${minutes}` : minutes}:${seconds < 10 ? `0${seconds}`: seconds}`
}
export default StartButton
