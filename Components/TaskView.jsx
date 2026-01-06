import { useState } from 'react'
import { ScrollView } from 'react-native'
import { getRandomizedLightColors } from '../colors'
import Task from './Task'

const TaskView = ({ status, setStatus, tasks }) => {
  const [colors, _] = useState(getRandomizedLightColors())

  return (
    <ScrollView
      style={{
        flex: 1,
      }}
      contentContainerStyle={{
        flexGrow: 1,
        flexDirection: 'column',
      }}
    >
      {tasks.map((task, i) => {
        return (
          <Task
            key={task.id}
            title={task.title}
            id={task.id}
            color={colors[i % colors.length]}
            status={status}
            setStatus={setStatus}
          />
        )
      })}
    </ScrollView>
  )
}

export default TaskView
