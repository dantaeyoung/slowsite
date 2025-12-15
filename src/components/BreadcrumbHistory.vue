<template>
  <div class="breadcrumb-history" v-if="history.length > 0">
    <div class="breadcrumb-trail">
      <span
        v-for="(item, index) in history"
        :key="index"
        class="breadcrumb-item"
      >
        <router-link
          :to="'/' + item.pageId"
          class="breadcrumb-link"
          :class="{ current: index === history.length - 1 }"
          @click="onBreadcrumbClick(index)"
        >
          {{ item.pageId }}
        </router-link>
        <span v-if="index < history.length - 1" class="breadcrumb-arrow">→</span>
      </span>
    </div>
    <button @click="clearHistory" class="clear-btn" title="Clear history">×</button>
  </div>
</template>

<script setup>
import { useNavigationHistory } from '../composables/useNavigationHistory'

const { history, clearHistory, goToHistoryIndex } = useNavigationHistory()

const onBreadcrumbClick = (index) => {
  // If clicking on a previous item, trim history to that point
  if (index < history.value.length - 1) {
    goToHistoryIndex(index)
  }
}
</script>

<style scoped>
.breadcrumb-history {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  background: #f8f8f8;
  border-bottom: 1px solid #eee;
  font-size: 13px;
  overflow-x: auto;
}

.breadcrumb-trail {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 4px;
  min-width: 0;
  overflow-x: auto;
  scrollbar-width: thin;
}

.breadcrumb-item {
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}

.breadcrumb-link {
  color: #3476df;
  text-decoration: none;
  padding: 2px 6px;
  border-radius: 4px;
  transition: background 0.2s;
}

.breadcrumb-link:hover {
  background: #e8f0fe;
}

.breadcrumb-link.current {
  color: #333;
  font-weight: 500;
  background: #e0e0e0;
}

.breadcrumb-arrow {
  color: #999;
  font-size: 11px;
}

.clear-btn {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  padding: 0;
  border: none;
  background: #ddd;
  border-radius: 50%;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  color: #666;
}

.clear-btn:hover {
  background: #ccc;
  color: #333;
}
</style>
