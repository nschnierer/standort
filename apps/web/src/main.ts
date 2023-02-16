import { createApp, h } from "vue";
import adapter from "webrtc-adapter";
import { createRouter, createWebHashHistory, RouteRecordRaw } from "vue-router";
import "./style.css";
import App from "./features/app/App.vue";
import Start from "./features/start/Start.vue";
import Intro from "./features/intro/Intro.vue";
import Setup from "./features/intro/Setup.vue";
import User from "./features/user/User.vue";
import Contacts from "./features/contact/Contacts.vue";
import ContactAdd from "./features/contact/ContactAdd.vue";
import AppBar from "./components/AppBar.vue";
import SquaresBackground from "./components/SquaresBackground.vue";

const routes: RouteRecordRaw[] = [
  { path: "", component: Start },
  { path: "/intro", component: Intro },
  { path: "/setup", component: Setup },
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
app.component("SquaresBackground", SquaresBackground);

app.use(router);

app.mount("#app");
