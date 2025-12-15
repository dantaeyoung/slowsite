<template>
  <div class="page-graph" ref="container">
    <div v-if="loading" class="loading">Loading graph...</div>

    <div v-else-if="nodes.length === 0" class="empty">
      No pages found.
    </div>

    <svg
      v-else
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
          @click="$emit('nodeClick', node.id)"
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { database } from '../firebase'
import { ref as dbRef, get } from 'firebase/database'

const props = defineProps({
  width: {
    type: Number,
    default: 400
  },
  height: {
    type: Number,
    default: 350
  }
})

const emit = defineEmits(['nodeClick'])

const loading = ref(true)
const pages = ref({})
const container = ref(null)
const svgWidth = ref(props.width)
const svgHeight = ref(props.height)
const nodeRadius = 30

onMounted(async () => {
  await fetchPages()
  updateSize()
  window.addEventListener('resize', updateSize)
  loading.value = false
})

onUnmounted(() => {
  window.removeEventListener('resize', updateSize)
})

watch(() => [props.width, props.height], () => {
  updateSize()
})

const updateSize = () => {
  if (container.value) {
    svgWidth.value = Math.max(200, container.value.clientWidth)
    svgHeight.value = props.height
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
  const radius = Math.min(svgWidth.value, svgHeight.value) / 2 - 60

  return nodeList.map((node, i) => {
    const angle = (2 * Math.PI * i) / nodeList.length - Math.PI / 2
    return {
      ...node,
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle)
    }
  })
})

// Calculate edge positions
const edges = computed(() => {
  const nodePositions = {}
  nodes.value.forEach(n => {
    nodePositions[n.id] = { x: n.x, y: n.y }
  })

  return graphData.value.edges.map(edge => {
    const source = nodePositions[edge.source]
    const target = nodePositions[edge.target]

    if (!source || !target) return null

    const dx = target.x - source.x
    const dy = target.y - source.y
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (dist === 0) return null

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
</script>

<style scoped>
.page-graph {
  width: 100%;
  background: #fafafa;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
}

.loading, .empty {
  padding: 40px;
  text-align: center;
  color: #666;
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
  font-size: 10px;
  font-weight: 500;
  fill: #333;
  pointer-events: none;
}
</style>
