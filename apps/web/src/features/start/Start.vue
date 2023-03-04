<script lang="ts">
import L from "leaflet";
import { mapStores } from "pinia";
import {
  useSessionsStore,
  useSessionHandlerStore,
} from "~/store/useSessionsStore";
import { UserCircleIcon } from "@heroicons/vue/24/solid";

export default {
  name: "Start",
  components: { UserCircleIcon },
  data() {
    return {
      map: null,
    } as { map: null | L.Map };
  },
  computed: {
    ...mapStores(useSessionsStore),
    ...mapStores(useSessionHandlerStore),
  },
  watch: {
    "sessionsStore.sessions": {
      handler: function (sessions: typeof this.sessionsStore.sessions) {
        if (!this.$data.map) {
          return null;
        }

        // Clear all markers before adding new ones
        this.$data.map.eachLayer((layer) => {
          if (layer instanceof L.Marker) {
            this.$data?.map?.removeLayer(layer);
          }
        });

        let addedMarkers: L.Marker[] = [];

        sessions.forEach((session) => {
          if (!session.lastPosition) {
            return;
          }
          const [feature] = session.lastPosition!.features;
          const lat = feature.geometry.coordinates[1];
          const lng = feature.geometry.coordinates[0];

          if (this.$data.map) {
            addedMarkers.push(L.marker([lat, lng]).addTo(this.$data.map));
          }
        });

        if (addedMarkers.length > 0) {
          this.$data?.map?.fitBounds(
            L.featureGroup(addedMarkers).getBounds().pad(0.5)
          );
        }
      },
      deep: true,
    },
  },
  mounted() {
    // Create the map

    this.$data.map = L.map("map").setView([50.8742, 9], 4);
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
  <AppBar title="WebRTC">
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
      <div class="flex w-full p-2 space-x-2 items-center">
        <button
          v-if="sessionsStore.activeSessions.length > 0"
          class="flex w-24 justify-center px-4 py-4 font-bold text-white bg-violet-500 rounded"
          @click="sessionHandlerStore.stopSessions"
        >
          Stop
        </button>
        <router-link
          to="/contacts"
          class="flex justify-center w-full px-4 py-4 font-bold text-white bg-violet-500 rounded"
        >
          Share locations
        </router-link>
      </div>
    </div>
  </div>
</template>
