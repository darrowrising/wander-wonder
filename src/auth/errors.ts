import { FirebaseError } from 'firebase/app'

export function authErrorMessage(error: unknown): string {
  const code = error instanceof FirebaseError ? error.code : ''

  switch (code) {
    case 'auth/operation-not-allowed':
      return 'That sign-in method is not enabled yet. In Firebase Console → Authentication → Sign-in method, enable Google and Email/Password for license-plate-game-test.'
    case 'auth/popup-closed-by-user':
      return 'Google sign-in was closed before finishing.'
    case 'auth/popup-blocked':
      return 'The sign-in popup was blocked. Allow popups for this site and try again.'
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized. Add localhost in Firebase Console → Authentication → Settings → Authorized domains.'
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Email or password is incorrect.'
    case 'auth/email-already-in-use':
      return 'That email already has an account. Sign in instead.'
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.'
    default: {
      const message = error instanceof Error ? error.message : 'Could not sign in.'
      if (message.includes('Database is closing/hidden')) {
        return 'Google sign-in hit a browser storage glitch. Refresh and try again.'
      }
      return message
    }
  }
}
