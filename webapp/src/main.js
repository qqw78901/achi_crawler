import Vue from 'vue'
import App from './App.vue'
import MuseUI from 'muse-ui'
import axios from 'axios'
import api from './api'
import 'muse-ui/dist/muse-ui.css'
import 'muse-ui/dist/theme-teal.css' 
Vue.use(MuseUI)
Vue.http = Vue.prototype.$http = axios;
Vue.api = Vue.prototype.$api = api;
import router from './router'
new Vue({
  el: '#app',
  router,
  render: h => h(App)
})
