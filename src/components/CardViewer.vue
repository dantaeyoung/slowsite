<template>
  <div class="card-viewer">
    <div class="card-container" ref="cardContainer">
      <img
        :src="imagePath"
        :alt="pageData.pageId"
        class="card-image"
        @load="onImageLoad"
      />

      <!-- SVG overlay for clickable zones -->
      <svg
        class="zone-overlay"
        :viewBox="`0 0 ${imageWidth} ${imageHeight}`"
        v-if="imageLoaded"
        ref="svgOverlay"
        @mousedown="startDrag"
        @mousemove="onDrag"
        @mouseup="endDrag"
        @mouseleave="endDrag"
        @touchstart="startDrag"
        @touchmove="onDrag"
        @touchend="endDrag"
      >
        <!-- Existing image map zones (blue) -->
        <g v-for="zone in pageData.imageMap" :key="zone.zoneId">
          <polygon
            :points="formatPoints(zone.coords)"
            class="zone-polygon"
            :class="{ 'zone-hover': hoveredZone === zone.zoneId }"
            @click.stop="handleZoneClick(zone)"
            @mouseenter="hoveredZone = zone.zoneId"
            @mouseleave="hoveredZone = null"
          />
        </g>

        <!-- Provisional zones (dotted gray) -->
        <g v-for="zone in provisionalZones" :key="zone.zoneId">
          <polygon
            :points="formatPoints(zone.coords)"
            class="provisional-zone"
            :class="{ 'zone-hover': hoveredZone === zone.zoneId }"
            @click.stop="handleProvisionalClick(zone)"
            @mouseenter="hoveredZone = zone.zoneId"
            @mouseleave="hoveredZone = null"
          />
          <!-- Click count badge -->
          <g v-if="zone.clickCount > 0" :transform="getBadgeTransform(zone.coords)">
            <circle r="12" class="badge-circle" />
            <text class="badge-text" text-anchor="middle" dy="4">{{ zone.clickCount }}</text>
          </g>
        </g>

        <!-- Currently drawing rectangle -->
        <rect
          v-if="isDrawing && currentRect"
          :x="currentRect.x"
          :y="currentRect.y"
          :width="currentRect.width"
          :height="currentRect.height"
          class="drawing-rect"
        />
      </svg>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { database } from '../firebase'
import { ref as dbRef, push, get, set, increment } from 'firebase/database'

const props = defineProps({
  pageData: {
    type: Object,
    required: true
  }
})

const router = useRouter()
const cardContainer = ref(null)
const svgOverlay = ref(null)
const imageLoaded = ref(false)
const imageWidth = ref(0)
const imageHeight = ref(0)
const hoveredZone = ref(null)

// Provisional zones state
const provisionalZones = ref([])

// Drawing state
const isDrawing = ref(false)
const startPoint = ref(null)
const currentRect = ref(null)

const imagePath = computed(() => {
  return props.pageData.imagePath || '/cards/placeholder.jpg'
})

const onImageLoad = (event) => {
  imageWidth.value = event.target.naturalWidth
  imageHeight.value = event.target.naturalHeight
  imageLoaded.value = true
}

// Fetch provisional zones on mount and when pageId changes
onMounted(() => {
  fetchProvisionalZones()
})

watch(() => props.pageData.pageId, () => {
  fetchProvisionalZones()
})

const fetchProvisionalZones = async () => {
  try {
    const zonesRef = dbRef(database, `provisionalZones/${props.pageData.pageId}`)
    const snapshot = await get(zonesRef)
    if (snapshot.exists()) {
      const data = snapshot.val()
      provisionalZones.value = Object.keys(data).map(key => ({
        zoneId: key,
        ...data[key]
      }))
    } else {
      provisionalZones.value = []
    }
  } catch (error) {
    console.error('Error fetching provisional zones:', error)
  }
}

const formatPoints = (coords) => {
  return coords.map(([x, y]) => `${x},${y}`).join(' ')
}

const getBadgeTransform = (coords) => {
  // Position badge at top-right of zone
  const maxX = Math.max(...coords.map(c => c[0]))
  const minY = Math.min(...coords.map(c => c[1]))
  return `translate(${maxX - 5}, ${minY + 15})`
}

// Convert screen coordinates to SVG coordinates
const getSVGCoords = (event) => {
  const svg = svgOverlay.value
  if (!svg) return null

  const pt = svg.createSVGPoint()
  const clientX = event.touches ? event.touches[0].clientX : event.clientX
  const clientY = event.touches ? event.touches[0].clientY : event.clientY

  pt.x = clientX
  pt.y = clientY

  const svgP = pt.matrixTransform(svg.getScreenCTM().inverse())
  return { x: svgP.x, y: svgP.y }
}

