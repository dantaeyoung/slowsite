# Deployment Guide

SlowSite is a **100% client-side static site**. No backend server needed!

## Build the Static Site

```bash
npm run build
```

This creates a `dist/` folder with pure HTML/CSS/JS.

## Deployment Options (Pick One)

### Option 1: Firebase Hosting (Recommended)

Free, fast CDN, same place as your database:

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize hosting (one time)
firebase init hosting
# - Choose your Firebase project
# - Public directory: dist
# - Single-page app: Yes
# - Don't overwrite index.html

# Deploy
firebase deploy --only hosting
```

Your site will be at: `https://your-project.firebaseapp.com`

### Option 2: Netlify

Easiest option with GitHub auto-deploy:

1. Push code to GitHub
2. Go to [netlify.com](https://netlify.com)
3. "New site from Git" → Select your repo
4. Build command: `npm run build`
5. Publish directory: `dist`
6. Environment variables: Add your `VITE_FB_*` variables
7. Deploy!

Auto-deploys on every git push.

### Option 3: GitHub Pages

Free hosting on GitHub:

```bash
# Install gh-pages
npm install -D gh-pages

# Add to package.json scripts:
# "deploy": "vite build && gh-pages -d dist"

# Deploy
npm run deploy
```

Your site will be at: `https://yourusername.github.io/slowsite`

**Note:** Add `base: '/slowsite/'` to `vite.config.js` for GitHub Pages.

### Option 4: Vercel

Similar to Netlify:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

## Environment Variables for Deployment

All platforms let you add environment variables in their dashboard. Add these:

- `VITE_FB_API_KEY`
- `VITE_FB_AUTH_DOMAIN`
- `VITE_FB_DATABASE_URL`
- `VITE_FB_PROJECT_ID`
- `VITE_FB_STORAGE_BUCKET`
- `VITE_FB_MESSAGING_SENDER_ID`
- `VITE_FB_APP_ID`

**OR** just hardcode them in `src/firebase.js` since they're safe to expose (see FIREBASE_SECURITY.md).

## Hardcoding Config (Simplest)

If you want the absolute simplest deployment, just put your Firebase config directly in the code:

```js
// src/firebase.js
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXX",
  authDomain: "your-project.firebaseapp.com",
  databaseURL: "https://your-project.firebaseio.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
}
```

This is **safe** because Firebase keys are public (security is in Firebase Rules).

Then deployment is just:
1. `npm run build`
2. Upload `dist/` folder anywhere (any static host, S3, your own server, etc.)

## Cost

All these options have generous free tiers:
- **Firebase Hosting**: 10GB storage, 360MB/day transfer (free)
- **Netlify**: 100GB bandwidth/month (free)
- **Vercel**: 100GB bandwidth/month (free)
- **GitHub Pages**: Unlimited for public repos (free)

For a small personal site with index card images, you'll stay well within free limits.

## Admin Authentication (GitHub Login)

The `/admin` page is protected by GitHub authentication. To set it up:

### Step 1: Enable GitHub Auth in Firebase

1. Go to [Firebase Console](https://console.firebase.google.com) → your project
2. **Authentication** → **Sign-in method** → **Add new provider**
3. Select **GitHub** and enable it
4. You'll see an **Authorization callback URL** - copy it (looks like `https://your-project.firebaseapp.com/__/auth/handler`)

### Step 2: Create a GitHub OAuth App

1. Go to GitHub → **Settings** → **Developer settings** → **OAuth Apps** → **New OAuth App**
2. Fill in:
   - **Application name**: `SlowSite Admin` (or anything you like)
   - **Homepage URL**: Your site URL (e.g., `https://your-project.firebaseapp.com` or `http://localhost:5173` for dev)
   - **Authorization callback URL**: Paste the callback URL from Firebase
3. Click **Register application**
4. Copy the **Client ID**
5. Click **Generate a new client secret** and copy the **Client Secret**

### Step 3: Add Credentials to Firebase

1. Back in Firebase Console → Authentication → GitHub provider
2. Paste the **Client ID** and **Client Secret** from GitHub
3. Click **Save**

### Step 4: Whitelist Your GitHub Username (Optional)

By default, any GitHub user can log in. To restrict access to only yourself:

1. Log in once at `/admin` - check the browser console for your GitHub username
2. Edit `src/composables/useAuth.js`:

```javascript
const ALLOWED_USERS = [
  'your-github-username'
]
```

3. Rebuild and redeploy

### Troubleshooting

- **Popup blocked**: Make sure popups are allowed for your site
- **Redirect mismatch**: Ensure the callback URL in GitHub exactly matches Firebase
- **Auth domain**: If using a custom domain, add it to Firebase Console → Authentication → Settings → Authorized domains
