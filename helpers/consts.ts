export const TODOIT_CHANNELS = [
  {
    id: 'pomodoro',
    name: 'Pomodoro',
    importance: 'high',
    sound: true,
    vibration: true,
  },
  {
    id: 'default',
    name: 'General',
    importance: 'default',
    sound: true,
    vibration: false,
  },
] as const
