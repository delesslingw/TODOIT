import AntDesign from '@expo/vector-icons/AntDesign'
import React, { useMemo, useState } from 'react'
import { Dimensions, Pressable, Text, View } from 'react-native'
import Dialog from 'react-native-dialog'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated'
import Carousel from 'react-native-reanimated-carousel'
import { useStatus } from '../hooks/useStatus'
import TaskView from './TaskView'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

type Props = {
  lists: Record<string, { id: string; tasks: any[] }>
  onAddTask: (listId: string, title: string) => Promise<void>
}

export default function Lists({ lists, onAddTask }: Props) {
  const listNames = useMemo(() => Object.keys(lists ?? {}), [lists])
  const data = useMemo(() => listNames, [listNames])

  const PAGE_WIDTH = SCREEN_WIDTH
  const CARD_WIDTH = Math.round(SCREEN_WIDTH * 0.9)
  const CAROUSEL_HEIGHT = Math.round(SCREEN_HEIGHT * 0.78)

  if (!data.length) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>No lists yet.</Text>
      </View>
    )
  }

  return (
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
      renderItem={({ item: listName, index }) => (
        <ListCard
          key={listName}
          listName={listName}
          index={index}
          total={data.length}
          list={lists[listName]}
          cardWidth={CARD_WIDTH}
          onAddTask={onAddTask}
        />
      )}
    />
  )
}

function ListCard({
  listName,
  list,
  index,
  total,
  cardWidth,
  onAddTask,
}: {
  listName: string
  list: { id: string; tasks: any[] }
  index: number
  total: number
  cardWidth: number
  onAddTask: (listId: string, title: string) => Promise<void>
}) {
  const { status, setStatus } = useStatus()
  const [showDialog, setShowDialog] = useState(false)
  const [taskTitle, setTaskTitle] = useState('')
  const rotation = useSharedValue(0)

  const handleAddTask = async () => {
    const trimmed = taskTitle.trim()
    if (!trimmed) return
    await onAddTask(list.id, trimmed)
    setTaskTitle('')
    setShowDialog(false)
  }

  const plusStyle = useAnimatedStyle(() => ({
    transform: [{ rotateZ: `${rotation.value}deg` }],
  }))

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: cardWidth,
          flex: 1,
          paddingTop: 16,
          overflow: 'hidden',
          backgroundColor: '#bbb',
          borderRadius: 12,
        }}
      >
        {/* Header */}
        <View
          style={{
            marginBottom: 12,
            paddingHorizontal: 16,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Text style={{ color: 'black', fontSize: 24, fontWeight: '700' }}>
            {listName}
          </Text>

          <Animated.View style={plusStyle}>
            <Pressable onPress={() => setShowDialog(true)}>
              <AntDesign name='plus' size={24} color='black' />
            </Pressable>
          </Animated.View>
        </View>

        {/* The important part: a keyboard-aware vertical scroller INSIDE the card */}
        <View style={{ paddingBottom: 120, paddingHorizontal: 16 }}>
          <TaskView
            tasks={list?.tasks ?? []}
            status={status}
            setStatus={setStatus}
            listId={list.id}
          />

          <Text
            style={{
              color: 'rgba(255,255,255,0.6)',
              marginTop: 12,
              textAlign: 'right',
            }}
          >
            {index + 1} / {total}
          </Text>
        </View>

        <Dialog.Container
          visible={showDialog}
          onBackdropPress={() => setShowDialog(false)}
        >
          <Dialog.Title>Add Task</Dialog.Title>
          <Dialog.Input
            placeholder='What will you do next?'
            value={taskTitle}
            onChangeText={setTaskTitle}
            returnKeyType='done'
          />
          <Dialog.Button label='Cancel' onPress={() => setShowDialog(false)} />
          <Dialog.Button label='Add' bold onPress={handleAddTask} />
        </Dialog.Container>
      </View>
    </View>
  )
}

// function Input({
//   show,
//   close,
//   onSubmit,
// }: {
//   show: boolean
//   close: () => void
//   onSubmit: (title: string) => Promise<void>
// }) {
//   const [text, setText] = useState('')
//   const height = useSharedValue(0)
//   const inputRef = useRef<TextInput>(null)

//   useEffect(() => {
//     height.value = withSpring(show ? 90 : 0)
//     if (show) {
//       // focus after layout opens
//       setTimeout(() => inputRef.current?.focus(), 50)
//     }
//   }, [show])

//   const animatedStyle = useAnimatedStyle(() => ({
//     height: height.value,
//   }))

//   const handleSubmit = async () => {
//     const trimmed = text.trim()
//     if (!trimmed) return
//     await onSubmit(trimmed)
//     setText('')
//     close()
//   }

//   return (
//     <Animated.View
//       style={[
//         { backgroundColor: 'white', overflow: 'hidden', borderRadius: 8 },
//         animatedStyle,
//       ]}
//     >
//       <View style={{ padding: 12 }}>
//         <TextInput
//           ref={inputRef}
//           value={text}
//           onChangeText={setText}
//           placeholder='Your task'
//           returnKeyType='done'
//           onSubmitEditing={handleSubmit}
//         />
//       </View>
//     </Animated.View>
//   )
// }
