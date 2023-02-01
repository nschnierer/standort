<script lang="ts">
import { generateFingerprint } from "../../utils/generateFingerprint";
import { useUser } from "../../store/useUser";
import { useWebRTCHandler } from "../../store/useWebRTCHandler";

export default {
  name: "App",
  setup: () => {
    const { user } = useUser();
    const { establishConnection, sendOffer, sendData } = useWebRTCHandler();

    return { user, establishConnection, sendOffer, sendData };
  },
  watch: {
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
    onClickSendOffer: function () {
      this.sendOffer(
        "8ef531e2c4d706e25d11378c90387bd2720c3cb32f436f64d9b1574af32438ed"
      );
    },
    onClickSendMessage: function () {
      this.sendData(
        "8ef531e2c4d706e25d11378c90387bd2720c3cb32f436f64d9b1574af32438ed",
        { message: "Next time it's an GeoJSON :)" }
      );
    },
  },
};
</script>

<template>
  <main class="flex-grow">
    <button @click="onClickSendOffer()">Send Offer</button> |
    <button @click="onClickSendMessage()">Send Message</button>
    <router-view></router-view>
  </main>
</template>
