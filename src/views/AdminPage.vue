<template>
  <div class="admin-page">
    <div class="admin-header">
      <div>
        <h1>Admin</h1>
        <p class="subtitle">Provisional zones & page connections</p>
      </div>
      <router-link to="/admin/graph" class="graph-link mobile-only">View Page Graph</router-link>
    </div>

    <div class="admin-layout">
      <!-- Zones Panel -->
      <div class="zones-panel">

    <!-- Sort controls -->
    <div v-if="allZones.length > 0" class="sort-controls">
      <span class="sort-label">Sort by:</span>
      <button
        :class="{ active: sortMode === 'clicks' }"
        @click="sortMode = 'clicks'"
      >
        Most Clicks
      </button>
      <button
        :class="{ active: sortMode === 'recent' }"
        @click="sortMode = 'recent'"
      >
        Recently Created
      </button>
      <button
        :class="{ active: sortMode === 'clicked' }"
        @click="sortMode = 'clicked'"
      >
        Recently Clicked
      </button>
      <button
        :class="{ active: sortMode === 'page' }"
        @click="sortMode = 'page'"
      >
        By Page
      </button>
    </div>

    <div v-if="loading" class="loading">Loading...</div>

    <div v-else-if="allZones.length === 0" class="empty">
      No provisional zones yet. Visitors can drag on cards to suggest areas.
    </div>

    <!-- Consolidate toolbar -->
    <div v-if="selectedCount > 0" class="consolidate-toolbar">
      <span>{{ selectedCount }} selected</span>
      <button
        v-if="canConsolidate"
        @click="consolidateSelected"
        class="consolidate-btn"
      >
        Consolidate Selected
      </button>
      <span v-else-if="selectedCount >= 2" class="consolidate-warning">
        Select zones from the same page to consolidate
      </span>
      <button @click="selectedZones = new Set()" class="clear-selection-btn">
        Clear
      </button>
    </div>

    <div class="zones-list">
      <div
        v-for="zone in sortedZones"
        :key="zone.fullId"
        class="zone-card"
        :class="{ 'is-selected': isZoneSelected(zone), 'has-overlap': getOverlappingZones(zone).length > 0 }"
      >
        <div class="zone-header">
          <div class="zone-header-left">
            <input
              type="checkbox"
              :checked="isZoneSelected(zone)"
              @change="toggleZoneSelection(zone)"
              class="zone-checkbox"
            />
            <router-link :to="'/' + zone.pageId" class="page-link">
              {{ zone.pageId }}
            </router-link>
            <span v-if="getOverlappingZones(zone).length > 0" class="overlap-hint" :title="'Overlaps with ' + getOverlappingZones(zone).length + ' other zone(s)'">
              ~{{ getOverlappingZones(zone).length }}
            </span>
          </div>
          <span class="click-count">{{ zone.clickCount || 0 }} clicks</span>
        </div>

        <div class="zone-preview">
          <div class="preview-container" v-if="pageImages[zone.pageId]">
            <img
              :src="pageImages[zone.pageId]"
              class="preview-image"
              :ref="el => setImageRef(zone.pageId, el)"
              @load="e => onImageLoad(zone.pageId, e)"
            />
            <svg
              class="preview-overlay"
              :viewBox="getViewBox(zone.pageId)"
              preserveAspectRatio="xMidYMid meet"
            >
              <polygon
                :points="formatPoints(zone.coords)"
                class="preview-zone"
              />
            </svg>
          </div>
          <div v-else class="no-preview">Preview unavailable</div>
        </div>

        <div class="zone-actions">
          <button @click="openPromoteModal(zone)" class="promote-btn">
            Promote to Page
          </button>
          <button @click="deleteZone(zone)" class="delete-btn">
            Delete
          </button>
        </div>

        <div class="zone-meta">
          <span>Created: {{ formatDate(zone.createdAt) }}</span>
          <span v-if="zone.lastClickedAt"> · Last clicked: {{ formatDateTime(zone.lastClickedAt) }}</span>
        </div>
      </div>
    </div>
      </div>

      <!-- Graph Panel (desktop only) -->
      <div class="graph-panel desktop-only">
        <h3>Page Graph</h3>
        <PageGraph :height="350" @nodeClick="goToPage" />
      </div>
    </div>

    <!-- Promote Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <h2>Promote Zone</h2>
        <p class="modal-subtitle">Connect this zone to a page</p>

        <!-- Tab buttons -->
        <div class="tabs">
          <button
            :class="{ active: activeTab === 'existing' }"
            @click="activeTab = 'existing'"
          >
            Existing Page
          </button>
          <button
            :class="{ active: activeTab === 'upload' }"
            @click="activeTab = 'upload'"
          >
            Upload New
          </button>
        </div>

        <!-- Existing page tab -->
        <div v-if="activeTab === 'existing'" class="tab-content">
          <label>Select a page:</label>
          <select v-model="selectedPage" class="page-select">
            <option value="">-- Choose page --</option>
            <option v-for="page in availablePages" :key="page" :value="page">
              {{ page }}
            </option>
          </select>
          <button
            @click="promoteToExisting"
            :disabled="!selectedPage || promoting"
            class="action-btn"
          >
            {{ promoting ? 'Connecting...' : 'Connect to Page' }}
          </button>
        </div>

        <!-- Upload new tab -->
        <div v-if="activeTab === 'upload'" class="tab-content">
          <!-- Image Preview -->
          <div v-if="imagePreview" class="upload-preview">
            <img :src="imagePreview" alt="Preview" />
            <button @click="clearUpload" class="clear-btn">Clear</button>
          </div>

          <!-- File Input -->
          <div v-else class="file-input-container">
            <label for="modal-file-input" class="file-label">
              Tap to select image
            </label>
            <input
              id="modal-file-input"
              type="file"
              accept="image/*"
              capture="environment"
              @change="onFileSelect"
              class="file-input"
            />
          </div>

          <!-- Page Name -->
          <div v-if="imagePreview" class="form-group">
            <label>Page name (slug):</label>
            <input
              v-model="newPageName"
              type="text"
              placeholder="e.g., kitchen, garden"
              class="text-input"
            />
          </div>

          <button
            v-if="imagePreview && newPageName"
            @click="promoteWithUpload"
            :disabled="promoting"
            class="action-btn"
          >
            {{ promoting ? `Uploading... ${Math.round(uploadProgress)}%` : 'Create & Connect' }}
          </button>
        </div>

        <!-- Error message -->
        <p v-if="error" class="error">{{ error }}</p>

        <!-- Success message -->
        <div v-if="success" class="success">
          <p>Zone promoted successfully!</p>
          <router-link :to="'/' + promotedZone.pageId" class="view-link">
            View {{ promotedZone.pageId }}
          </router-link>
        </div>

        <button @click="closeModal" class="close-btn">Close</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { database, storage } from '../firebase'
