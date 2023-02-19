<script lang="ts">
import { mapStores } from "pinia";
import { useIdentityStore } from "~/store/useIdentityStore";
import { useWebRTCHandler } from "../../store/useWebRTCHandler";

export default {
  name: "App",
  setup: () => {
    const { establishConnection, sendOffer, sendData, peers } =
      useWebRTCHandler();

    return { establishConnection, sendOffer, sendData, peers };
  },
  data: (): {
    address: string;
  } => ({
    address: "",
  }),
  computed: {
    ...mapStores(useIdentityStore),
  },
  watch: {
    peers: {
      handler: async function (peers: typeof this.peers) {
        if (Object.keys(peers).length > 0) {
          navigator.geolocation.watchPosition(
            this.watchPositionSuccess,
            this.watchPositionError
          );
        }
      },
      deep: true,
    },
  },
  methods: {
    watchPositionSuccess: function (position: GeolocationPosition) {
      console.log("watchPositionSuccess called");
      Object.keys(this.peers).forEach((peerId) => {
        this.sendData(peerId, {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      });
    },
    watchPositionError: function (error: GeolocationPositionError) {
      console.error(error);
    },
    onClickSendOffer: function () {
      this.sendOffer(this.$data.address);
    },
    onClickSendMessage: function () {
      this.sendData(this.$data.address, {
        message: "Next time it's an GeoJSON :)",
      });
    },
  },
  mounted: async function () {
    this.establishConnection(this.identityStore.fingerprint);
    console.log(this.identityStore.username);
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
