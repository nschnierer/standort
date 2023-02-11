import { createApp, h } from "vue";
import adapter from "webrtc-adapter";
import { createRouter, createWebHashHistory, RouteRecordRaw } from "vue-router";
import "./style.css";
import App from "./features/app/App.vue";
import Start from "./features/start/Start.vue";
import User from "./features/user/User.vue";
import Contacts from "./features/contact/Contacts.vue";
import ContactAdd from "./features/contact/ContactAdd.vue";
import AppBar from "./components/AppBar.vue";

const routes: RouteRecordRaw[] = [
  { path: "", component: Start },
  { path: "/user", component: User },
  { path: "/contacts", component: Contacts },
  { path: "/contacts/add", component: ContactAdd },
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