import PageGraph from '../components/PageGraph.vue'
import { ref as dbRef, get, set, update, remove, push } from 'firebase/database'
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage'

const router = useRouter()

const loading = ref(true)
const allZones = ref([])
const pageImages = ref({})
const allPages = ref({})
const imageDimensions = ref({})
const imageRefs = ref({})
const sortMode = ref('clicks')

// Modal state
const showModal = ref(false)
const activeTab = ref('existing')
const selectedZone = ref(null)
const selectedPage = ref('')
const promoting = ref(false)
const error = ref(null)
const success = ref(false)
const promotedZone = ref(null)

// Upload state
const selectedFile = ref(null)
const imagePreview = ref(null)
const newPageName = ref('')
const uploadProgress = ref(0)

onMounted(async () => {
  await fetchAllData()
  loading.value = false
})

const fetchAllData = async () => {
  try {
    // Fetch all provisional zones
    const zonesRef = dbRef(database, 'provisionalZones')
    const zonesSnapshot = await get(zonesRef)

    if (zonesSnapshot.exists()) {
      const pagesData = zonesSnapshot.val()
      const zones = []

      for (const pageId of Object.keys(pagesData)) {
        const pageZones = pagesData[pageId]
        for (const zoneId of Object.keys(pageZones)) {
          zones.push({
            fullId: `${pageId}-${zoneId}`,
            zoneId,
            pageId,
            ...pageZones[zoneId]
          })
        }
      }

      allZones.value = zones
    }

    // Fetch page data for images
    const pagesRef = dbRef(database, 'pages')
    const pagesSnapshot = await get(pagesRef)

    if (pagesSnapshot.exists()) {
      const pages = pagesSnapshot.val()
      allPages.value = pages
      for (const pageId of Object.keys(pages)) {
        if (pages[pageId].imagePath) {
          pageImages.value[pageId] = pages[pageId].imagePath
        }
      }
    }
  } catch (error) {
    console.error('Error fetching data:', error)
  }
}

