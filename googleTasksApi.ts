// src/googleTasksApi.ts
const BASE = 'https://tasks.googleapis.com/tasks/v1'

async function g<T>(
  accessToken: string,
  path: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })

  const text = await res.text()
  if (!res.ok) throw new Error(`Google Tasks API ${res.status}: ${text}`)
  return text ? (JSON.parse(text) as T) : (undefined as unknown as T)
}

export type GTaskList = { id: string; title: string }
export type GTask = {
  id: string
  title: string
  status: 'needsAction' | 'completed'
  notes?: string
  due?: string
  updated?: string
}

export async function listTaskLists(accessToken: string) {
  return g<{ items?: GTaskList[] }>(accessToken, `/users/@me/lists`)
}

export async function listTasks(accessToken: string, taskListId: string) {
  // showCompleted=true gets completed items too (handy for debugging)
  return g<{ items?: GTask[] }>(
    accessToken,
    `/lists/${taskListId}/tasks?showCompleted=true`
  )
}
