// Components/Task.tsx
//
// Updated for the “single source of truth” plan:
// - NO local `isChecked` state anymore.
// - Checkbox directly PATCHes the Google Task status via React Query mutation.
// - Checkbox is ONLY interactive while status.status === RUNNING.
// - During RUNNING, you can check/uncheck freely (as long as this task is allowed by highlight rules).
// - IMPORTANT: If you want to be able to uncheck tasks, you must be *rendering* completed tasks
//   during RUNNING (e.g., fetch with showCompleted=true while RUNNING). Otherwise, completed tasks
//   will disappear and you won’t have anything to uncheck.
//
// This component assumes you pass in:
// - `listId` (Google tasklist id) so we know what list to patch in the API
// - `taskStatus` ("needsAction" | "completed") from Google Tasks
//
// It also preserves your existing session UX:
// - If a highlighted task is checked, you show the “End Session?” alert.

import Entypo from '@expo/vector-icons/Entypo'
import { FontAwesome } from '@react-native-vector-icons/fontawesome'
import Checkbox from 'expo-checkbox'
import hexAlpha from 'hex-alpha'
import { useState } from 'react'
import {
  Alert,
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { IDLE, RUNNING, SessionPhase } from '../hooks/useStatus'
import { useToggleComplete } from '../hooks/useToggleComplete'

type GoogleTaskStatus = 'needsAction' | 'completed'

const Task = ({
  title,
  id,
  listId,
  color,
  taskStatus,
  status,
  setStatus,
}: {
  title: string
  id: string // Google task id
  listId: string // Google tasklist id
  color: string
  taskStatus: GoogleTaskStatus // comes from Google (single source of truth)
  status: SessionPhase
  setStatus: (status: SessionPhase) => void
}) => {
  // React Query mutation scoped to this list
  const toggleComplete = useToggleComplete(listId)
  // const deleteTask = useDeleteTask(listId)
  // const editTask = useEditTask(listId)
  // Menu state
  const [showMenu, setShowMenu] = useState(false)

  // “Checked” is derived from Google task state (single source of truth)
  const isChecked = taskStatus === 'completed'

  // Your existing “disable other tasks when one is highlighted” behavior
  const disabled =
    status.status === RUNNING &&
    status.highlightedTaskId !== null &&
    status.highlightedTaskId !== id

  const highlighted =
    status.status === RUNNING &&
    status.highlightedTaskId !== null &&
    status.highlightedTaskId === id

  // Checkbox should only be available during RUNNING,
  // and only for the highlighted task or when no task is highlighted.
  const canShowCheckbox =
    status.status === RUNNING &&
    (status.highlightedTaskId === null || status.highlightedTaskId === id)

  // We only allow toggling completion during RUNNING (your rule).
  const canToggleCompletion =
    canShowCheckbox && !disabled && !toggleComplete.isPending

  const createCancelAlert = () =>
    Alert.alert(
      'End Session?',
      'Do you want to end your session or continue it with other tasks?',
      [
        {
          text: 'Continue With Other Tasks',
          onPress: () => {
            setStatus({ status: RUNNING, highlightedTaskId: null })
          },
        },
        {
          text: 'End Session',
          onPress: () => {
            setStatus({ status: IDLE })
          },
        },
      ]
    )

  const handleCheckToggle = (nextChecked: boolean) => {
    // console.log('CHECK TOGGLED', {
    //   canToggleCompletion,
    //   status: status.status,
    //   highlightedTaskId:
    //     status.status === 'RUNNING' ? status.highlightedTaskId : null,
    //   taskId: id,
    //   listId,
    //   nextChecked,
    // })
    // Enforce your rule: not completable unless RUNNING.
    if (!canToggleCompletion) return

    // Patch Google immediately (single source of truth)
    toggleComplete.mutate({
      taskId: id,
      completed: nextChecked,
    })

    // Preserve your existing “highlighted task checked prompts end/continue”
    if (highlighted && nextChecked) {
      createCancelAlert()
    }
  }

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
        {canShowCheckbox ? (
          <Checkbox
            value={isChecked}
            onValueChange={handleCheckToggle}
            // expo-checkbox: color prop is used on Android when checked
            color={isChecked ? '#aaa' : '#333'}
            // If you want a visual cue when it’s not toggleable:
            disabled={!canToggleCompletion}
          />
        ) : (
          <TouchableOpacity
            disabled={disabled}
            onPress={() =>
              setStatus({ status: RUNNING, highlightedTaskId: id })
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
          fontSize: 16,
          fontWeight: 'bold',
          flexWrap: 'wrap',
          flexShrink: 1,
          marginRight: 24,
        }}
      >
        {title}
      </Text>

      <Pressable
        style={{ marginLeft: 'auto', marginRight: 12 }}
        onPress={() => setShowMenu(true)}
      >
        <Entypo name='dots-three-vertical' size={24} color='#777' />
      </Pressable>

      <Modal
        transparent
        visible={showMenu}
        onRequestClose={() => setShowMenu(false)}
      >
        <Pressable style={{ flex: 1 }} onPress={() => setShowMenu(false)}>
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
            }}
          >
            <Pressable
              onPress={(e) => e.stopPropagation()}
              style={{
                backgroundColor: 'white',
                borderRadius: 8,
                overflow: 'hidden',
                minWidth: 150,
              }}
            >
              <Pressable
                style={{
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: '#e0e0e0',
                }}
                onPress={() => {
                  setShowMenu(false)
                  Alert.prompt(
                    'Edit Task',
                    'Enter new title:',
                    [
                      {
                        text: 'Cancel',
                        onPress: () => {},
                        style: 'cancel',
                      },
                      {
                        text: 'Save',
                        onPress: (newTitle) => {
                          // if (newTitle && newTitle.trim()) {
                          //   editTask.mutate({
                          //     taskId: id,
                          //     title: newTitle.trim(),
                          //   })
                          // }
                        },
                      },
                    ],
                    'plain-text',
                    title
                  )
                }}
              >
                <Text style={{ fontSize: 16, color: '#333' }}>Edit</Text>
              </Pressable>

              <Pressable
                style={{
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                }}
                onPress={() => {
                  setShowMenu(false)
                  Alert.alert(
                    'Delete Task?',
                    'Are you sure you want to delete this task?',
                    [
                      {
                        text: 'Cancel',
                        onPress: () => {},
                        style: 'cancel',
                      },
                      {
                        text: 'Delete',
                        onPress: () => {
                          // deleteTask.mutate(id)
                        },
                        style: 'destructive',
                      },
                    ]
                  )
                }}
              >
                <Text style={{ fontSize: 16, color: '#d32f2f' }}>Delete</Text>
              </Pressable>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  )
}

export default Task
