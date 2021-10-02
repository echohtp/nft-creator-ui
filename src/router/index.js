import Vue from 'vue';
import VueRouter from 'vue-router';
import Home from '../views/Home.vue';
import Error404 from '../views/Error404.vue';

Vue.use(VueRouter);

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
  },
  { path: '*', name: 'Error404', component: Error404 },
];

const router = new VueRouter({
  mode: 'hash',
  base: process.env.BASE_URL,
  routes,
});

export default router;
