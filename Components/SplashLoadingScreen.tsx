import { Pressable, Text } from 'react-native'

import { Image } from 'expo-image'
import Animated, { SlideOutLeft } from 'react-native-reanimated'
import { getRandomizedLightColors } from '../colors'

const SplashLoadingScreen = ({ connect, authBooting, authError }) => {
  return (
    <Animated.View
      exiting={SlideOutLeft.duration(800).delay(2000)}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 999,
        display: 'flex',
        gap: 30,
      }}
    >
      <Image
        source={require('../assets/gifs/walkingShrooms.gif')}
        style={{ width: 200, height: 200 }}
        contentFit='contain'
      />
      <Pressable
        onPress={connect}
        disabled={false}
        style={{
          opacity: authBooting ? 0.5 : 1,
          // backgroundColor: authError ? getRandomizedLightColors()[0] : '#bbb',
          backgroundColor: getRandomizedLightColors()[0],
          paddingHorizontal: 35,
          paddingVertical: 20,

          shadowOffset: {
            width: 12,
            height: 12,
          },
          shadowOpacity: 0.9,
          shadowRadius: 0,
          elevation: 1,
        }}
      >
        <Text>{authBooting ? 'CONNECTING…' : 'AUTH'}</Text>
      </Pressable>

      {authError ? (
        <Text style={{ paddingHorizontal: 24, textAlign: 'center' }}>
          {authError}
        </Text>
      ) : null}
    </Animated.View>
  )
}

export default SplashLoadingScreen
