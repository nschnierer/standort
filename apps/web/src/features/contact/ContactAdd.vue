<script lang="ts">
import { ref } from "vue";
import { mapStores } from "pinia";
import { BrowserQRCodeReader, IScannerControls } from "@zxing/browser";
import { useContactsStore } from "../../store/useContacts";
import { generateFingerprint } from "~/utils/cryptoHelpers";

export default {
  name: "ContactAdd",
  setup() {
    const videoRef = ref<HTMLVideoElement | null>(null);
    const streamRef = ref<MediaStream | null>(null);
    const codeReaderRef = ref(new BrowserQRCodeReader());
    const scannerControlsRef = ref<IScannerControls | null>(null);

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
      scannerControlsRef,
    };
  },
  computed: {
    ...mapStores(useContactsStore),
  },
  methods: {
    encodeContactData: async function (base64: string) {
      let json = null;
      try {
        const jsonRaw = atob(base64);
        console.log("jsonRaw", jsonRaw);
        json = JSON.parse(jsonRaw) as JsonWebKey & {
          username: string;
        };
      } catch (error) {
        console.error(error);
      }

      if (!json) {
        return false;
      }
      const { username, ...publicKey } = json;

      const fingerprint = await generateFingerprint(publicKey);
      console.log(fingerprint);

      await this.contactsStore.createContact({
        username,
        fingerprint,
        publicKey,
      });
      return true;
    },
  },
  mounted: async function () {
    if (this.videoRef && this.codeReaderRef) {
      // you can use the controls to stop() the scan or switchTorch() if available
      this.scannerControlsRef = await this.codeReaderRef.decodeFromVideoDevice(
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
      setTimeout(() => this.scannerControlsRef?.stop(), 20000);
    }
  },
  unmounted: function () {
    console.log("unmounted");
    this.scannerControlsRef?.stop();
    if (this.streamRef) {
      console.log("unmounted", this.streamRef);
      this.streamRef.getTracks().forEach((track) => {
        console.log("track...");
        track.stop();
      });
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
