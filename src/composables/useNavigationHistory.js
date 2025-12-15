import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'

// Shared history state (persists across components)
const history = ref([])

// Load from sessionStorage on init
const stored = sessionStorage.getItem('navHistory')
if (stored) {
  try {
    history.value = JSON.parse(stored)
  } catch (e) {
    history.value = []
  }
}

// Save to sessionStorage on changes
watch(history, (val) => {
  sessionStorage.setItem('navHistory', JSON.stringify(val))
}, { deep: true })

export function useNavigationHistory() {
  const route = useRoute()

  const addToHistory = (pageId) => {
    if (!pageId) return

    // Add to history (allow duplicates for loops)
    history.value.push({
      pageId,
      timestamp: Date.now()
    })

    // Limit history length to prevent it getting too long
    if (history.value.length > 50) {
      history.value = history.value.slice(-50)
    }
  }

  const clearHistory = () => {
    history.value = []
    sessionStorage.removeItem('navHistory')
  }

  const goToHistoryIndex = (index) => {
    // Trim history to that point (remove everything after)
    history.value = history.value.slice(0, index + 1)
  }

  return {
    history,
    addToHistory,
    clearHistory,
    goToHistoryIndex
  }
}
