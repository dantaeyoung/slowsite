<template>
  <div class="card-page">
    <div v-if="loading" class="loading">
      <p>Loading card...</p>
    </div>

    <div v-else-if="error" class="error">
      <p>{{ error }}</p>
    </div>

    <CardViewer v-else-if="pageData" :pageData="pageData" />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { database } from '../firebase'
import { ref as dbRef, get } from 'firebase/database'
import CardViewer from '../components/CardViewer.vue'

const props = defineProps({
  pageId: {
    type: String,
    default: 'home'
  }
})

const route = useRoute()
const loading = ref(true)
const error = ref(null)
const pageData = ref(null)

const fetchPageData = async (id) => {
  loading.value = true
  error.value = null

  try {
    const pageRef = dbRef(database, `pages/${id}`)
    const snapshot = await get(pageRef)

    if (snapshot.exists()) {
      pageData.value = {
        pageId: id,
        ...snapshot.val()
      }
    } else {
      error.value = `Page "${id}" not found`
    }
  } catch (err) {
    console.error('Error fetching page:', err)
    error.value = 'Failed to load page data'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchPageData(props.pageId)
})

// Watch for route changes
watch(() => route.params.pageId, (newId) => {
  if (newId) {
    fetchPageData(newId)
  }
})
</script>

<style scoped>
.card-page {
  width: 100%;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
}

.loading,
.error {
  text-align: center;
  padding: 40px;
  font-size: 18px;
}

.error {
  color: #d32f2f;
}
</style>
