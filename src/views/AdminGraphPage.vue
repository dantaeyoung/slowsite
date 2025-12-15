<template>
  <div class="graph-page">
    <div class="graph-header">
      <h1>Page Graph</h1>
      <p class="subtitle">Directed graph of page connections</p>
      <div class="nav-links">
        <router-link to="/admin">Back to Zones</router-link>
      </div>
    </div>

    <div v-if="loading" class="loading">Loading...</div>

    <div v-else-if="nodes.length === 0" class="empty">
      No pages found.
    </div>

    <div v-else class="graph-container" ref="container">
      <svg
        :width="svgWidth"
        :height="svgHeight"
        class="graph-svg"
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#666" />
          </marker>
        </defs>

        <!-- Edges (arrows) -->
        <g class="edges">
          <line
            v-for="edge in edges"
            :key="edge.id"
            :x1="edge.x1"
            :y1="edge.y1"
            :x2="edge.x2"
            :y2="edge.y2"
            class="edge"
            marker-end="url(#arrowhead)"
          />
        </g>

        <!-- Nodes -->
        <g class="nodes">
          <g
            v-for="node in nodes"
            :key="node.id"
            :transform="`translate(${node.x}, ${node.y})`"
            class="node"
            @click="goToPage(node.id)"
          >
            <circle
              :r="nodeRadius"
              :class="{ 'has-image': node.hasImage, 'no-image': !node.hasImage }"
            />
            <text
              dy="4"
              text-anchor="middle"
              class="node-label"
            >
              {{ truncateLabel(node.id) }}
            </text>
          </g>
        </g>
      </svg>

      <!-- Legend -->
      <div class="legend">
        <div class="legend-item">
          <span class="legend-dot has-image"></span>
          <span>Has image</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot no-image"></span>
          <span>No image</span>
        </div>
        <div class="legend-item">
          <span class="legend-arrow">→</span>
          <span>Links to</span>
        </div>
      </div>
    </div>

    <!-- Page list -->
    <div v-if="nodes.length > 0" class="page-list">
      <h3>Pages ({{ nodes.length }})</h3>
      <div class="page-grid">
        <div
          v-for="node in nodes"
          :key="node.id"
          class="page-item"
          @click="goToPage(node.id)"
        >
          <span class="page-name">{{ node.id }}</span>
          <span class="page-links">{{ node.outgoing }} outgoing, {{ node.incoming }} incoming</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { database } from '../firebase'
import { ref as dbRef, get } from 'firebase/database'

const router = useRouter()
const loading = ref(true)
const pages = ref({})
const container = ref(null)
const svgWidth = ref(800)
const svgHeight = ref(600)
const nodeRadius = 35

onMounted(async () => {
  await fetchPages()
  updateSize()
  window.addEventListener('resize', updateSize)
  loading.value = false
})

onUnmounted(() => {
  window.removeEventListener('resize', updateSize)
})

const updateSize = () => {
  if (container.value) {
    svgWidth.value = Math.max(600, container.value.clientWidth)
    svgHeight.value = Math.max(400, Math.min(700, window.innerHeight - 300))
  }
}

const fetchPages = async () => {
  try {
    const pagesRef = dbRef(database, 'pages')
    const snapshot = await get(pagesRef)

    if (snapshot.exists()) {
      pages.value = snapshot.val()
    }
  } catch (error) {
    console.error('Error fetching pages:', error)
  }
}

// Build graph data
const graphData = computed(() => {
  const pageIds = Object.keys(pages.value)
  const nodeMap = {}
  const edgeList = []

  // Create nodes
  pageIds.forEach(id => {
    nodeMap[id] = {
      id,
      hasImage: !!pages.value[id].imagePath,
      outgoing: 0,
      incoming: 0
    }
  })

  // Create edges from imageMap connections
  pageIds.forEach(sourceId => {
    const page = pages.value[sourceId]
    const imageMap = page.imageMap || []

    imageMap.forEach((zone, idx) => {
      if (zone.targetPage) {
        // Add target node if it doesn't exist (orphan reference)
        if (!nodeMap[zone.targetPage]) {
          nodeMap[zone.targetPage] = {
            id: zone.targetPage,
            hasImage: false,
            outgoing: 0,
            incoming: 0
          }
        }

        edgeList.push({
          id: `${sourceId}-${zone.targetPage}-${idx}`,
          source: sourceId,
          target: zone.targetPage
        })

        nodeMap[sourceId].outgoing++
        nodeMap[zone.targetPage].incoming++
      }
    })
  })

  return {
    nodes: Object.values(nodeMap),
    edges: edgeList
  }
})

