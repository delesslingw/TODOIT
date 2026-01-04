import { useState } from 'react'
import { ScrollView } from 'react-native'
import { getRandomizedLightColors } from '../colors'
import dummyTasks from '../dummyTasks'
import Task from './Task'

const TaskView = ({ status, setStatus }) => {
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
      {dummyTasks.map((task, i) => {
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