// Calculate bounding box from coords
const getBoundingBox = (coords) => {
  const xs = coords.map(c => c[0])
  const ys = coords.map(c => c[1])
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys)
  }
}

// Calculate overlap percentage between two zones
const calculateOverlap = (zone1, zone2) => {
  const box1 = getBoundingBox(zone1.coords)
  const box2 = getBoundingBox(zone2.coords)

  // Calculate intersection
  const xOverlap = Math.max(0, Math.min(box1.maxX, box2.maxX) - Math.max(box1.minX, box2.minX))
  const yOverlap = Math.max(0, Math.min(box1.maxY, box2.maxY) - Math.max(box1.minY, box2.minY))
  const intersectionArea = xOverlap * yOverlap

  // Calculate areas
  const area1 = (box1.maxX - box1.minX) * (box1.maxY - box1.minY)
  const area2 = (box2.maxX - box2.minX) * (box2.maxY - box2.minY)
  const smallerArea = Math.min(area1, area2)

  if (smallerArea === 0) return 0
  return intersectionArea / smallerArea
}

// Overlap detection threshold
const OVERLAP_THRESHOLD = 0.5

// Track which zones have overlapping siblings
const getOverlappingZones = (zone) => {
  return allZones.value.filter(other =>
    other.fullId !== zone.fullId &&
    other.pageId === zone.pageId &&
    calculateOverlap(zone, other) >= OVERLAP_THRESHOLD
  )
}

// Selection state for manual consolidation
const selectedZones = ref(new Set())

const toggleZoneSelection = (zone) => {
  const newSet = new Set(selectedZones.value)
  if (newSet.has(zone.fullId)) {
    newSet.delete(zone.fullId)
  } else {
    newSet.add(zone.fullId)
  }
  selectedZones.value = newSet
}

const isZoneSelected = (zone) => selectedZones.value.has(zone.fullId)

// Check if selected zones can be consolidated (2+ from same page)
const canConsolidate = computed(() => {
  if (selectedZones.value.size < 2) return false
  const selected = allZones.value.filter(z => selectedZones.value.has(z.fullId))
  const pageIds = new Set(selected.map(z => z.pageId))
  return pageIds.size === 1 // All from same page
})

const selectedCount = computed(() => selectedZones.value.size)

const sortedZones = computed(() => {
  const zones = [...allZones.value]

  switch (sortMode.value) {
    case 'clicks':
      return zones.sort((a, b) => (b.clickCount || 0) - (a.clickCount || 0))
    case 'recent':
      return zones.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    case 'clicked':
      return zones.sort((a, b) => (b.lastClickedAt || 0) - (a.lastClickedAt || 0))
    case 'page':
      return zones.sort((a, b) => a.pageId.localeCompare(b.pageId))
    default:
      return zones
  }
})

const availablePages = computed(() => {
  return Object.keys(allPages.value)
})

const setImageRef = (pageId, el) => {
  if (el) {
    imageRefs.value[pageId] = el
  }
}

const onImageLoad = (pageId, event) => {
  const img = event.target
  imageDimensions.value[pageId] = {
    width: img.naturalWidth,
    height: img.naturalHeight
  }
}

