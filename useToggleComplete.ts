// src/mutations/useToggleComplete.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { GTask, patchTask } from './googleTasksApi'
import { getAccessTokenOrThrow } from './googleToken'

export function useToggleComplete(listId: string) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (vars: { taskId: string; completed: boolean }) => {
      const token = await getAccessTokenOrThrow()
      return patchTask(token, listId, vars.taskId, {
        status: vars.completed ? 'completed' : 'needsAction',
      })
    },

    onMutate: async (vars) => {
      // Cancel any in-flight fetches so we don’t overwrite our optimistic update
      await qc.cancelQueries({ queryKey: ['tasks', listId] })

      // Snapshot previous tasks for rollback
      const prev = qc.getQueryData<GTask[]>(['tasks', listId])

      // Optimistically update the task status in cache
      qc.setQueryData<GTask[]>(['tasks', listId], (old = []) =>
        old.map((t) =>
          t.id === vars.taskId
            ? { ...t, status: vars.completed ? 'completed' : 'needsAction' }
            : t
        )
      )

      return { prev }
    },

    onError: (_err, _vars, ctx) => {
      // Rollback on failure
      if (ctx?.prev) qc.setQueryData(['tasks', listId], ctx.prev)
    },

    onSettled: () => {
      // Sync with server truth + ensure completed tasks disappear if you’re hiding them
      qc.invalidateQueries({ queryKey: ['tasks', listId] })
    },
  })
}
