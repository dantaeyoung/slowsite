import { createRouter, createWebHistory } from 'vue-router'
import CardPage from '../views/CardPage.vue'
import MissingPage from '../views/MissingPage.vue'
import UploadPage from '../views/UploadPage.vue'
import AdminPage from '../views/AdminPage.vue'
import AdminGraphPage from '../views/AdminGraphPage.vue'

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
    path: '/upload',
    name: 'upload',
    component: UploadPage
  },
  {
    path: '/admin',
    name: 'admin',
    component: AdminPage
  },
  {
    path: '/admin/graph',
    name: 'admin-graph',
    component: AdminGraphPage
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
