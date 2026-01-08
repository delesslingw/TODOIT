import Ionicons from '@expo/vector-icons/Ionicons'
import FontAwesome from '@react-native-vector-icons/fontawesome'
import { Pressable, Text, View } from 'react-native'
import Animated from 'react-native-reanimated'
type MenuProps = {
  updateDuration: (arg0: number) => void
  duration: number
  close: () => void
}
const Menu: React.FC<MenuProps> = ({ updateDuration, duration, close }) => {
  const options = [1, 5, 10, 15, 20, 25]
  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#EFE3D2',
        zIndex: 999,
        display: 'flex',
        paddingTop: 35,
        paddingHorizontal: 20,
        alignItems: 'stretch',
      }}
    >
      <View
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Text
          style={{
            fontSize: 32,
            marginVertical: 16,
            fontWeight: 'bold',
          }}
        >
          SETTINGS
        </Text>
        <Pressable onPress={close}>
          <FontAwesome name='remove' size={32} color='#222'></FontAwesome>
        </Pressable>
      </View>
      <View>
        <Text
          style={{
            fontFamily: 'monospace',
            fontSize: 16,
            fontWeight: 'semibold',
          }}
        >
          Change the timer duration?
        </Text>
        <View>
          {options.map((opt: number) => {
            const label = opt === 1 ? `1 minute` : `${opt} minutes`
            const isSelected = opt === duration
            return (
              <Pressable
                onPress={() => updateDuration(opt)}
                key={opt}
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  height: 35,
                }}
              >
                <View style={{ width: 20 }}>
                  {isSelected ? (
                    <FontAwesome name='check' size={12} color='#019b01ff' />
                  ) : (
                    <FontAwesome name='angle-right' size={12} color='#555' />
                  )}
                </View>
                <Text style={{ fontFamily: 'monospace' }}>{label}</Text>
              </Pressable>
            )
          })}
        </View>
      </View>
    </Animated.View>
  )
}

type ButtonProps = {
  open: () => void
}
export function MenuButton({ open }: ButtonProps) {
  return (
    <Pressable onPress={open}>
      <Ionicons name='settings-sharp' size={24} color='black' />
    </Pressable>
  )
}

export default Menu
