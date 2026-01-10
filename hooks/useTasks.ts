import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { useMemo } from 'react'
import {
  GTask,
  GTaskList,
  addTask,
  deleteTask,
  listTaskLists,
  listTasks,
  patchTask,
} from '../helpers/googleTasksApi'
import { getAccessTokenOrThrow } from '../helpers/googleToken'

type UseTasksArgs = {
  enabled: boolean
  showCompleted?: boolean
}

/**
 * useTasks - Integrated hook for all Google Tasks + React Query logic
 *
 * Handles:
 * - Fetching all tasklists
 * - Fetching all tasks for each tasklist
 * - Mutations for: add task, toggle completion, delete task
 * - Optimistic updates and error rollback
 * - Cache invalidation and synchronization
 *
 * Returns:
 * - listsForUI: Shaped data for rendering (title -> { id, tasks })
 * - dataBooting: Loading state
 * - dataError: Any error from fetching
 * - addTaskMutation: Mutation to add a new task
 * - toggleCompleteMutation: Mutation to toggle task completion
 * - deleteTaskMutation: Mutation to delete a task
 */
export function useTasks({ enabled, showCompleted = false }: UseTasksArgs) {
  const qc = useQueryClient()

  // Fetch all tasklists
  const taskListsQuery = useQuery({
    queryKey: ['tasklists'],
    enabled,
    queryFn: async (): Promise<GTaskList[]> => {
      const token = await getAccessTokenOrThrow()
      const listsRes = await listTaskLists(token)
      return listsRes.items ?? []
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  })

  const taskLists = taskListsQuery.data ?? []

  // Fetch tasks for each tasklist
  const taskQueriesConfig = useMemo(
    () =>
      taskLists.map((l) => ({
        queryKey: ['tasks', l.id] as const,
        enabled: enabled && taskListsQuery.isSuccess,
        queryFn: async (): Promise<GTask[]> => {
          const token = await getAccessTokenOrThrow()
          const res = await listTasks(token, l.id, { showCompleted })
          return res.items ?? []
        },
        staleTime: 15_000,
      })),
    [taskLists, enabled, taskListsQuery.isSuccess, showCompleted]
  )

  const tasksQueries = useQueries({ queries: taskQueriesConfig })

  const anyTasksLoading = tasksQueries.some((q) => q.isLoading)
  const anyTasksError = tasksQueries.find((q) => q.isError)?.error

  const dataBooting =
    enabled && (taskListsQuery.status !== 'success' || anyTasksLoading)

  const dataError =
    (taskListsQuery.isError ? taskListsQuery.error : null) ?? anyTasksError

  // Shape data for UI
  const listsForUI = useMemo(() => {
    const out: Record<string, { id: string; tasks: GTask[] }> = {}
    taskLists.forEach((l, idx) => {
      const tasks = tasksQueries[idx]?.data ?? []
      const key = out[l.title] ? `${l.title} (${l.id.slice(0, 4)})` : l.title
      out[key] = { id: l.id, tasks }
    })
    return out
  }, [taskLists, tasksQueries])

  // ============================================================
  // MUTATIONS
  // ============================================================

  // Add task mutation
  const addTaskMutation = useMutation({
    mutationFn: async (vars: {
      listId: string
      title: string
      notes?: string
    }) => {
      const token = await getAccessTokenOrThrow()
      return addTask(token, vars.listId, {
        title: vars.title,
        notes: vars.notes,
      })
    },
    onMutate: async (vars) => {
      // Cancel in-flight fetches
      await qc.cancelQueries({ queryKey: ['tasks', vars.listId] })

      // Snapshot previous state
      const prev = qc.getQueryData<GTask[]>(['tasks', vars.listId])

      // Optimistically add task (with placeholder ID)
      const optimisticTask: GTask = {
        id: `optimistic-${Date.now()}`,
        title: vars.title,
        status: 'needsAction',
        notes: vars.notes,
      }

      qc.setQueryData<GTask[]>(['tasks', vars.listId], (old = []) => [
        ...old,
        optimisticTask,
      ])

      return { prev, listId: vars.listId }
    },
    onError: (_err, vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(['tasks', vars.listId], ctx.prev)
    },
    onSettled: (_data, _err, vars) => {
      qc.invalidateQueries({ queryKey: ['tasks', vars.listId] })
    },
  })

  // Toggle completion mutation
  const toggleCompleteMutation = useMutation({
    mutationFn: async (vars: {
      listId: string
      taskId: string
      completed: boolean
    }) => {
      const token = await getAccessTokenOrThrow()
      return patchTask(token, vars.listId, vars.taskId, {
        status: vars.completed ? 'completed' : 'needsAction',
      })
    },
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: ['tasks', vars.listId] })
      const prev = qc.getQueryData<GTask[]>(['tasks', vars.listId])

      qc.setQueryData<GTask[]>(['tasks', vars.listId], (old = []) =>
        old.map((t) =>
          t.id === vars.taskId
            ? { ...t, status: vars.completed ? 'completed' : 'needsAction' }
            : t
        )
      )

      return { prev, listId: vars.listId }
    },
    onError: (_err, vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(['tasks', vars.listId], ctx.prev)
    },
    onSettled: (_data, _err, vars) => {
      qc.invalidateQueries({ queryKey: ['tasks', vars.listId] })
    },
  })

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (vars: { listId: string; taskId: string }) => {
      const token = await getAccessTokenOrThrow()
      return deleteTask(token, vars.listId, vars.taskId)
    },
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: ['tasks', vars.listId] })
      const prev = qc.getQueryData<GTask[]>(['tasks', vars.listId])

      qc.setQueryData<GTask[]>(['tasks', vars.listId], (old = []) =>
        old.filter((t) => t.id !== vars.taskId)
      )

      return { prev, listId: vars.listId }
    },
    onError: (_err, vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(['tasks', vars.listId], ctx.prev)
    },
    onSettled: (_data, _err, vars) => {
      qc.invalidateQueries({ queryKey: ['tasks', vars.listId] })
    },
  })

  return {
    // Queries
    listsForUI,
    dataBooting,
    dataError,

    // Mutations
    addTaskMutation,
    toggleCompleteMutation,
    deleteTaskMutation,
  }
}
