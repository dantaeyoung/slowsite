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
      >
        <g v-for="zone in pageData.imageMap" :key="zone.zoneId">
          <polygon
            :points="formatPoints(zone.coords)"
            class="zone-polygon"
            :class="{ 'zone-hover': hoveredZone === zone.zoneId }"
            @click="handleZoneClick(zone)"
            @mouseenter="hoveredZone = zone.zoneId"
            @mouseleave="hoveredZone = null"
          />
        </g>
      </svg>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { database } from '../firebase'
import { ref as dbRef, push } from 'firebase/database'

const props = defineProps({
  pageData: {
    type: Object,
    required: true
  }
})

const router = useRouter()
const cardContainer = ref(null)
const imageLoaded = ref(false)
const imageWidth = ref(0)
const imageHeight = ref(0)
const hoveredZone = ref(null)

const imagePath = computed(() => {
  return props.pageData.imagePath || '/cards/placeholder.jpg'
})

const onImageLoad = (event) => {
  imageWidth.value = event.target.naturalWidth
  imageHeight.value = event.target.naturalHeight
  imageLoaded.value = true
}

const formatPoints = (coords) => {
  // Convert array of [x,y] pairs to SVG polygon points string
  return coords.map(([x, y]) => `${x},${y}`).join(' ')
}

const handleZoneClick = async (zone) => {
  console.log('Zone clicked:', zone)

  if (zone.targetPage) {
    // Page exists, navigate to it
    router.push(`/${zone.targetPage}`)
  } else {
    // Page doesn't exist yet - log the click and show missing page
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
    console.log('Click logged to Firebase')
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
}

.zone-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
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
</style>
