import { useQueries, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import {
  GTask,
  GTaskList,
  listTaskLists,
  listTasks,
} from '../helpers/googleTasksApi'
import { getAccessTokenOrThrow } from '../helpers/googleToken'

type UseTasksApiArgs = {
  enabled: boolean
  showCompleted?: boolean
}

export function useTasksApi({
  enabled,
  showCompleted = false,
}: UseTasksApiArgs) {
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

  // Memoize query configs so useQueries isn't fed a brand-new array every render
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

  // Shape for your Lists UI (title -> { id, tasks })
  const listsForUI = useMemo(() => {
    const out: Record<string, { id: string; tasks: GTask[] }> = {}
    taskLists.forEach((l, idx) => {
      const tasks = tasksQueries[idx]?.data ?? []
      const key = out[l.title] ? `${l.title} (${l.id.slice(0, 4)})` : l.title
      out[key] = { id: l.id, tasks }
    })
    return out
  }, [taskLists, tasksQueries])

  return {
    taskListsQuery,
    tasksQueries,
    taskLists,
    listsForUI,
    dataBooting,
    dataError,
  }
}
