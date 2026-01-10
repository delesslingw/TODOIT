import { useState } from 'react'
import { FlatList } from 'react-native'
import { getRandomizedLightColors } from '../colors'
import Task from './Task'

const TaskView = ({ status, setStatus, tasks, listId }) => {
  const [colors] = useState(getRandomizedLightColors())

  const renderItem = ({ item: task, index: i }) => (
    <Task
      key={task.id}
      title={task.title}
      id={task.id}
      color={colors[i % colors.length]}
      status={status}
      setStatus={setStatus}
      taskStatus={task.status}
      listId={listId}
    />
  )

  return (

    <FlatList
      data={tasks}
      keyExtractor={(t) => t.id}
      renderItem={renderItem}
      // 👇 important for “scroll inside another scroll/gesture” on Android
      nestedScrollEnabled
      // feels nicer
      scrollEventThrottle={16}

    />
  )
}

export default TaskView
