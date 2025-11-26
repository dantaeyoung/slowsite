import { createRouter, createWebHistory } from 'vue-router'
import CardPage from '../views/CardPage.vue'
import MissingPage from '../views/MissingPage.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: CardPage,
    props: { pageId: 'home' }
  },
  {
    path: '/missing',
    name: 'missing',
    component: MissingPage
  },
  {
    path: '/:pageId',
    name: 'card',
    component: CardPage,
    props: true
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