const startDrag = (event) => {
  // Don't start drawing if clicking on an existing zone
  if (event.target.classList.contains('zone-polygon') ||
      event.target.classList.contains('provisional-zone')) {
    return
  }

  const coords = getSVGCoords(event)
  if (!coords) return

  isDrawing.value = true
  startPoint.value = coords
  currentRect.value = { x: coords.x, y: coords.y, width: 0, height: 0 }
}

const onDrag = (event) => {
  if (!isDrawing.value || !startPoint.value) return

  const coords = getSVGCoords(event)
  if (!coords) return

  const x = Math.min(startPoint.value.x, coords.x)
  const y = Math.min(startPoint.value.y, coords.y)
  const width = Math.abs(coords.x - startPoint.value.x)
  const height = Math.abs(coords.y - startPoint.value.y)

  currentRect.value = { x, y, width, height }
}

const endDrag = async (event) => {
  if (!isDrawing.value || !currentRect.value) {
    isDrawing.value = false
    return
  }

  const rect = currentRect.value

  // Minimum size threshold (prevent tiny accidental zones)
  if (rect.width > 20 && rect.height > 20) {
    await saveProvisionalZone(rect)
  }

  isDrawing.value = false
  startPoint.value = null
  currentRect.value = null
}

const saveProvisionalZone = async (rect) => {
  try {
    const coords = [
      [rect.x, rect.y],
      [rect.x + rect.width, rect.y],
      [rect.x + rect.width, rect.y + rect.height],
      [rect.x, rect.y + rect.height]
    ]

    const zonesRef = dbRef(database, `provisionalZones/${props.pageData.pageId}`)
    const newZoneRef = push(zonesRef)

    await set(newZoneRef, {
      pageId: props.pageData.pageId,
      coords: coords,
      clickCount: 0,
      createdAt: Date.now()
    })

    // Refresh zones
    await fetchProvisionalZones()
  } catch (error) {
    console.error('Error saving provisional zone:', error)
  }
}

const handleProvisionalClick = async (zone) => {
  try {
    // Increment click count
    const zoneRef = dbRef(database, `provisionalZones/${props.pageData.pageId}/${zone.zoneId}/clickCount`)
    await set(zoneRef, increment(1))

    // Update local state
    const idx = provisionalZones.value.findIndex(z => z.zoneId === zone.zoneId)
    if (idx !== -1) {
      provisionalZones.value[idx].clickCount++
    }
  } catch (error) {
    console.error('Error logging provisional click:', error)
  }
}

const handleZoneClick = async (zone) => {
  if (zone.targetPage) {
    router.push(`/${zone.targetPage}`)
  } else {
    await logMissingPageClick(zone)
    router.push({
      name: 'missing',
      query: {
        from: props.pageData.pageId,
        zone: zone.zoneId,
        label: zone.label
      }
    })
  }
}

const logMissingPageClick = async (zone) => {
  try {
    const clicksRef = dbRef(database, 'clicks')
    await push(clicksRef, {
      pageId: props.pageData.pageId,
      zoneId: zone.zoneId,
      targetPage: zone.label || 'unknown',
      exists: false,
      timestamp: Date.now(),
      userAgent: navigator.userAgent
    })
  } catch (error) {
    console.error('Error logging click:', error)
  }
}
</script>

<style scoped>
.card-viewer {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.card-container {
  position: relative;
  max-width: 100%;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  overflow: hidden;
}

.card-image {
  display: block;
  max-width: 100%;
  height: auto;
  user-select: none;
  -webkit-user-drag: none;
}

.zone-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  cursor: crosshair;
}

.zone-polygon {
  fill: rgba(52, 118, 223, 0.1);
  stroke: rgba(52, 118, 223, 0.3);
  stroke-width: 2;
  cursor: pointer;
  pointer-events: all;
  transition: all 0.2s ease;
}

.zone-polygon.zone-hover {
  fill: rgba(52, 118, 223, 0.3);
  stroke: rgba(52, 118, 223, 0.6);
  stroke-width: 3;
}

/* Provisional zones - dotted gray */
.provisional-zone {
  fill: rgba(128, 128, 128, 0.1);
  stroke: rgba(128, 128, 128, 0.5);
  stroke-width: 2;
  stroke-dasharray: 6 4;
  cursor: pointer;
  pointer-events: all;
  transition: all 0.2s ease;
}

.provisional-zone.zone-hover {
  fill: rgba(128, 128, 128, 0.25);
  stroke: rgba(128, 128, 128, 0.8);
  stroke-width: 3;
}

/* Drawing rectangle */
.drawing-rect {
  fill: rgba(128, 128, 128, 0.2);
  stroke: rgba(128, 128, 128, 0.6);
  stroke-width: 2;
  stroke-dasharray: 6 4;
  pointer-events: none;
}

/* Click count badge */
.badge-circle {
  fill: #666;
}

.badge-text {
  fill: white;
  font-size: 12px;
  font-weight: bold;
}
</style>
