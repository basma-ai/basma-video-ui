const colors = require('vuetify/es5/util/colors').default

module.exports = {
  mode: 'spa',

  env: {
    // api_url: 'https://video-api.basma.ai',
    // api_url: 'http://localhost:1061',
    api_url: 'https://3cf5a986.ngrok.io',
  },

  server: {
    port: 3300, // default: 3000
    host: '0.0.0.0' // default: localhost
  },

  /*
  ** Headers of the page
  */
  head: {
    titleTemplate: '%s',
    title: 'Basma Video',
    meta: [
      {charset: 'utf-8'},
      {name: 'viewport', content: 'width=device-width, initial-scale=1'},
      {hid: 'description', name: 'description', content: 'Chat via Video'}
    ],
    link: [
      {rel: 'icon', type: 'image/x-icon', href: '/favicon.ico'}
    ]
  },
  /*
  ** Customize the progress-bar color
  */
  loading: {color: '#fff'},
  /*
  ** Global CSS
  */
  css: [
    '~/assets/css/style.scss',
  ],
  /*
  ** Plugins to load before mounting the App
  */
  plugins: [
    {
      src: '~/plugins/vuetify',
      ssr: false
    },
    {
      src: '~/plugins/socket.io',
      ssr: false
    },
  ],
  /*
  ** Nuxt.js dev-modules
  */
  buildModules: [
    '@nuxtjs/vuetify'
  ],
  /*
  ** Nuxt.js modules
  */
  modules: [
    // Doc: https://axios.nuxtjs.org/usage
    '@nuxtjs/axios',
    'vue-web-cam/nuxt',
    // 'nuxt-socket-io'
  ],
  /*
  ** Axios module configuration
  ** See https://axios.nuxtjs.org/options
  */
  axios: {},
  /*
  ** Socket.io module configuration
  ** See https://github.com/richardeschloss/nuxt-socket-io#configuration-io-sockets-
  */
  // io: {
  //   sockets: [
  //     {
  //       name: 'home',
  //       url: 'http://localhost:1061',
  //       default: true,
  //       vuex: { // optional
  //         mutations: [{progress: 'examples/SET_PROGRESS'}], // pass in the evt --> mutation map OR array of actions
  //         actions: [{chatMessage: 'FORMAT_MESSAGE'}, 'SOMETHING_ELSE'], // pass in the evt --> action map OR array of actions or mixed!,
  //         emitBacks: ['examples/sample', {'examples/sample2': 'sample2'}] // pass in the state props you want to listen for changes on. When those props thance, they'll fire these "emitBack" events. If the emitBack is a string, it will send the string, otherwise, if it's an object, it will send the mapped string. (see the updated examples in the page/examples.vue, where I also use a "mapState2Way" function in the component).
  //       },
  //       namespaces: {
  //         '/index': {
  //           emitters: ['getMessage2 + testMsg --> message2Rxd'],
  //           listeners: ['chatMessage2', 'chatMessage3 --> message3Rxd']
  //         },
  //         '/examples': {
  //           emitBacks: ['sample3', 'sample4 <-- myObj.sample4'],
  //           emitters: [
  //             'reset] getProgress + refreshInfo --> progress [handleDone'
  //           ],
  //           listeners: ['progress']
  //         }
  //       }
  //     }
  //   ]
  // },
  /*
  ** vuetify module configuration
  ** https://github.com/nuxt-community/vuetify-module
  */
  vuetify: {
    customVariables: ['~/assets/css/variables.scss'],
    theme: {
      dark: false,
      themes: {
        dark: {
          primary: colors.blue.darken2,
          accent: colors.grey.darken3,
          secondary: colors.amber.darken3,
          info: colors.teal.lighten1,
          warning: colors.amber.base,
          error: colors.deepOrange.accent4,
          success: colors.green.accent3
        }
      }
    }
  },
  /*
  ** Build configuration
  */
  build: {
    /*
    ** You can extend webpack config here
    */
    extend(config, ctx) {
    }
  }
}