const getViewBox = (pageId) => {
  const dims = imageDimensions.value[pageId]
  if (dims) {
    return `0 0 ${dims.width} ${dims.height}`
  }
  return '0 0 1000 1000'
}

const formatPoints = (coords) => {
  if (!coords || coords.length === 0) return ''
  return coords.map(([x, y]) => `${x},${y}`).join(' ')
}

// Get merged bounding box for a group of zones
const getMergedBounds = (zones) => {
  const allCoords = zones.flatMap(z => z.coords)
  const xs = allCoords.map(c => c[0])
  const ys = allCoords.map(c => c[1])
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys)
  }
}

// Consolidate manually selected zones into one
const consolidateSelected = async () => {
  if (!canConsolidate.value) return

  const selected = allZones.value.filter(z => selectedZones.value.has(z.fullId))
  if (selected.length < 2) return

  try {
    const pageId = selected[0].pageId
    const bounds = getMergedBounds(selected)
    const totalClicks = selected.reduce((sum, z) => sum + (z.clickCount || 0), 0)

    // Create merged coords (rectangle from bounding box)
    const mergedCoords = [
      [bounds.minX, bounds.minY],
      [bounds.maxX, bounds.minY],
      [bounds.maxX, bounds.maxY],
      [bounds.minX, bounds.maxY]
    ]

    // Keep the first zone and update it with merged data
    const keepZone = selected[0]
    const keepRef = dbRef(database, `provisionalZones/${pageId}/${keepZone.zoneId}`)
    await update(keepRef, {
      coords: mergedCoords,
      clickCount: totalClicks,
      consolidatedAt: Date.now(),
      consolidatedFrom: selected.length
    })

    // Delete the other zones
    for (let i = 1; i < selected.length; i++) {
      const zone = selected[i]
      const zoneRef = dbRef(database, `provisionalZones/${pageId}/${zone.zoneId}`)
      await remove(zoneRef)
    }

    // Clear selection and refresh
    selectedZones.value = new Set()
    await fetchAllData()
  } catch (err) {
    console.error('Error consolidating zones:', err)
  }
}

const formatDate = (timestamp) => {
  if (!timestamp) return 'Unknown'
  return new Date(timestamp).toLocaleDateString()
}

const formatDateTime = (timestamp) => {
  if (!timestamp) return 'Unknown'
  const date = new Date(timestamp)
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

// Modal functions
const openPromoteModal = (zone) => {
  selectedZone.value = zone
  showModal.value = true
  activeTab.value = 'existing'
  selectedPage.value = ''
  error.value = null
  success.value = false
  clearUpload()
}

const closeModal = () => {
  showModal.value = false
  selectedZone.value = null
  if (success.value) {
    fetchAllData()
  }
}

// Promote to existing page
const promoteToExisting = async () => {
  if (!selectedZone.value || !selectedPage.value) return

  promoting.value = true
  error.value = null

  try {
    await promoteZone(selectedZone.value, selectedPage.value)
    success.value = true
    promotedZone.value = selectedZone.value
  } catch (err) {
    error.value = 'Failed to promote: ' + err.message
  } finally {
    promoting.value = false
  }
}

// Upload handlers
const onFileSelect = (event) => {
  const file = event.target.files[0]
  if (file) {
    selectedFile.value = file
    const reader = new FileReader()
    reader.onload = (e) => {
      imagePreview.value = e.target.result
    }
    reader.readAsDataURL(file)
  }
}

const clearUpload = () => {
  selectedFile.value = null
  imagePreview.value = null
  newPageName.value = ''
  uploadProgress.value = 0
}

// Upload and promote
const promoteWithUpload = async () => {
  if (!selectedFile.value || !newPageName.value || !selectedZone.value) return

  promoting.value = true
  error.value = null

  try {
    // Upload image to Firebase Storage
    const fileName = `${newPageName.value}-${Date.now()}.${selectedFile.value.name.split('.').pop()}`
    const fileRef = storageRef(storage, `cards/${fileName}`)

    const uploadTask = uploadBytesResumable(fileRef, selectedFile.value)

    await new Promise((resolve, reject) => {
      uploadTask.on('state_changed',
        (snapshot) => {
          uploadProgress.value = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        },
        (err) => reject(err),
        () => resolve()
      )
    })

    // Get download URL
    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)

    // Create new page
    const pageRef = dbRef(database, `pages/${newPageName.value}`)
    await set(pageRef, {
      pageId: newPageName.value,
      imagePath: downloadURL,
      imageMap: [],
      createdAt: Date.now()
    })

    // Promote zone to point to new page
    await promoteZone(selectedZone.value, newPageName.value)

    success.value = true
    promotedZone.value = selectedZone.value
  } catch (err) {
    error.value = 'Failed: ' + err.message
  } finally {
    promoting.value = false
  }
}

