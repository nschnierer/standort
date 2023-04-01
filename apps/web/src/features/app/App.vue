<script lang="ts">
import { mapStores } from "pinia";
import { Feature } from "shared-types";
import { useIdentityStore } from "~/store/useIdentityStore";
import {
  useSessionsStore,
  useSessionHandlerStore,
  SessionPerContact,
} from "~/store/useSessionsStore";

export default {
  name: "App",
  data: (): {
    lastPosition: Feature | null;
    watchPositionId: number;
  } => ({
    lastPosition: null,
    watchPositionId: 0,
  }),
  computed: {
    ...mapStores(useSessionsStore),
    ...mapStores(useIdentityStore),
    ...mapStores(useSessionHandlerStore),
  },
  watch: {
    "sessionsStore.activeSessionPerContact": {
      handler: function (sessionPerContact: SessionPerContact) {
        this.registerWatchPosition(sessionPerContact);
      },
      deep: true,
    },
  },
  methods: {
    registerWatchPosition: function (sessions: SessionPerContact) {
      const someActiveOutgoing = Object.values(sessions).some(
        (session) => session.outgoing
      );

      if (someActiveOutgoing && !this.watchPositionId) {
        // Start watching position
        this.watchPositionId = navigator.geolocation.watchPosition(
          this.watchPositionSuccess,
          this.watchPositionError
        );
      } else if (!someActiveOutgoing && this.watchPositionId) {
        // Stop watching position
        navigator.geolocation.clearWatch(this.watchPositionId);
        this.watchPositionId = 0;
      }
    },
    /**
     * Handler for geolocation watchPosition
     * @param position GeoLocationPosition
     */
    watchPositionSuccess: function (position: GeolocationPosition) {
      const { latitude, longitude } = position.coords;
      const feature: Feature = {
        type: "Feature",
        properties: {
          createdAt: new Date(position.timestamp).toISOString(),
        },
        geometry: {
          type: "Point",
          coordinates: [longitude, latitude],
        },
      };
      this.identityStore.setLastPosition(feature);
      this.sessionHandlerStore.sendToSessions(feature);
      console.log("watchPositionSuccess called", { latitude, longitude });
    },
    /**
     * Handler for geolocation watchPosition error
     * @param error GeolocationPositionError
     */
    watchPositionError: function (error: GeolocationPositionError) {
      console.error("watchPositionError", error);
    },
    sendLastPosition: function () {
      if (this.identityStore.lastPosition) {
        this.sessionHandlerStore.sendToSessions(
          this.identityStore.lastPosition
        );
      }
    },
  },
  mounted: async function () {
    if (this.identityStore.fingerprint) {
      // Connect to signaling server
      this.sessionHandlerStore.start(this.identityStore.fingerprint);
      this.registerWatchPosition(this.sessionsStore.activeSessionPerContact);
    }

    if (
      this.identityStore.username === "" &&
      this.$route.path !== "/intro" &&
      this.$route.path !== "/setup"
    ) {
      this.$router.push("/intro");
    }
  },
  beforeUnmount: function () {
    if (this.watchPositionId) {
      navigator.geolocation.clearWatch(this.watchPositionId);
    }
  },
};
</script>

<template>
  <router-view></router-view>
</template>
