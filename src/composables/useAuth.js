import { ref, onMounted } from 'vue'
import { auth, githubProvider } from '../firebase'
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth'

// Shared auth state
const user = ref(null)
const loading = ref(true)

// Whitelist of allowed GitHub user IDs (add your GitHub username here)
// Find your ID: after logging in, check console or user.reloadUserInfo.screenName
const ALLOWED_USERS = [
  // 'your-github-username'
]

// If empty, allow any authenticated user
const isAllowed = (u) => {
  if (ALLOWED_USERS.length === 0) return true
  const username = u?.reloadUserInfo?.screenName
  return ALLOWED_USERS.includes(username)
}

export function useAuth() {
  onMounted(() => {
    onAuthStateChanged(auth, (u) => {
      user.value = u
      loading.value = false
      if (u) {
        // Log username for easy whitelisting
        console.log('Logged in as:', u.reloadUserInfo?.screenName)
      }
    })
  })

  const login = async () => {
    try {
      await signInWithPopup(auth, githubProvider)
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const isAuthenticated = () => !!user.value && isAllowed(user.value)

  return {
    user,
    loading,
    login,
    logout,
    isAuthenticated
  }
}
