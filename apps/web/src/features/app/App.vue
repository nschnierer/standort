<script lang="ts">
import { mapStores } from "pinia";
import { Feature } from "shared-types";
import { useIdentityStore } from "~/store/useIdentityStore";
import { useSessionHandlerStore } from "~/store/useSessionsStore";

export default {
  name: "App",
  data: (): {
    address: string;
    lastPosition: Feature | null;
  } => ({
    address: "",
    lastPosition: null,
  }),
  computed: {
    ...mapStores(useIdentityStore),
    ...mapStores(useSessionHandlerStore),
  },
  methods: {
    watchPositionSuccess: function (position: GeolocationPosition) {
      const { latitude, longitude } = position.coords;
      const feature: Feature = {
        type: "Feature",
        properties: {
          createdAt: new Date(position.timestamp),
        },
        geometry: {
          type: "Point",
          coordinates: [longitude, latitude],
        },
      };
      this.lastPosition = feature;
      this.sessionHandlerStore.sendToSessions(feature);
      console.log("watchPositionSuccess called", { latitude, longitude });
    },
    watchPositionError: function (error: GeolocationPositionError) {
      console.error(error);
    },
    sendLastPosition: function () {
      if (this.lastPosition) {
        this.sessionHandlerStore.sendToSessions(this.lastPosition);
      }
    },
  },
  mounted: async function () {
    if (this.identityStore.fingerprint) {
      // Connect to signaling server
      this.sessionHandlerStore.start(this.identityStore.fingerprint);

      navigator.geolocation.watchPosition(
        this.watchPositionSuccess,
        this.watchPositionError
      );

      // TODO: clean this up
      setInterval(() => {
        this.sendLastPosition();
      }, 5000);
    }

    if (
      this.identityStore.username === "" &&
      this.$route.path !== "/intro" &&
      this.$route.path !== "/setup"
    ) {
      this.$router.push("/intro");
    }

    this.$nextTick(() => {
      window.dispatchEvent(new Event("vue-render-complete"));
    });
  },
};
</script>

<template>
  <router-view></router-view>
</template>
