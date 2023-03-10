import { createApp, watch } from "vue";
import adapter from "webrtc-adapter";
import { createRouter, createWebHashHistory, RouteRecordRaw } from "vue-router";
import { createPinia } from "pinia";
import localforage from "localforage";
import "./style.css";
import App from "./features/app/App.vue";
import Start from "./features/start/Start.vue";
import Intro from "./features/intro/Intro.vue";
import Setup from "./features/intro/Setup.vue";
import Identity from "./features/identity/Identity.vue";
import Contacts from "./features/contact/Contacts.vue";
import ContactAdd from "./features/contact/ContactAdd.vue";
import AppBar from "./components/AppBar.vue";
import SquaresBackground from "./components/SquaresBackground.vue";
import QRCodeImage from "./components/QRCodeImage.vue";
import LoadingCircle from "./components/LoadingCircle.vue";

import { Identity as IdentityStore } from "~/store/useIdentityStore";

const routes: RouteRecordRaw[] = [
  { path: "", component: Start },
  { path: "/intro", component: Intro },
  { path: "/setup", component: Setup },
  { path: "/identity", component: Identity },
  { path: "/contacts", component: Contacts },
  { path: "/contacts/add", component: ContactAdd },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

const pinia = createPinia();

const app = createApp(App);

// Global components
app.component("AppBar", AppBar);
app.component("SquaresBackground", SquaresBackground);
app.component("QRCodeImage", QRCodeImage);
app.component("LoadingCircle", LoadingCircle);

app.use(router);
app.use(pinia);

const appState = localforage.createInstance({
  name: "standort-state",
});

let rehydrateFinished = false;

appState
  .getItem<{ identity: IdentityStore }>("data")
  .then((data) => {
    if (data) {
      pinia.state.value = data;
      console.log("Rehydrated state", data);
    }
  })
  .catch((err) => {
    console.log("Unable to load state", err);
  })
  .finally(() => {
    rehydrateFinished = true;
    app.mount("#app");
  });

watch(
  pinia.state,
  (state) => {
    if (!rehydrateFinished) {
      return;
    }
    const pureObject = JSON.parse(JSON.stringify(state)) as {
      [store: string]: object;
    };

    const { identity, sessions } = pureObject;

    console.log("Persist state", { identity, sessions });
    appState.setItem("data", pureObject).catch((err) => {
      console.log("Unable to save state", err);
    });
  },
  { deep: true }
);
