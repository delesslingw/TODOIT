import { Pressable, Text } from 'react-native'

import { Image } from 'expo-image'
import Animated, { RollOutRight } from 'react-native-reanimated'
import { getRandomizedLightColors } from '../colors'

const SplashLoadingScreen = ({ connect, authBooting, authError }) => {
  return (
    <Animated.View
      exiting={RollOutRight.duration(1000)}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#EFE3D2',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 999,
        display: 'flex',
        gap: 30,
      }}
    >
      <Image
        source={require('../assets/gifs/shroomLoading.gif')}
        style={{ width: 200, height: 200 }}
        contentFit='contain'
      />
      <Pressable
        onPress={connect}
        disabled={!authError}
        style={{
          opacity: authBooting ? 0.5 : 1,
          backgroundColor: authError ? getRandomizedLightColors()[0] : '#bbb',
          paddingHorizontal: 35,
          paddingVertical: 20,
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