// Position nodes in a circle
const nodes = computed(() => {
  const { nodes: nodeList } = graphData.value
  const centerX = svgWidth.value / 2
  const centerY = svgHeight.value / 2
  const radius = Math.min(svgWidth.value, svgHeight.value) / 2 - 80

  return nodeList.map((node, i) => {
    const angle = (2 * Math.PI * i) / nodeList.length - Math.PI / 2
    return {
      ...node,
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle)
    }
  })
})

// Calculate edge positions with offset for arrow
const edges = computed(() => {
  const nodePositions = {}
  nodes.value.forEach(n => {
    nodePositions[n.id] = { x: n.x, y: n.y }
  })

  return graphData.value.edges.map(edge => {
    const source = nodePositions[edge.source]
    const target = nodePositions[edge.target]

    if (!source || !target) return null

    // Calculate direction vector
    const dx = target.x - source.x
    const dy = target.y - source.y
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (dist === 0) return null

    // Offset start and end points by node radius
    const offsetStart = nodeRadius + 2
    const offsetEnd = nodeRadius + 12

    return {
      id: edge.id,
      x1: source.x + (dx / dist) * offsetStart,
      y1: source.y + (dy / dist) * offsetStart,
      x2: target.x - (dx / dist) * offsetEnd,
      y2: target.y - (dy / dist) * offsetEnd
    }
  }).filter(Boolean)
})

const truncateLabel = (label) => {
  return label.length > 8 ? label.slice(0, 7) + '…' : label
}

const goToPage = (pageId) => {
  router.push('/' + pageId)
}
</script>

<style scoped>
.graph-page {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
}

.graph-header {
  margin-bottom: 20px;
}

h1 {
  margin-bottom: 5px;
}

.subtitle {
  color: #666;
  margin-bottom: 10px;
}

.nav-links a {
  color: #3476df;
  text-decoration: none;
  font-size: 14px;
}

.nav-links a:hover {
  text-decoration: underline;
}

.loading, .empty {
  text-align: center;
  padding: 40px;
  color: #666;
}

.graph-container {
  background: #fafafa;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
}

.graph-svg {
  display: block;
}

.edge {
  stroke: #999;
  stroke-width: 2;
}

.node {
  cursor: pointer;
}

.node circle {
  stroke-width: 3;
  transition: all 0.2s;
}

.node circle.has-image {
  fill: #e3f2fd;
  stroke: #3476df;
}

.node circle.no-image {
  fill: #fff3e0;
  stroke: #ff9800;
}

.node:hover circle {
  stroke-width: 4;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
}

.node-label {
  font-size: 11px;
  font-weight: 500;
  fill: #333;
  pointer-events: none;
}

.legend {
  position: absolute;
  bottom: 10px;
  left: 10px;
  background: white;
  padding: 10px;
  border-radius: 6px;
  font-size: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 5px;
}

.legend-item:last-child {
  margin-bottom: 0;
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid;
}

.legend-dot.has-image {
  background: #e3f2fd;
  border-color: #3476df;
}

.legend-dot.no-image {
  background: #fff3e0;
  border-color: #ff9800;
}

.legend-arrow {
  color: #666;
  font-weight: bold;
}

.page-list {
  margin-top: 30px;
}

.page-list h3 {
  margin-bottom: 15px;
  color: #333;
}

.page-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 10px;
}

.page-item {
  padding: 12px;
  background: #fafafa;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.page-item:hover {
  border-color: #3476df;
  background: #f0f6ff;
}

.page-name {
  display: block;
  font-weight: 600;
  margin-bottom: 4px;
}

.page-links {
  font-size: 12px;
  color: #666;
}
</style>
