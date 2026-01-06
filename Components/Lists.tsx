import React, { useMemo } from 'react'
import { Dimensions, Text, View } from 'react-native'
import Carousel from 'react-native-reanimated-carousel'
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
  lists: ListsShape
  status: any
  setStatus: (s: any) => void
}

function Lists({ lists, status, setStatus }: Props) {
  // Derived list “pages” from the object keys (order will be insertion order)
  const listNames = useMemo(() => Object.keys(lists ?? {}), [lists])
  const data = useMemo(() => listNames, [listNames])

  const PAGE_WIDTH = SCREEN_WIDTH
  const CARD_WIDTH = Math.round(SCREEN_WIDTH * 0.86)
  const CAROUSEL_HEIGHT = Math.round(SCREEN_HEIGHT * 0.78)

  if (!data.length) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#111',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: 'rgba(255,255,255,0.7)' }}>No lists yet.</Text>
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#111' }}>
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
        renderItem={({ item: listName, index }) => {
          const list = lists[listName]

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
                  borderRadius: 18,
                  padding: 16,
                  backgroundColor: '#1d1dff',
                  overflow: 'hidden',
                }}
              >
                {/* Header */}
                <View style={{ marginBottom: 12 }}>
                  <Text
                    style={{
                      color: 'white',
                      fontSize: 20,
                      fontWeight: '700',
                    }}
                  >
                    {listName}
                  </Text>

                  {/* optional: show id (or remove) */}
                  <Text
                    style={{ color: 'rgba(255,255,255,0.65)', marginTop: 4 }}
                  >
                    {list?.id}
                  </Text>
                </View>

                {/* Tasks */}
                <View style={{ flex: 1 }}>
                  <TaskView
                    tasks={list?.tasks ?? []}
                    status={status}
                    setStatus={setStatus}
                  />
                </View>

                {/* Footer indicator (optional) */}
                <Text style={{ color: 'rgba(255,255,255,0.6)', marginTop: 10 }}>
                  {index + 1} / {data.length}
                </Text>
              </View>
            </View>
          )
        }}
      />
    </View>
  )
}

export default Lists
