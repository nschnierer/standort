<script lang="ts">
import { ref } from "vue";
import { mapStores } from "pinia";
import { BrowserQRCodeReader, IScannerControls } from "@zxing/browser";
import { XMarkIcon, ExclamationCircleIcon } from "@heroicons/vue/24/solid";
import { useContactsStore } from "../../store/useContactsStore";

export default {
  name: "ContactAdd",
  components: { XMarkIcon, ExclamationCircleIcon },
  data: (): {
    loadingCamera: boolean;
    error: "" | "ACCESS_DENIED";
  } => ({
    loadingCamera: true,
    error: "",
  }),
  setup() {
    const videoRef = ref<HTMLVideoElement | null>(null);
    const streamRef = ref<MediaStream | null>(null);
    const codeReaderRef = ref(new BrowserQRCodeReader());
    const scannerControlsRef = ref<IScannerControls | null>(null);

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
    startScanner: async function () {
      this.loadingCamera = true;
      this.error = "";

      // Request camera access
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
          },
        });
        this.streamRef = stream;
        // Show video stream in video element
        this.videoRef!.srcObject = stream;
        // Fix for Safari:
        // Wrap the play() method in a Promise
        await new Promise((resolve, reject) => {
          this.videoRef!.onplaying = resolve;
          this.videoRef!.onerror = reject;
          this.videoRef!.play();
        });
      } catch (error) {
        this.error = "ACCESS_DENIED";
        this.loadingCamera = false;
        console.error(error);
        return;
      }

      this.scannerControlsRef = await this.codeReaderRef.decodeFromVideoDevice(
        undefined,
        this.videoRef!,
        async (result, error, controls) => {
          console.log("QR CODE RESPONSE", result, error);
          if (result) {
            const base64 = await result.getText();
            console.log("QR CODE RESULT", base64);
            const success = await this.encodeContactData(base64);
            console.log("QR CODE SUCCESS", success);
            if (success) {
              this.$router.replace("/contacts");
            }
          }
        }
      );

      this.loadingCamera = false;
    },
    encodeContactData: async function (base64: string) {
      let json:
        | (JsonWebKey & {
            username: string;
          })
        | null = null;
      try {
        const jsonRaw = atob(base64);
        console.log("jsonRaw", jsonRaw);
        json = JSON.parse(jsonRaw);
      } catch (error) {
        console.error(error);
      }

      if (!json) {
        console.error("Invalid QR with empty JSON");
        return false;
      }
      const { username, ...publicKey } = json;

      await this.contactsStore.createContact({
        username,
        publicKey,
      });
      return true;
    },
  },
  mounted: function () {
    this.startScanner();
  },
  unmounted: function () {
    // Clean up
    this.scannerControlsRef?.stop();
    this.streamRef?.getTracks().forEach((track) => {
      track.stop();
    });
  },
};
</script>

<template>
  <AppBar transparent>
    <template v-slot:right>
      <router-link to="/contacts" replace class="h-full flex items-center">
        <XMarkIcon class="h-10 w-10 text-white" />
      </router-link>
    </template>
  </AppBar>
  <div class="flex w-full h-full items-center justify-center bg-black">
    <div
      class="fixed flex flex-col space-y-3 items-center"
      v-if="loadingCamera && !error"
    >
      <LoadingCircle class="w-8 h-8" />
      <p class="text-white opacity-50">Opening camera...</p>
    </div>
    <video
      v-if="!error"
      id="contact-add-camera"
      ref="videoRef"
      autoplay
      playsinline
      muted
      class="object-contain object-position w-full h-full"
    />
    <div v-if="error" class="p-4 w-full flex flex-col space-y-3 items-center">
      <ExclamationCircleIcon class="h-12 w-12 text-red-500" />
      <div class="text-white text-center">
        <template v-if="error === 'ACCESS_DENIED'">
          <p>Please allow access to the camera in your browser settings.</p>
        </template>
      </div>
    </div>
  </div>
</template>
