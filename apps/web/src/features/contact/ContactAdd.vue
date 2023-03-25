<script lang="ts">
import { onMounted, ref } from "vue";
import { mapStores } from "pinia";
import { BrowserQRCodeReader, IScannerControls } from "@zxing/browser";
import { XMarkIcon, ExclamationCircleIcon } from "@heroicons/vue/24/solid";
import { useContactsStore } from "../../store/useContactsStore";

export default {
  name: "ContactAdd",
  components: { XMarkIcon, ExclamationCircleIcon },
  data: (): {
    state: "LOADING" | "READY" | "ERROR_ACCESS_DENIED";
  } => ({
    state: "LOADING",
  }),
  setup() {
    const videoRef = ref<HTMLVideoElement | null>(null);
    const codeReader = new BrowserQRCodeReader();
    const scannerControlsRef = ref<IScannerControls | null>(null);

    return {
      videoRef,
      codeReader,
      scannerControlsRef,
    };
  },
  computed: {
    ...mapStores(useContactsStore),
  },
  methods: {
    /**
     * Access camera and call startScanner.
     */
    async startCamera() {
      this.state = "LOADING";
      console.log("this.videoRef", this.videoRef);
      // Request camera access
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
          },
        });
        // Show video stream in video element
        this.videoRef!.srcObject = stream;
        this.state = "READY";
        this.startScanner();
      } catch (error) {
        console.error(error);
        this.state = "ERROR_ACCESS_DENIED";
      }
    },
    /**
     * Starts the scanner to detect QR codes.
     */
    async startScanner() {
      try {
        this.scannerControlsRef = await this.codeReader.decodeFromVideoElement(
          this.videoRef!,
          async (result) => {
            if (!result) {
              return;
            }
            const success = await this.contactsStore.createContactFromShareData(
              result.getText()
            );
            if (success) {
              this.stopCameraAndScanner();
              this.$router.replace("/contacts");
            }
          }
        );
      } catch (error) {
        console.error("Unable to scan for QR codes", error);
      }
    },
    /**
     * Stops camera and scanner.
     */
    stopCameraAndScanner() {
      this.scannerControlsRef?.stop();
      const stream = this.videoRef?.srcObject as MediaStream | undefined;
      stream?.getTracks().forEach((track) => {
        track.stop();
      });
    },
  },
  mounted: function () {
    this.startCamera();
  },
  unmounted: function () {
    this.stopCameraAndScanner();
  },
};
</script>

<template>
  <AppBar transparent>
    <template v-slot:right>
      <router-link to="/contacts" replace class="flex items-center h-full">
        <XMarkIcon class="w-10 h-10 text-white" />
      </router-link>
    </template>
  </AppBar>
  <div class="flex items-center justify-center w-full h-full bg-black">
    <div
      class="fixed flex flex-col items-center space-y-3"
      v-if="state === 'LOADING'"
    >
      <LoadingCircle class="w-8 h-8" />
      <p class="text-white opacity-50">Opening camera...</p>
    </div>
    <video
      id="contact-add-camera"
      ref="videoRef"
      autoplay
      playsinline
      muted
      class="object-contain w-full h-full object-position"
    />
    <div
      v-if="state.startsWith('ERROR_')"
      class="flex flex-col items-center w-full p-4 space-y-3"
    >
      <ExclamationCircleIcon class="w-12 h-12 text-red-500" />
      <div class="text-center text-white">
        <template v-if="state === 'ERROR_ACCESS_DENIED'">
          <p>Please allow access to the camera in your browser settings.</p>
        </template>
      </div>
    </div>
  </div>
</template>
