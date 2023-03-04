<script lang="ts">
import { mapStores } from "pinia";
import { FeatureCollection } from "shared-types";
import { useIdentityStore } from "~/store/useIdentityStore";
import { useSessionHandlerStore } from "~/store/useSessionsStore";

export default {
  name: "App",
  data: (): {
    address: string;
    lastFeatureCollection: FeatureCollection | null;
  } => ({
    address: "",
    lastFeatureCollection: null,
  }),
  computed: {
    ...mapStores(useIdentityStore),
    ...mapStores(useSessionHandlerStore),
  },
  methods: {
    watchPositionSuccess: function (position: GeolocationPosition) {
      const { latitude, longitude } = position.coords;
      const featureCollection: FeatureCollection = {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: {},
            geometry: {
              type: "Point",
              coordinates: [longitude, latitude],
            },
          },
        ],
      };
      this.lastFeatureCollection = featureCollection;
      this.sessionHandlerStore.sendToSessions(featureCollection);
      console.log("watchPositionSuccess called", { latitude, longitude });
    },
    watchPositionError: function (error: GeolocationPositionError) {
      console.error(error);
    },
    sendLastPosition: function () {
      if (this.lastFeatureCollection) {
        this.sessionHandlerStore.sendToSessions(this.lastFeatureCollection);
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
  },
};
</script>

<template>
  <router-view></router-view>
</template>
