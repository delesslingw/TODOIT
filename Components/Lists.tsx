import AntDesign from '@expo/vector-icons/AntDesign'
import React, { useEffect, useMemo, useState } from 'react'
import { Dimensions, Pressable, Text, TextInput, View } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'
import Carousel from 'react-native-reanimated-carousel'
import { useStatus } from '../hooks/useStatus'
import TaskView from './TaskView' // adjust path
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

type Task = any

type ListsShape = Record<
  string, // list title / display name (e.g. "General")
  {
    id: string
    tasks: Task[]
  }
>

type Props = {
  lists: Record<string, { id: string; tasks: any[] }>
  onAddTask: (listId: string, title: string) => Promise<void>
}

function Lists({ lists, onAddTask }: Props) {
  // Derived list “pages” from the object keys (order will be insertion order)
  const listNames = useMemo(() => Object.keys(lists ?? {}), [lists])
  const data = useMemo(() => listNames, [listNames])
  const { status, setStatus } = useStatus()

  const PAGE_WIDTH = SCREEN_WIDTH
  const CARD_WIDTH = Math.round(SCREEN_WIDTH * 0.9)
  const CAROUSEL_HEIGHT = Math.round(SCREEN_HEIGHT * 0.78)

  if (!data.length) {
    return (
      <View
        style={{
          flex: 1,

          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: 'rgba(255,255,255,0.7)' }}>No lists yet.</Text>
      </View>
    )
  }

  return (
    <View style={{ flex: 1 }}>
      <Carousel
        width={PAGE_WIDTH}
        height={CAROUSEL_HEIGHT}
        data={data}
        loop
        pagingEnabled
        mode='parallax'
        modeConfig={{
          parallaxScrollingScale: 0.92,
          parallaxScrollingOffset: 60,
          parallaxAdjacentItemScale: 0.82,
        }}
        scrollAnimationDuration={700}
        onConfigurePanGesture={(gesture) => {
          'worklet'
          // Require a more intentional horizontal swipe before the carousel activates
          gesture
            .activeOffsetX([-20, 20]) // >20px horizontal movement to activate
            .failOffsetY([-10, 10]) // if user moves vertically early, give up
        }}
        renderItem={({ item: listName, index }) => {
          const [showInput, setShowInput] = useState(false)
          const list = lists[listName]
          const rotation = useSharedValue(0)
          useEffect(() => {
            if (showInput) {
              rotation.value = withSpring(-45)
            } else {
              rotation.value = withSpring(0)
            }
          }, [showInput])
          const animatedStyle = useAnimatedStyle(() => ({
            transform: [{ rotateZ: `${rotation.value}deg` }],
          }))
          return (
            <View
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <View
                style={{
                  width: CARD_WIDTH,
                  flex: 1,
                  paddingTop: 16,
                  paddingBottom: 100,
                  overflow: 'hidden',
                  backgroundColor: '#bbb',
                }}
              >
                {/* Header */}
                <View
                  style={{
                    marginBottom: 18,
                    paddingHorizontal: 16,
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Text
                    style={{
                      color: 'black',
                      fontSize: 24,
                      fontWeight: '700',
                    }}
                  >
                    {listName}
                  </Text>
                  <Animated.View style={animatedStyle}>
                    <Pressable onPress={() => setShowInput((bool) => !bool)}>
                      <AntDesign name='plus' size={24} color='black' />
                    </Pressable>
                  </Animated.View>
                </View>

                {/* Tasks */}
                <View style={{ flex: 1 }}>
                  <Input
                    show={showInput}
                    taskListId={list.id}
                    close={() => setShowInput(false)}
                    onSubmit={(title) => onAddTask(list.id, title)}
                  />
                  <TaskView
                    tasks={list?.tasks ?? []}
                    status={status}
                    setStatus={setStatus}
                    listId={list.id}
                  />
                </View>

                {/* Footer indicator (optional) */}
                <View style={{ paddingHorizontal: 16 }}>
                  <Text
                    style={{
                      color: 'rgba(255,255,255,0.6)',
                      marginTop: 10,
                      textAlign: 'right',
                    }}
                  >
                    {index + 1} / {data.length}
                  </Text>
                </View>
              </View>
            </View>
          )
        }}
      />
    </View>
  )
}

function Input({
  show,
  taskListId,
  close,
  onSubmit,
}: {
  show: boolean
  taskListId: string
  close: () => void
  onSubmit: (title: string) => Promise<void>
}) {
  const [text, setText] = useState('')
  const height = useSharedValue(0)

  const handleSubmit = async () => {
    try {
      await onSubmit(text)
      height.value = withSpring(0)
      setText('')
    } catch (e) {
      console.error('Error submitting new task: ', e)
    }
  }
  useEffect(() => {
    if (show) {
      height.value = withSpring(90)
    } else {
      height.value = withSpring(0)
    }
  }, [show])
  return (
    <Animated.View style={{ backgroundColor: 'white', height }}>
      <TextInput
        style={{}}
        onChangeText={setText}
        value={text}
        placeholder='Your task'
        onSubmitEditing={() => {
          console.log('done?')
          handleSubmit()
        }}
      />
    </Animated.View>
  )
}
export default Lists
