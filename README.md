# SlowSite

A hand-drawn website that grows iteratively based on visitor interest.

## Concept

Each page is a photographed 4x6 index card with blue-outlined clickable zones. The site starts sparse and grows organically as visitors explore, with pages created in response to visitor clicks on unmapped areas.

See [SPEC.md](./SPEC.md) for full details.

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Firebase

**Option A: Environment Variables (Recommended for dev)**
```bash
cp .env.example .env
# Edit .env with your Firebase Realtime Database credentials
```

**Option B: Hardcode Config (Simplest for deployment)**

Just edit `src/firebase.js` directly with your config. Firebase keys are safe to expose - see [FIREBASE_SECURITY.md](./FIREBASE_SECURITY.md).

### 3. Set Firebase Security Rules

See [FIREBASE_SECURITY.md](./FIREBASE_SECURITY.md) for the security rules to add in your Firebase Console. This is what keeps your data secure, not hiding the keys.

### 4. Initialize Firebase Data

Import `sample-data.json` into your Firebase Realtime Database to get started, or create the structure manually:

```json
{
  "pages": {
    "home": {
      "imagePath": "/cards/home.jpg",
      "imageMap": [ /* zones */ ]
    }
  },
  "clicks": {}
}
```

### 5. Add Index Card Images

Place your photographed index cards in `public/cards/`:
- `public/cards/home.jpg` - your home page card
- `public/cards/desk.jpg` - example second page
- etc.

Images should be portrait orientation (4x6 aspect ratio recommended).

## Development

```bash
npm run dev
```

Open http://localhost:3000

## Deployment

This is a **100% static site** - no backend server needed!

```bash
npm run build  # Creates dist/ folder
```

Deploy `dist/` to any static host: Firebase Hosting, Netlify, Vercel, GitHub Pages, or just upload to any web server.

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## Project Structure

```
slowsite/
├── public/
│   ├── cards/           # Index card photos
│   └── favicon.ico
├── src/
│   ├── components/
│   │   └── CardViewer.vue     # Display card with clickable zones
│   ├── views/
│   │   ├── CardPage.vue       # Fetch and display page
│   │   └── MissingPage.vue    # "Being created" message
│   ├── router/
│   │   └── index.js           # Vue Router config
│   ├── firebase.js            # Firebase initialization
│   ├── App.vue
│   └── main.js
├── SPEC.md              # Full specification
└── sample-data.json     # Example Firebase data structure
```

## How It Works

### Visitor Experience

1. Start at home page (index card image)
2. Hover over blue zones to see clickable areas
3. Click to navigate to linked pages
4. Clicking unmapped zones shows a "page being created" message and logs the interest

### Builder Workflow (Coming Soon)

Phase 2 will add:
- Upload interface for new cards
- Manual zone mapping (draw polygons)
- Click analytics dashboard

Phase 3 will add:
- Automatic blue outline detection (CV)
- Faster page creation

## Tech Stack

- **Vue 3** - Reactive UI framework
- **Vite** - Fast build tool
- **Vue Router** - Client-side routing
- **Firebase Realtime Database** - Data storage and sync
- **SVG** - Clickable zone overlays

## Philosophy

- **Slow growth**: Site evolves based on genuine interest
- **Handmade**: Every page is a physical artifact
- **Playful**: Exploring feels like flipping through a sketchbook
- **Personal**: Small, quirky, unique to the creator
- **Hackable**: Simple enough to modify and experiment with
