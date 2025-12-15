import { initializeApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'
import { getStorage } from 'firebase/storage'
import { getAuth, GithubAuthProvider } from 'firebase/auth'

// OPTION 1: Use environment variables (for development)
// Create a .env file with VITE_FB_* variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FB_API_KEY,
  authDomain: import.meta.env.VITE_FB_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FB_DATABASE_URL,
  projectId: import.meta.env.VITE_FB_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FB_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FB_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FB_APP_ID,
}

// OPTION 2: Hardcode your config (simplest for deployment)
// Uncomment and fill in your Firebase project details:
// const firebaseConfig = {
//   apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXX",
//   authDomain: "your-project.firebaseapp.com",
//   databaseURL: "https://your-project-default-rtdb.firebaseio.com",
//   projectId: "your-project",
//   storageBucket: "your-project.appspot.com",
//   messagingSenderId: "123456789012",
//   appId: "1:123456789012:web:abcdefghijklmnop"
// }

// Note: These keys are safe to expose publicly!
// Security comes from Firebase Security Rules, not hiding keys.
// See FIREBASE_SECURITY.md for details.

const app = initializeApp(firebaseConfig)
const database = getDatabase(app)
const storage = getStorage(app)
const auth = getAuth(app)
const githubProvider = new GithubAuthProvider()

export { app, database, storage, auth, githubProvider }
