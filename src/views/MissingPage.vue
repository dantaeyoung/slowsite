<template>
  <div class="missing-page">
    <div class="message-card">
      <h1>{{ message }}</h1>
      <p class="detail">{{ detail }}</p>
      <router-link to="/" class="home-link">← Back to home</router-link>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const messages = [
  {
    main: "This page is still in the sketchbook...",
    detail: "The artist has been notified of your curiosity."
  },
  {
    main: "The ink is still drying here...",
    detail: "Check back soon to see what emerges."
  },
  {
    main: "Check back soon - this card is being drawn...",
    detail: "Your interest helps guide what gets created next."
  },
  {
    main: "You've discovered an unfinished corner...",
    detail: "This page is growing slowly, based on visitor interest."
  },
  {
    main: "The artist has been notified of your interest!",
    detail: "Popular destinations get drawn first."
  },
  {
    main: "This room hasn't been sketched yet...",
    detail: "But it might be soon, thanks to explorers like you."
  }
]

// Pick a random message (could be based on zone label or random)
const selectedMessage = computed(() => {
  const index = Math.floor(Math.random() * messages.length)
  return messages[index]
})

const message = computed(() => selectedMessage.value.main)
const detail = computed(() => selectedMessage.value.detail)

const zoneLabel = computed(() => route.query.label)
const fromPage = computed(() => route.query.from)
</script>

<style scoped>
.missing-page {
  width: 100%;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e3e8ef 100%);
}

.message-card {
  max-width: 600px;
  padding: 60px 40px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  text-align: center;
  border: 3px dashed #3476df;
}

h1 {
  font-size: 28px;
  color: #3476df;
  margin-bottom: 20px;
  font-weight: 400;
  line-height: 1.4;
}

.detail {
  font-size: 16px;
  color: #666;
  margin-bottom: 40px;
  line-height: 1.6;
}

.home-link {
  display: inline-block;
  padding: 12px 24px;
  background: #3476df;
  color: white;
  text-decoration: none;
  border-radius: 6px;
  transition: background 0.2s ease;
}

.home-link:hover {
  background: #2861c4;
}
</style>
