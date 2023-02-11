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
    const { messages } = useWebRTCHandler();

    return { messages };
  },
  watch: {
    messages: {
      handler: function (newMessages: typeof this.messages) {
        console.log("newMessages", newMessages);

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

        Object.keys(newMessages).forEach((id) => {
          if (newMessages[id].length === 0) {
            return;
          }
          const location = newMessages[id][newMessages[id].length - 1] as {
            latitude: number;
            longitude: number;
          };

          if (location?.latitude && location?.longitude) {
            const { latitude, longitude } = location;
            if (this.$data.map) {
              addedMarkers.push(
                L.marker([latitude, longitude]).addTo(this.$data.map)
              );
            }
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
      <div class="w-full p-2">
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
