# SlowSite Specification

## Concept
A hand-drawn website that grows iteratively based on visitor interest. Pages are 4x6 index cards (portrait) with blue-outlined clickable zones. The site starts sparse and grows organically as visitors explore, with the builder creating pages in response to visitor clicks.

## Builder Workflow

### 1. Create Index Card
- Draw content on 4x6 index card (portrait orientation)
- Use **blue boxes, circles, or polylines** to outline clickable areas
- Can be drawings of rooms, objects, scenes (Microsoft Bob-style)

### 2. Upload & Process
- Take photo of index card
- Upload to builder interface
- Computer vision scans for blue outlines:
  - Detect blue color range (HSV filtering)
  - Find contours/polygons
  - Extract clickable regions

### 3. Map Links
- Builder interface shows:
  - Original photo with detected blue zones highlighted
  - List of detected zones (Zone 1, Zone 2, etc.)
- For each zone, builder specifies:
  - Target URL/page slug (e.g., `zine.html`, `about.html`, `desk/lamp.html`)
  - Optional: alt text/description
- Creates image map data structure
- Saves page with associated image map

### 4. Respond to Interest
- Builder receives notifications when users click unmapped zones
- Sees analytics: which non-existent pages are getting clicks
- Creates new index cards for popular destinations
- Site grows based on actual visitor interest

## Visitor Workflow

### 1. Browse Site
- Start at home page (index card image)
- Hover over clickable zones (cursor changes, subtle highlight?)
- Click to navigate to linked pages

### 2. Discover Missing Pages
- Click on zone with no page yet
- Instead of 404, see magical "page being created" message:
  - "This room is still being sketched..."
  - "The artist is still drawing this..."
  - "This page is growing slowly..."
- Click is logged to database
- Builder is notified

### 3. Return Later
- Site evolves over time
- Previously missing pages may now exist
- Organic, living website experience

## Data Structure

### Page Document
```javascript
{
  pageId: "home",           // slug/identifier
  imagePath: "/cards/home.jpg",
  imageMap: [
    {
      zoneId: "zone-1",
      coords: [[x1,y1], [x2,y2], [x3,y3], [x4,y4]], // polygon points
      targetPage: "desk",     // page slug
      label: "My Desk"
    },
    {
      zoneId: "zone-2",
      coords: [[x1,y1], [x2,y2], [x3,y3]],
      targetPage: null,       // not yet created
      label: "Office Plant"
    }
  ],
  createdAt: timestamp,
  orientation: "portrait"
}
```

### Click Log
```javascript
{
  clickId: "auto-generated",
  pageId: "home",
  zoneId: "zone-2",
  targetPage: "office-plant",  // intended destination
  exists: false,                // page exists?
  timestamp: timestamp,
  userAgent: "...",
  referrer: "..."
}
```

### Builder Notifications
```javascript
{
  notificationId: "auto-generated",
  type: "missing-page-click",
  targetPage: "office-plant",
  clickCount: 5,
  firstClicked: timestamp,
  lastClicked: timestamp,
  read: false
}
```

## Technical Architecture

### Frontend (Visitor-Facing)
- **Page Viewer**: Display index card images with clickable zones
  - SVG overlay for clickable regions (polygons)
  - Hover effects
  - Click handling → navigate or show "being created" message
- **Navigation**: Client-side routing between cards
- **Magic 404**: Beautiful "page being created" view

### Frontend (Builder Interface)
- **Upload**: Photo upload for new cards
- **CV Processing**:
  - Client-side or server-side blue outline detection
  - Show detected zones overlaid on image
- **Zone Mapper**:
  - Click to select zone
  - Input target page slug
  - Preview image map
- **Dashboard**:
  - See all pages
  - View click analytics
  - Notifications for missing pages
  - Create/edit pages

### Backend
- **Database** (Firebase):
  - Pages collection
  - Clicks collection
  - Notifications collection
- **Storage**: Index card images
- **Cloud Functions** (optional):
  - Process uploads
  - Run CV if server-side
  - Aggregate click analytics
  - Send notifications

### Computer Vision
- **Blue Detection**:
  - Convert image to HSV
  - Filter for blue range (configurable threshold)
  - Find contours
  - Approximate polygons
  - Return coordinate arrays
- **Libraries**:
  - OpenCV.js (client-side) or OpenCV Python (server-side)
  - Alternative: Simple canvas-based detection

## User Experience Details

### "Page Being Created" Messages
Randomized, charming messages:
- "This page is still in the sketchbook..."
- "The ink is still drying here..."
- "Check back soon - this card is being drawn..."
- "You've discovered an unfinished corner..."
- "The artist has been notified of your interest!"

### Visual Style
- Handmade, organic aesthetic
- Minimal UI chrome
- Let the index cards be the star
- Subtle animations (hand-drawn feel)
- Maybe slightly imperfect alignments

### Builder Notifications
- Email when new page gets 3+ clicks?
- Dashboard shows "most wanted" pages
- Simple, non-intrusive

## Development Phases

### Phase 1: Core Viewer
- Display single index card with image map
- Click navigation between pages
- "Page being created" view
- Click logging

### Phase 2: Builder Upload
- Upload index card photo
- Manual zone creation (draw polygons on image)
- Save page with image map
- No CV yet - just manual mapping

### Phase 3: Computer Vision
- Automatic blue outline detection
- Builder just confirms/adjusts detected zones
- Much faster page creation

### Phase 4: Analytics & Growth
- Dashboard for builder
- Click analytics
- Notification system
- "Most wanted pages" view

## Open Questions
1. Authentication: Builder login vs. public upload? (Likely builder-only)
2. CV processing: Client-side or server-side?
3. Image hosting: Firebase Storage vs. CDN?
4. Multiple builders vs. single personal site?
5. Version history for pages?
6. Allow re-drawing/updating cards?

## Philosophy
- **Slow growth**: Site evolves based on genuine interest
- **Handmade**: Every page is a physical artifact
- **Playful**: Navigating should feel like exploring a sketchbook
- **Personal**: Small, quirky, unique to the creator
- **Hackable**: Simple enough to modify and experiment with
