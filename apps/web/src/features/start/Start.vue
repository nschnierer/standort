<script lang="ts">
import { ref } from "vue";
import L from "leaflet";
import { mapStores } from "pinia";
import { formatRelativeTimeDiff } from "~/utils/formatTime";
import {
  useSessionsStore,
  useSessionHandlerStore,
} from "~/store/useSessionsStore";
import { useContactsStore } from "~/store/useContacts";
import { UserCircleIcon, PlusIcon } from "@heroicons/vue/24/solid";

export default {
  name: "Start",
  components: { UserCircleIcon, PlusIcon },
  data: (): {
    refreshInterval: number;
    refreshTimeoutMS: number;
    map: null | L.Map;
  } => ({
    refreshInterval: 0,
    refreshTimeoutMS: 1000 * 30, // 30 seconds
    map: null,
  }),
  setup: () => {
    const mapRef = ref<HTMLDivElement | null>(null);
    return {
      mapRef,
      formatRelativeTimeDiff,
    };
  },
  computed: {
    ...mapStores(useSessionsStore),
    ...mapStores(useSessionHandlerStore),
    ...mapStores(useContactsStore),
  },
  methods: {
    initializeMap() {
      if (!this.mapRef) {
        return;
      }
      this.$data.map = L.map(this.mapRef).setView([50.8742, 9], 4);
      // Add a tile layer to the map
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '<a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(this.$data.map);
    },
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
          const feature = session.lastPosition;
          const [lng, lat] = feature.geometry.coordinates;

          if (this.$data.map) {
            addedMarkers.push(
              L.marker([lat, lng], {
                icon: new L.DivIcon({
                  className: "contact-marker",
                  html: `<div class="marker">NO</div>`,
                }),
              }).addTo(this.$data.map)
            );
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
    this.initializeMap();

    // Update the list of active sessions every 30 seconds
    this.refreshInterval = window.setInterval(() => {
      this.$forceUpdate();
    }, this.refreshTimeoutMS);
  },
  beforeUnmount() {
    clearInterval(this.refreshInterval);
  },
};
</script>

<style>
@import "leaflet/dist/leaflet.css";

.contact-marker .marker {
  @apply w-10 h-10 rounded-full flex items-center justify-center bg-violet-500 text-white text-base;
}

@media screen(lg) {
  .list-wrapper {
    min-width: 400px;
  }
}
</style>

<template>
  <AppBar title="standort.live">
    <template v-slot:right>
      <router-link to="/user" class="h-full flex items-center">
        <UserCircleIcon class="h-10 w-10 text-white" />
      </router-link>
    </template>
  </AppBar>
  <div
    class="flex flex-col lg:flex-row-reverse w-full h-full show-active-sessions"
  >
    <div ref="mapRef" class="w-full h-3/5 lg:flex-1 lg:h-full"></div>
    <div
      class="flex flex-col relative h-2/5 lg:h-full bg-white shadow-3xl border-t-4 border-violet-500 list-wrapper"
    >
      <div class="absolute z-10 bottom-2 right-2">
        <router-link
          to="/contacts"
          class="flex justify-center items-center bg-violet-500 rounded-full p-1"
        >
          <PlusIcon class="h-10 w-10 text-white" />
        </router-link>
      </div>

      <div
        v-if="sessionsStore.activeSessions.length === 0"
        class="flex flex-1 flex-col space-y-2 w-full justify-center items-center italic text-gray-500 p-2 text-center"
      >
        <p>No active sharing sessions.</p>
        <p v-if="contactsStore.contacts.length < 1">
          Add contact by clicking the plus button.
        </p>
      </div>

      <div
        class="flex flex-col flex-1 w-full relative overflow-y-auto pb-16 space-y-2"
        v-if="sessionsStore.activeSessions.length > 0"
      >
        <div
          class="leading-tight border-b p-2"
          v-for="[contactFingerprint, { incoming, outgoing }] in Object.entries(
            sessionsStore.activeSessionPerContact
          )"
          :key="contactFingerprint"
        >
          <h2 class="text-md font-bold">
            {{ contactsStore.getContactUsername(contactFingerprint) }}
            <span>{{ contactFingerprint.slice(0, 8) }}</span>
          </h2>
          <div class="text-sm">
            <p v-if="incoming" class="text-violet-600">
              Shares locations for
              {{ formatRelativeTimeDiff(new Date(), new Date(incoming.end)) }}
            </p>
            <p v-if="!incoming" class="text-gray-500">
              Shares no locations with you
            </p>
            <p v-if="outgoing" class="text-violet-600">
              You share locations for
              {{ formatRelativeTimeDiff(new Date(), new Date(outgoing.end)) }}
            </p>
            <p v-if="!outgoing" class="text-gray-500">
              You are not sharing locations
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
