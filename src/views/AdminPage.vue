<template>
  <div class="admin-page">
    <h1>Provisional Zones</h1>
    <p class="subtitle">Areas visitors have marked as interesting</p>

    <div v-if="loading" class="loading">Loading...</div>

    <div v-else-if="allZones.length === 0" class="empty">
      No provisional zones yet. Visitors can drag on cards to suggest areas.
    </div>

    <div v-else class="zones-list">
      <div v-for="zone in sortedZones" :key="zone.fullId" class="zone-card">
        <div class="zone-header">
          <router-link :to="'/' + zone.pageId" class="page-link">
            {{ zone.pageId }}
          </router-link>
          <span class="click-count">{{ zone.clickCount }} clicks</span>
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

        <div class="zone-meta">
          <span>Created: {{ formatDate(zone.createdAt) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { database } from '../firebase'
import { ref as dbRef, get } from 'firebase/database'

const loading = ref(true)
const allZones = ref([])
const pageImages = ref({})
const imageDimensions = ref({})
const imageRefs = ref({})

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

const sortedZones = computed(() => {
  return [...allZones.value].sort((a, b) => (b.clickCount || 0) - (a.clickCount || 0))
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

const formatDate = (timestamp) => {
  if (!timestamp) return 'Unknown'
  return new Date(timestamp).toLocaleDateString()
}
</script>

<style scoped>
.admin-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

h1 {
  margin-bottom: 5px;
}

.subtitle {
  color: #666;
  margin-bottom: 30px;
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

.zone-meta {
  font-size: 12px;
  color: #888;
}
</style>
