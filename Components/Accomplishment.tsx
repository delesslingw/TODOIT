import { Image } from 'expo-image'
import { useEffect, useState } from 'react'
import { Modal, Pressable, Text, View } from 'react-native'
import { getRandomizedColors } from '../colors'
import useNotification from '../hooks/useNotification'
import { useSessionState } from '../hooks/useSessionState'
import { ACCOMPLISHMENT, IDLE, useStatus } from '../hooks/useStatus'

const Accomplishment = () => {
  const { status, setStatus } = useStatus()
  const { tasksCompleted, resetTasksCompleted, completedTimeString } =
    useSessionState()
  const { notify } = useNotification()
  const visible = status.status === ACCOMPLISHMENT
  const handleClose = () => {
    resetTasksCompleted()
    setStatus({ status: IDLE })
  }
  useEffect(() => {
    notify({
      title: 'Pomodoro complete',
      body: 'Time’s up.',
      channelId: 'pomodoro',
    })
  }, [])
  return (
    <Modal
      animationType='slide'
      transparent={true}
      visible={visible}
      onRequestClose={() => {
        setStatus({ status: IDLE })
      }}
    >
      <View
        style={{
          backgroundColor: 'white',
          flex: 1,
          justifyContent: 'space-around',
          alignItems: 'center',
        }}
      >
        <Text
          style={{
            fontFamily: 'monospace',
            fontWeight: 'bold',
            fontSize: 24,
          }}
        >
          YOU DID IT!!!!1
        </Text>
        <Text>
          You completed {tasksCompleted} tasks in {completedTimeString}!!
        </Text>

        <ShroomGif />
        <Pressable
          style={{
            backgroundColor: getRandomizedColors()[0],
            paddingHorizontal: 35,
            paddingVertical: 20,
          }}
          onPress={handleClose}
        >
          <Text style={{ fontSize: 18, fontWeight: 'bold' }}>LET'S GO!!</Text>
        </Pressable>
      </View>
    </Modal>
  )
}
const ShroomGif = () => {
  const sources = [
    require('../assets/gifs/shroomDance.gif'),
    require('../assets/gifs/shroomDance2.gif'),
    require('../assets/gifs/shroomDance3.gif'),
  ]
  const [index, setIndex] = useState(0)
  const handlePress = () => {
    setIndex((i) => (i + 1) % sources.length)
  }
  return (
    <Pressable onPress={handlePress}>
      <Image
        source={sources[index]}
        style={{ width: 200, height: 200 }}
        contentFit='contain'
      />
    </Pressable>
  )
}
export default Accomplishment
