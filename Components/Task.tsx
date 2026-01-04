import { FontAwesome } from '@react-native-vector-icons/fontawesome'
import Checkbox from 'expo-checkbox'
import hexAlpha from 'hex-alpha'
import { useState } from 'react'
import { Alert, Text, TouchableOpacity, View } from 'react-native'
import { SessionPhase } from '../App'
const Task = ({
  title,
  id,
  color,
  showCheckbox = false,
  status,
  setStatus,
}: {
  title: string
  id: string
  color: string
  showCheckbox?: boolean
  status: SessionPhase
  setStatus: (status: SessionPhase) => void
}) => {
  const [isChecked, setIsChecked] = useState(false)

  const disabled =
    status.status === 'RUNNING' &&
    status.highlightedTaskId !== null &&
    status.highlightedTaskId !== id
  const highlighted =
    status.status === 'RUNNING' &&
    status.highlightedTaskId !== null &&
    status.highlightedTaskId === id

  const handleCheckToggle = (bool: boolean) => {
    setIsChecked(bool)
    if (highlighted) {
      createCancelAlert()
    }
  }
  const createCancelAlert = () =>
    Alert.alert(
      'End Session?',
      'Do you want to end your session or continue it with other tasks?',
      [
        {
          text: 'Continue With Other Tasks',
          onPress: () => {
            setStatus({ status: 'RUNNING', highlightedTaskId: null })
          },
        },
        {
          text: 'End Session',
          onPress: () => {
            setStatus({ status: 'IDLE' })
          },
        },
      ]
    )

  return (
    <View
      style={{
        backgroundColor: hexAlpha(color, disabled || isChecked ? 0.4 : 1),
        minHeight: highlighted ? 90 : 50,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <View
        style={{
          width: 50,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {status.status === 'RUNNING' &&
        (status.highlightedTaskId === null ||
          status.highlightedTaskId === id) ? (
          <Checkbox
            value={isChecked}
            onValueChange={handleCheckToggle}
            color={isChecked ? '#aaa' : '#333'}
          />
        ) : (
          <TouchableOpacity
            disabled={disabled}
            onPress={() =>
              setStatus({ status: 'RUNNING', highlightedTaskId: id })
            }
          >
            <FontAwesome name='play' size={20} color='#333' />
          </TouchableOpacity>
        )}
      </View>
      <Text
        key={id}
        style={{
          color: '#333',
          fontSize: 18,
          fontWeight: 'bold',
        }}
      >
        {title}
      </Text>
    </View>
  )
}

export default Task
