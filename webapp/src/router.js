import Vue from 'vue'
import Router from 'vue-router'
Vue.use(Router)
import Index from './components/index.vue';
import Result from './components/Result.vue';
let router = new Router({
    routes:[
        {
            path: '/',
            name: 'Index',
            component: Index
        },
        {
            path: '/result',
            name: 'Result',
            component: Result
        }

    ]
});

export default router