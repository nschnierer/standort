<script lang="ts">
import { ref } from "vue";
import QRCode from "qrcode";

export default {
  name: "User",
  data: (): { publicKey: string; username: string } => ({
    publicKey: "",
    username: "Nobert",
  }),
  setup() {
    const canvasRef = ref<HTMLCanvasElement | null>(null);
    return { canvasRef };
  },
  mounted: function () {
    console.log(this.canvasRef);
  },
  methods: {
    onClickGenerateMyKey: async function () {
      const key = await crypto.subtle.generateKey(
        {
          name: "RSASSA-PKCS1-v1_5",
          modulusLength: 2048,
          publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
          hash: { name: "SHA-256" },
        },
        true,
        ["sign", "verify"]
      );

      const exportedKey = await crypto.subtle.exportKey("jwk", key.publicKey);

      const jsonString = JSON.stringify({
        ...exportedKey,
        // short for "username"
        uname: this.username,
      });
      this.$data.publicKey = jsonString;

      // Convert the JSON string to Base64 to minimize the size of the QR code.
      // Because Base64 is using less characters than JSON.
      const publicKeyBase64 = btoa(jsonString);

      if (this.canvasRef) {
        QRCode.toCanvas(this.canvasRef, publicKeyBase64);
      }

      // Generate the SHA-256 hash of the JWK
      const jwkHash = await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(jsonString)
      );

      // Convert the hash to a hexadecimal string
      const jwkHashHex = Array.from(new Uint8Array(jwkHash))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      console.log(jwkHashHex);
    },
  },
};
</script>

<template>
  <AppBar title="Me" showBackButton />
  <div class="flex w-full p-4 justify-center flex-col">
    <canvas ref="canvasRef" width="200px" height="200px"></canvas>
    <div v-if="publicKey" class="flex flex-col">
      <div class="text-xl font-bold">Your public key</div>
      <div class="text-sm text-gray-500">
        This is your public key. You can share it with your contacts.
      </div>
      <div class="text-sm text-gray-500">
        <pre>{{ publicKey }}</pre>
      </div>
    </div>
    <input class="p-2 border border-gray-500" type="text" v-model="username" />
    <button
      @click="onClickGenerateMyKey"
      className="p-1 bg-gray-900 rounded-sm text-white"
    >
      Generate my key
    </button>
  </div>
</template>
