import { GoogleSignin } from '@react-native-google-signin/google-signin'

const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID!

export function initGoogleAuth() {
  GoogleSignin.configure({
    webClientId: WEB_CLIENT_ID,
    scopes: ['https://www.googleapis.com/auth/tasks'],
  })
}

export async function connectGoogle(): Promise<string> {
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true })
  await GoogleSignin.signIn()
  const { accessToken } = await GoogleSignin.getTokens()
  if (!accessToken) throw new Error('No access token returned')
  return accessToken
}

export async function disconnectGoogle() {
  await GoogleSignin.signOut()
}
