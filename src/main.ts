import { createApp, h } from "vue";
import "./style.css";
import { createRouter, createWebHashHistory, RouteRecordRaw } from "vue-router";
import App from "./features/app/App.vue";
import Start from "./features/start/Start.vue";
import Contacts from "./features/contact/Contacts.vue";
import AppBar from "./components/AppBar.vue";

const routes: RouteRecordRaw[] = [
  { path: "", component: Start },
  { path: "/contacts", component: Contacts },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

const app = createApp(App);

// Global components
app.component("AppBar", AppBar);

app.use(router);

app.mount("#app");
