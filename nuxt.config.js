export default {
  // Global page headers: https://go.nuxtjs.dev/config-head
  head: {
    title: 'slowsite',
    htmlAttrs: {
      lang: 'en'
    },
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: '' },
      { name: 'format-detection', content: 'telephone=no' }
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
    ]
  },

  // Global CSS: https://go.nuxtjs.dev/config-css
  css: [
  ],

  // Plugins to run before rendering page: https://go.nuxtjs.dev/config-plugins
  plugins: [
  ],

  // Auto import components: https://go.nuxtjs.dev/config-components
  components: true,

  // Modules for dev and build (recommended): https://go.nuxtjs.dev/config-modules
  buildModules: [
    '@nuxtjs/google-fonts',
  ],

  // Modules: https://go.nuxtjs.dev/config-modules
  modules: [
    // https://go.nuxtjs.dev/content
    '@nuxt/content',
    '@nuxtjs/firebase',
    
  ],

  // Content module configuration: https://go.nuxtjs.dev/config-content
  content: {},

  // Build Configuration: https://go.nuxtjs.dev/config-build
  build: {
  },

  families: {
    download:true,
    'Overpass Mono': [300, 400, 600],
  },
    firebase:{
      config: {
        apiKey: process.env.fb_apiKey,
        authDomain: process.env.fb_authDomain,
        databaseURL: process.env.fb_databaseURL,
        projectId: process.env.fb_projectId,
        storageBucket: process.env.fb_storageBucket,
        messagingSenderId: process.env.fb_messagingSenderId,
        appId: process.env.fb_appId,
      },
      services: {
        database: true,
      }
    },

}
