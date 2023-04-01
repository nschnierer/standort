<script lang="ts">
import { ref } from "vue";
import L from "leaflet";
import { mapStores } from "pinia";
import { Feature } from "shared-types";
import { formatRelativeTime, formatRelativeTimeDiff } from "~/utils/formatTime";
import {
  useSessionsStore,
  useSessionHandlerStore,
  SessionPerContact,
} from "~/store/useSessionsStore";
import { useContactsStore } from "~/store/useContactsStore";
import { useIdentityStore } from "~/store/useIdentityStore";
import { UserCircleIcon, PlusIcon, XMarkIcon } from "@heroicons/vue/24/solid";

export default {
  name: "Start",
  components: { UserCircleIcon, PlusIcon, XMarkIcon },
  data() {
    return {
      refreshInterval: 0 as number,
      refreshTimeoutMS: (1000 * 30) as number, // 30 seconds
      map: null as L.Map | null,
    };
  },
  setup: () => {
    const mapRef = ref<HTMLDivElement | null>(null);
    return {
      mapRef,
      formatRelativeTime,
      formatRelativeTimeDiff,
    };
  },
  computed: {
    ...mapStores(useIdentityStore),
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

      this.updateMarkers(this.sessionsStore.activeSessionPerContact);
    },
    cancelSession(fingerprint: string) {
      const username = this.contactsStore.getContactUsername(fingerprint);
      if (!username) {
        return;
      }
      const ok = window.confirm(
        `Do you really want to cancel the session with ${username}?`
      );
      if (ok) {
        this.sessionHandlerStore.stopSession(fingerprint);
      }
    },
    updateMarkers(
      sessionPerContact: SessionPerContact,
      myLastPosition?: Feature
    ) {
      const contactMarkers: {
        initials: string;
        time: string;
        position: [number, number];
      }[] = [];

      // Get all contacts which have an active session
      // and send their last position.
      Object.entries(sessionPerContact).forEach(
        ([fingerprint, { incoming }]) => {
          if (incoming && incoming.lastPosition) {
            const [lng, lat] = incoming.lastPosition.geometry.coordinates;
            contactMarkers.push({
              initials: this.contactsStore.getNameInitials(fingerprint),
              time: formatRelativeTime(
                new Date(incoming.lastPosition.properties.createdAt),
                new Date()
              ),
              position: [lat, lng],
            });
          }
        }
      );

      // Clear all markers before adding new ones
      this.map!.eachLayer((layer) => {
        if (layer instanceof L.Marker) {
          this.$data?.map?.removeLayer(layer);
        }
      });

      let addedMarkers: L.Marker[] = [];

      contactMarkers.forEach((contactMarker) => {
        addedMarkers.push(
          L.marker(contactMarker.position, {
            icon: new L.DivIcon({
              className: "contact-marker",
              html: `<div class="marker"><div class="name">${
                contactMarker.initials
              }</div><div class="time">${contactMarker.time
                .replace(" ago", "")
                .replace("Just ", "")}</div></div>`,
            }),
          }).addTo(this.$data.map!)
        );
      });

      if (myLastPosition) {
        const [lng, lat] = myLastPosition.geometry.coordinates;
        addedMarkers.push(
          L.marker([lat, lng], {
            icon: new L.DivIcon({
              className: "me-marker",
              html: `<div class="marker" title="You"><div class="circle"></div></div>`,
            }),
          }).addTo(this.$data.map!)
        );
      }

      if (addedMarkers.length > 0) {
        this.$data?.map?.fitBounds(
          L.featureGroup(addedMarkers).getBounds().pad(0.5)
        );
      }
    },
  },
  watch: {
    "sessionsStore.activeSessionPerContact": {
      handler: function (sessionPerContact: SessionPerContact) {
        this.updateMarkers(sessionPerContact, this.identityStore.lastPosition);
      },
      deep: true,
    },
    "identityStore.lastPosition": {
      handler: function (lastPosition: Feature) {
        this.updateMarkers(
          this.sessionsStore.activeSessionPerContact,
          lastPosition
        );
      },
      deep: true,
    },
  },
  mounted() {
    this.initializeMap();

    // Update the list of active sessions every 30 seconds
    this.refreshInterval = window.setInterval(() => {
      this.$forceUpdate();
      this.updateMarkers(
        this.sessionsStore.activeSessionPerContact,
        this.identityStore.lastPosition
      );
    }, this.refreshTimeoutMS);
  },
  beforeUnmount() {
    clearInterval(this.refreshInterval);
  },
};
</script>

<style>
@import "leaflet/dist/leaflet.css";

.me-marker .marker {
  @apply w-8 h-8 rounded-full flex items-center justify-center bg-violet-500;
}
.me-marker .marker .circle {
  @apply w-5 h-5 rounded-full bg-purple-300;
}

.contact-marker .marker {
  @apply w-10 h-10 rounded-full flex flex-col items-center justify-center bg-violet-500 text-white text-base;
}

.contact-marker .marker .name {
  @apply text-sm leading-tight mt-1;
}

.contact-marker .marker .time {
  @apply leading-tight -mt-0.5;
  font-size: 10px;
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
      <router-link
        to="/identity"
        aria-label="Identity"
        class="h-full flex items-center"
      >
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
          aria-label="Add contact"
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
          <div class="flex items-center">
            <div class="flex-1">
              <h2 class="text-md font-bold">
                {{ contactsStore.getContactUsername(contactFingerprint) }}
                <span>{{ contactFingerprint.slice(0, 8) }}</span>
              </h2>

              <div class="backdrop:text-sm">
                <p v-if="incoming" class="text-violet-600">
                  Shares locations for
                  {{
                    formatRelativeTimeDiff(new Date(), new Date(incoming.end))
                  }}
                </p>
                <p v-if="!incoming" class="text-gray-500">
                  Shares no locations with you
                </p>
                <p v-if="outgoing" class="text-violet-600">
                  You share locations for
                  {{
                    formatRelativeTimeDiff(new Date(), new Date(outgoing.end))
                  }}
                </p>
                <p v-if="!outgoing" class="text-gray-500">
                  You are not sharing locations
                </p>
              </div>
            </div>
            <div>
              <button
                class="py-2 pl-2"
                @click="cancelSession(contactFingerprint)"
              >
                <XMarkIcon class="h-6 w-6 text-purple-700" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
