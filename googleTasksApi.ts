/**
 * googleTasksApi.ts
 *
 * A small, annotated wrapper around the Google Tasks REST API for use in Expo / React Native.
 *
 * Why REST and not a "Google Tasks SDK"?
 * - Google Tasks is primarily exposed as a REST API.
 * - The official Google JS client libraries are not designed for React Native/Expo environments.
 * - In mobile apps, the normal pattern is: native Google Sign-In -> access token -> REST calls.
 *
 * This file:
 * - Defines lightweight TypeScript types for tasklists and tasks
 * - Provides a single helper (`tasksFetch`) that adds auth headers, parses JSON, and throws readable errors
 * - Exposes functions for the core CRUD operations you'll use in TODOIT:
 *   - list tasklists
 *   - list tasks
 *   - add a task
 *   - patch/update a task (complete/uncomplete, rename, etc.)
 *   - delete a task
 *
 * NOTE: This file assumes you already have an OAuth access token (string) from Google Sign-In.
 * This file does NOT perform authentication itself.
 */

// -----------------------------
// Base URL for the Tasks API
// -----------------------------
const BASE = 'https://tasks.googleapis.com/tasks/v1'

// -----------------------------
// Types (minimal but useful)
// -----------------------------

/**
 * A Google Task List.
 * Google returns more fields than this, but we only include what we currently need.
 */
export type GTaskList = {
  id: string
  title: string
}

/**
 * A Google Task item.
 * The API includes many optional fields; we include a practical subset for your UI.
 */
export type GTask = {
  id: string
  title: string
  status: 'needsAction' | 'completed'
  notes?: string
  due?: string // ISO 8601 string (e.g. 2026-01-05T...Z)
  updated?: string
  completed?: string
}

/**
 * The "list tasklists" response shape.
 * Google returns { items: [...] } when items exist; items may be omitted if empty.
 */
type ListTaskListsResponse = {
  items?: GTaskList[]
}

/**
 * The "list tasks" response shape.
 */
type ListTasksResponse = {
  items?: GTask[]
}

// -----------------------------
// Core helper: tasksFetch
// -----------------------------

/**
 * tasksFetch
 *
 * A single helper to call Google Tasks endpoints consistently.
 *
 * Responsibilities:
 * 1) Prefix the API base URL
 * 2) Attach the OAuth access token in the Authorization header
 * 3) Set JSON content headers for requests with bodies (safe to set always)
 * 4) Read the response body text once, so we can:
 *    - parse JSON on success
 *    - include the raw text in a thrown error on failure (super helpful)
 * 5) Handle endpoints that return an empty body (common with DELETE)
 *
 * @param token OAuth access token from Google Sign-In (Bearer token)
 * @param path  Endpoint path beginning with '/' (e.g. '/users/@me/lists')
 * @param init  Standard fetch RequestInit (method, body, etc.)
 */
async function tasksFetch<T>(
  token: string,
  path: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      // OAuth bearer token
      Authorization: `Bearer ${token}`,

      // JSON content-type (safe even for GET/DELETE; required for POST/PATCH bodies)
      'Content-Type': 'application/json',

      // Allow callers to add/override headers if needed
      ...(init?.headers ?? {}),
    },
  })

  // Read the body as text once so we can either parse or throw it
  const text = await res.text()

  // If non-2xx, throw a readable error with the server response
  if (!res.ok) {
    throw new Error(`Google Tasks API ${res.status}: ${text}`)
  }

  // Some endpoints (notably DELETE) can return empty body (204).
  // Return `undefined` as T in that case.
  if (!text) return undefined as unknown as T

  // Otherwise parse JSON
  return JSON.parse(text) as T
}

// -----------------------------
// API functions
// -----------------------------

/**
 * listTaskLists
 *
 * Fetch all of the user's tasklists.
 *
 * GET /users/@me/lists
 */
export async function listTaskLists(
  token: string
): Promise<ListTaskListsResponse> {
  return tasksFetch<ListTaskListsResponse>(token, '/users/@me/lists')
}

/**
 * listTasks
 *
 * Fetch tasks in a given tasklist.
 *
 * GET /lists/{tasklistId}/tasks
 *
 * Common query params you might want:
 * - showCompleted=true|false: include completed tasks
 * - showHidden=true|false: include hidden tasks
 * - maxResults=...
 *
 * For TODOIT:
 * - showCompleted=false is usually nice (keeps UI focused)
 * - during debugging you might set showCompleted=true
 */
export async function listTasks(
  token: string,
  tasklistId: string,
  opts?: {
    showCompleted?: boolean
    showHidden?: boolean
    maxResults?: number
  }
): Promise<ListTasksResponse> {
  const params = new URLSearchParams()

  if (opts?.showCompleted !== undefined) {
    params.set('showCompleted', String(opts.showCompleted))
  }
  if (opts?.showHidden !== undefined) {
    params.set('showHidden', String(opts.showHidden))
  }
  if (opts?.maxResults !== undefined) {
    params.set('maxResults', String(opts.maxResults))
  }

  const qs = params.toString()
  const path = qs
    ? `/lists/${encodeURIComponent(tasklistId)}/tasks?${qs}`
    : `/lists/${encodeURIComponent(tasklistId)}/tasks`

  return tasksFetch<ListTasksResponse>(token, path)
}

/**
 * addTask
 *
 * Create a new task in a tasklist.
 *
 * POST /lists/{tasklistId}/tasks
 */
export async function addTask(
  token: string,
  tasklistId: string,
  payload: {
    title: string
    notes?: string
    due?: string // ISO date string if you want due dates
  }
): Promise<GTask> {
  return tasksFetch<GTask>(
    token,
    `/lists/${encodeURIComponent(tasklistId)}/tasks`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  )
}

/**
 * patchTask
 *
 * Update fields on an existing task.
 *
 * PATCH /lists/{tasklistId}/tasks/{taskId}
 *
 * Use cases:
 * - mark complete / uncomplete: { status: 'completed' | 'needsAction' }
 * - rename: { title: 'New name' }
 * - notes: { notes: '...' }
 */
export async function patchTask(
  token: string,
  tasklistId: string,
  taskId: string,
  updates: Partial<{
    title: string
    notes: string
    due: string
    status: 'needsAction' | 'completed'
  }>
): Promise<GTask> {
  return tasksFetch<GTask>(
    token,
    `/lists/${encodeURIComponent(tasklistId)}/tasks/${encodeURIComponent(
      taskId
    )}`,
    {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }
  )
}

/**
 * deleteTask
 *
 * Delete a task from a tasklist.
 *
 * DELETE /lists/{tasklistId}/tasks/{taskId}
 *
 * Returns void (Google may return empty body).
 */
export async function deleteTask(
  token: string,
  tasklistId: string,
  taskId: string
): Promise<void> {
  await tasksFetch<void>(
    token,
    `/lists/${encodeURIComponent(tasklistId)}/tasks/${encodeURIComponent(
      taskId
    )}`,
    { method: 'DELETE' }
  )
}
