// src/mutations/useToggleComplete.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { GTask, patchTask } from '../helpers/googleTasksApi'
import { getAccessTokenOrThrow } from '../helpers/googleToken'

type ToggleCompleteVars = {
  listId: string
  taskId: string
  completed: boolean
}

type ToggleCompleteContext = {
  prev?: GTask[]
}

export function useToggleComplete() {
  const qc = useQueryClient()

  return useMutation<
    unknown,
    unknown,
    ToggleCompleteVars,
    ToggleCompleteContext
  >({
    mutationFn: async ({ listId, taskId, completed }) => {
      const token = await getAccessTokenOrThrow()
      return patchTask(token, listId, taskId, {
        status: completed ? 'completed' : 'needsAction',
      })
    },

    onMutate: async ({ listId, taskId, completed }) => {
      await qc.cancelQueries({ queryKey: ['tasks', listId] })

      const prev = qc.getQueryData<GTask[]>(['tasks', listId])

      qc.setQueryData<GTask[]>(['tasks', listId], (old = []) =>
        old.map((t) =>
          t.id === taskId
            ? { ...t, status: completed ? 'completed' : 'needsAction' }
            : t
        )
      )

      return { prev }
    },

    onError: (_err, variables, ctx) => {
      if (ctx?.prev) {
        qc.setQueryData<GTask[]>(['tasks', variables.listId], ctx.prev)
      }
    },

    onSettled: (_data, _err, variables) => {
      if (!variables) return
      qc.invalidateQueries({ queryKey: ['tasks', variables.listId] })
    },
  })
}
