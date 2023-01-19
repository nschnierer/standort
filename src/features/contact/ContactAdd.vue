<script lang="ts">
import { ref } from "vue";
import { BrowserQRCodeReader } from "@zxing/browser";
import { useContacts } from "../../store/useContacts";

export default {
  name: "ContactAdd",
  setup() {
    const videoRef = ref<HTMLVideoElement | null>(null);
    const streamRef = ref<MediaStream | null>(null);
    const codeReaderRef = ref(new BrowserQRCodeReader());

    const { createContact } = useContacts();

    navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
      streamRef.value = stream;
      if (videoRef.value) {
        videoRef.value.srcObject = stream;
      }
    });

    return {
      videoRef,
      streamRef,
      codeReaderRef,
      createContact,
    };
  },
  methods: {
    getFingerprint: async function (publicKey: JsonWebKey) {
      // Just use the relevant parts of the JWK
      // See  RFC7638 for more information.
      const minimalPublicKey = {
        kty: publicKey.kty,
        n: publicKey.n,
        e: publicKey.e,
      };
      const buffer = await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(JSON.stringify(minimalPublicKey))
      );
      const hashArray = Array.from(new Uint8Array(buffer));
      const hash = hashArray
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      return hash;
    },
    encodeContactData: async function (base64: string) {
      let json = null;
      try {
        json = JSON.parse(atob(base64)) as JsonWebKey & {
          uname: string;
        };
        if (!json.alg) {
          throw new Error("Invalid JWK");
        }
      } catch (e) {
        console.error(e);
      }

      if (!json) {
        return false;
      }
      const { uname: username, ...publicKey } = json;

      const fingerprint = await this.getFingerprint(publicKey);

      await this.createContact({
        username,
        fingerprint,
        publicKey,
        addedAt: new Date(),
      });
      return true;
    },
  },
  mounted: async function () {
    if (this.videoRef && this.codeReaderRef) {
      // you can use the controls to stop() the scan or switchTorch() if available
      const controls = await this.codeReaderRef.decodeFromVideoDevice(
        undefined,
        this.videoRef,
        async (result, error, controls) => {
          console.log(result);
          if (result) {
            const base64 = await result.getText();
            const success = await this.encodeContactData(base64);
            if (success) {
              controls.stop();
              this.$router.push("/contacts");
            }
          }
        }
      );
      // stops scanning after 20 seconds
      setTimeout(() => controls.stop(), 20000);
    }
  },
  unmounted: function () {
    if (this.streamRef) {
      this.streamRef.getTracks().forEach((track) => track.stop());
    }
  },
};
</script>

<template>
  <video
    id="contact-add-camera"
    ref="videoRef"
    autoplay
    class="object-fit object-position w-full h-full"
  />
</template>