// Core promote function - adds zone to page's imageMap
const promoteZone = async (zone, targetPageId) => {
  const pageRef = dbRef(database, `pages/${zone.pageId}`)
  const snapshot = await get(pageRef)

  if (!snapshot.exists()) {
    throw new Error('Source page not found')
  }

  const pageData = snapshot.val()
  const imageMap = pageData.imageMap || []

  // Add new zone to imageMap
  const newZone = {
    zoneId: `zone-${Date.now()}`,
    coords: zone.coords,
    targetPage: targetPageId,
    label: targetPageId
  }

  imageMap.push(newZone)

  // Update page with new imageMap
  await update(pageRef, { imageMap })

  // Remove from provisional zones
  const provZoneRef = dbRef(database, `provisionalZones/${zone.pageId}/${zone.zoneId}`)
  await remove(provZoneRef)

  // Remove from local state
  allZones.value = allZones.value.filter(z => z.fullId !== zone.fullId)
}

const deleteZone = async (zone) => {
  if (!confirm(`Delete this provisional zone? (${zone.clickCount || 0} clicks)`)) return

  try {
    const zoneRef = dbRef(database, `provisionalZones/${zone.pageId}/${zone.zoneId}`)
    await remove(zoneRef)
    allZones.value = allZones.value.filter(z => z.fullId !== zone.fullId)
    selectedZones.value.delete(zone.fullId)
  } catch (err) {
    console.error('Error deleting zone:', err)
  }
}

const goToPage = (pageId) => {
  router.push('/' + pageId)
}
</script>

<style scoped>
.admin-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.admin-layout {
  display: flex;
  gap: 30px;
}

.zones-panel {
  flex: 1;
  min-width: 0;
}

.graph-panel {
  width: 400px;
  flex-shrink: 0;
}

.graph-panel h3 {
  margin: 0 0 10px;
  font-size: 16px;
  color: #333;
}

/* Mobile: hide graph, show link */
.mobile-only {
  display: none;
}

.desktop-only {
  display: block;
}

@media (max-width: 900px) {
  .admin-layout {
    flex-direction: column;
  }

  .graph-panel {
    width: 100%;
  }

  .mobile-only {
    display: inline-block;
  }

  .desktop-only {
    display: none;
  }
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 15px;
}

h1 {
  margin-bottom: 5px;
}

.subtitle {
  color: #666;
  margin: 0;
}

.graph-link {
  padding: 8px 16px;
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 6px;
  color: #333;
  text-decoration: none;
  font-size: 14px;
}

.graph-link:hover {
  background: #eee;
  border-color: #ccc;
}

.sort-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.sort-label {
  color: #666;
  font-size: 14px;
}

.sort-controls button {
  padding: 6px 12px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 16px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.sort-controls button:hover {
  border-color: #999;
}

.sort-controls button.active {
  background: #3476df;
  color: white;
  border-color: #3476df;
}

.loading, .empty {
  text-align: center;
  padding: 40px;
  color: #666;
}

.zones-list {
  display: grid;
  gap: 20px;
}

.zone-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  background: #fafafa;
}

.zone-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.zone-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.zone-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.overlap-hint {
  background: #ff9800;
  color: white;
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 10px;
  font-weight: 600;
  cursor: help;
}

.zone-card.has-overlap {
  border-left: 3px solid #ff9800;
}

