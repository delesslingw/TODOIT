export const TODOIT_CHANNELS = [
  {
    id: 'pomodoro_v2',
    name: 'Pomodoro',
    importance: 'max',
    sound: 'default',
    vibration: true,
    bypassDnd: true, // ✅ add this
  },
  {
    id: 'default_v2',
    name: 'General',
    importance: 'default',
    sound: 'default',
    vibration: false,
    bypassDnd: false, // optional (explicit)
  },
] as const
