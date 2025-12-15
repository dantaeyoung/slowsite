# Firebase Security Rules

## For Firebase Realtime Database

Add these rules in your Firebase Console (Realtime Database → Rules):

```json
{
  "rules": {
    "pages": {
      ".read": true,
      ".write": false,
      "$pageId": {
        ".read": true,
        ".write": false
      }
    },
    "clicks": {
      ".read": false,
      ".write": true,
      "$clickId": {
        ".read": false,
        ".write": true,
        ".validate": "newData.hasChildren(['pageId', 'zoneId', 'timestamp'])"
      }
    }
  }
}
```

This allows:
- ✅ Anyone can READ pages (public site)
- ❌ Nobody can WRITE pages (only you via Firebase Console or builder)
- ✅ Anyone can WRITE clicks (log visitor interest)
- ❌ Nobody can READ clicks (privacy)

## For the Builder Interface (Phase 2)

When you add the builder, you'll use Firebase Authentication:

```json
{
  "rules": {
    "pages": {
      ".read": true,
      ".write": "auth != null && auth.token.email == 'your-email@example.com'"
    },
    "clicks": {
      ".read": "auth != null && auth.token.email == 'your-email@example.com'",
      ".write": true
    }
  }
}
```

## Why This Is Safe

1. **API keys are public identifiers** - they just say "this is project X"
2. **Security Rules enforce who can read/write** - like a server-side firewall
3. **Anyone can look at your HTML/JS anyway** - so hiding keys doesn't help
4. **Firebase handles auth and validation server-side** - can't be bypassed

See: https://firebase.google.com/docs/projects/api-keys#api-keys-for-firebase-are-different
