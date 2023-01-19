<script lang="ts">
import L from "leaflet";
import { useWebRTCHandler } from "../../store/useWebRTCHandler";
import { UserCircleIcon } from "@heroicons/vue/24/solid";

export default {
  name: "Start",
  components: { UserCircleIcon },
  data() {
    return {
      map: null,
    } as { map: null | L.Map };
  },
  setup() {
    const { connected, connect } = useWebRTCHandler();

    return { connected, connect };
  },
  mounted() {
    // Create the map
    this.$data.map = L.map("map").setView([51.505, -0.09], 13);
    // Add a tile layer to the map
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '<a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(this.$data.map);
  },
};
</script>

<style>
@import "leaflet/dist/leaflet.css";
</style>

<template>
  <AppBar title="Contacts">
    <template v-slot:right>
      <router-link to="/user" class="h-full px-2 flex items-center">
        <UserCircleIcon class="h-10 w-10 text-white" />
      </router-link>
    </template>
  </AppBar>
  <div class="flex w-full">
    <div id="map" class="absolute z-0 w-full bottom-8 top-16"></div>
    <div
      class="absolute bottom-0 z-10 flex w-full h-20 bg-white rounded-b-none shadow-2xl rounded-2xl"
    >
      <div class="w-full p-2">
        <router-link
          to="/contacts"
          class="flex justify-center w-full px-4 py-4 font-bold text-white bg-blue-500 rounded"
        >
          Share locations
        </router-link>
      </div>
    </div>
  </div>
</template>
