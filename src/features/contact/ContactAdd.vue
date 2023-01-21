<script lang="ts">
import { ref } from "vue";
import { BrowserQRCodeReader, IScannerControls } from "@zxing/browser";
import { useContacts } from "../../store/useContacts";
import { generateFingerprint } from "../../utils/generateFingerprint";

export default {
  name: "ContactAdd",
  setup() {
    const videoRef = ref<HTMLVideoElement | null>(null);
    const streamRef = ref<MediaStream | null>(null);
    const codeReaderRef = ref(new BrowserQRCodeReader());
    const scannerControlsRef = ref<IScannerControls | null>(null);

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
      scannerControlsRef,
    };
  },
  methods: {
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

      const fingerprint = await generateFingerprint(publicKey);

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
