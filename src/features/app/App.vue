<script lang="ts">
import { generateFingerprint } from "../../utils/generateFingerprint";
import { useUser } from "../../store/useUser";
import { useWebRTCHandler } from "../../store/useWebRTCHandler";

export default {
  name: "App",
  setup: () => {
    const { user } = useUser();
    const { establishConnection, sendOffer, sendData, peers } =
      useWebRTCHandler();

    return { user, establishConnection, sendOffer, sendData, peers };
  },
  data: (): {
    address: string;
  } => ({
    address: "",
  }),
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
    "user.publicKey": {
      handler: async function (publicKey: typeof this.user.privateKey) {
        if (!publicKey) {
          return;
        }
        const fingerprint = await generateFingerprint(publicKey);
        this.establishConnection(fingerprint);
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
};
</script>

<template>
  <router-view></router-view>
</template>
