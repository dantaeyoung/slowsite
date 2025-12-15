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