.zone-card.is-selected {
  background: #fff8e1;
  border-color: #ff9800;
}

.consolidate-toolbar {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 12px 16px;
  background: #fff8e1;
  border: 1px solid #ff9800;
  border-radius: 8px;
  margin-bottom: 20px;
}

.consolidate-warning {
  color: #666;
  font-size: 13px;
}

.clear-selection-btn {
  padding: 6px 12px;
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}

.clear-selection-btn:hover {
  background: #eee;
}

.page-link {
  font-weight: 600;
  color: #3476df;
  text-decoration: none;
}

.page-link:hover {
  text-decoration: underline;
}

.click-count {
  background: #666;
  color: white;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
}

.zone-preview {
  margin: 10px 0;
}

.preview-container {
  position: relative;
  width: 100%;
  max-width: 300px;
  border-radius: 4px;
  overflow: hidden;
}

.preview-image {
  width: 100%;
  display: block;
}

.preview-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.preview-zone {
  fill: rgba(255, 100, 100, 0.3);
  stroke: rgba(255, 50, 50, 0.8);
  stroke-width: 2;
}

.no-preview {
  padding: 20px;
  background: #eee;
  text-align: center;
  color: #999;
  border-radius: 4px;
}

.zone-actions {
  margin: 15px 0 10px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.consolidate-btn {
  padding: 10px 20px;
  background: #ff9800;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
}

.consolidate-btn:hover {
  background: #f57c00;
}

.promote-btn {
  padding: 10px 20px;
  background: #3476df;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
}

.promote-btn:hover {
  background: #2860b8;
}

.delete-btn {
  padding: 10px 20px;
  background: #f5f5f5;
  color: #666;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.delete-btn:hover {
  background: #ffebee;
  color: #c62828;
  border-color: #c62828;
}

.zone-meta {
  font-size: 12px;
  color: #888;
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
}

.modal {
  background: white;
  border-radius: 12px;
  padding: 25px;
  max-width: 450px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal h2 {
  margin: 0 0 5px;
}

.modal-subtitle {
  color: #666;
  margin-bottom: 20px;
}

.tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.tabs button {
  flex: 1;
  padding: 10px;
  border: 2px solid #ddd;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.tabs button.active {
  border-color: #3476df;
  background: #f0f6ff;
  color: #3476df;
}

.tab-content {
  min-height: 150px;
}

.tab-content label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
}

.page-select {
  width: 100%;
  padding: 12px;
  font-size: 16px;
  border: 2px solid #ddd;
  border-radius: 6px;
  margin-bottom: 15px;
}

.text-input {
  width: 100%;
  padding: 12px;
  font-size: 16px;
  border: 2px solid #ddd;
  border-radius: 6px;
  box-sizing: border-box;
  margin-bottom: 15px;
}

.action-btn {
  width: 100%;
  padding: 14px;
  background: #3476df;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
}

.action-btn:disabled {
  background: #99b8e8;
  cursor: not-allowed;
}

.file-input-container {
  border: 2px dashed #ccc;
  border-radius: 8px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  position: relative;
  margin-bottom: 15px;
}

.file-label {
  color: #666;
  cursor: pointer;
}

.file-input {
  position: absolute;
  opacity: 0;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  cursor: pointer;
}

.upload-preview {
  text-align: center;
  margin-bottom: 15px;
}

.upload-preview img {
  max-width: 100%;
  max-height: 200px;
  border-radius: 6px;
}

.clear-btn {
  margin-top: 10px;
  padding: 6px 15px;
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
}

.form-group {
  margin-bottom: 15px;
}

.error {
  color: #d32f2f;
  margin: 15px 0;
  text-align: center;
}

.success {
  text-align: center;
  padding: 15px;
  background: #e8f5e9;
  border-radius: 6px;
  margin: 15px 0;
}

.success p {
  color: #2e7d32;
  margin-bottom: 10px;
}

.view-link {
  color: #3476df;
  font-weight: 500;
}

.close-btn {
  width: 100%;
  padding: 12px;
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  margin-top: 15px;
  font-size: 14px;
}
</style>
