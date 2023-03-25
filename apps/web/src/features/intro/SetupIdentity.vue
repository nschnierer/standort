<script lang="ts">
import { mapStores } from "pinia";
import { useIdentityStore } from "~/store/useIdentityStore";

export default {
  name: "SetupIdentity",
  data: () => ({
    animationTimeout: 0,
    animationDurationMS: 4000,
    showIdentity: false,
    savedIdentity: false,
  }),
  emits: ["on-submit"],
  computed: {
    ...mapStores(useIdentityStore),
    navigatorCanShare() {
      // check if navigator.share is available
      return Boolean(window.navigator.share);
    },
  },
  methods: {
    getExportBlob() {
      const stringified = JSON.stringify(this.identityStore.exportData);
      const blobFile = new Blob([stringified], { type: "application/json" });
      return blobFile;
    },
    getShortFingerprint() {
      return this.identityStore.fingerprint.slice(0, 8);
    },
    getExportFileName() {
      return `standort-live-id-${this.getShortFingerprint()}.json`;
    },
    getExportFile() {
      const file = new File([this.getExportBlob()], this.getExportFileName(), {
        type: "application/json",
        lastModified: Date.now(),
      });
      return file;
    },
    download() {
      const downloadLink = document.createElement("a");
      downloadLink.href = URL.createObjectURL(this.getExportBlob());
      downloadLink.download = this.getExportFileName();
      // Start download
      downloadLink.click();
      this.savedIdentity = true;
    },
    share() {
      const file = this.getExportFile();
      if (navigator.share) {
        navigator
          .share({
            files: [file],
            title: `Standort.live ID ${this.getShortFingerprint()}`,
            text: "Please keep this file secret.",
          })
          .then(() => console.log("JSON data shared successfully"))
          .catch((error) => console.error("Error sharing JSON data:", error));
      }
      this.savedIdentity = true;
    },
    onSubmit() {
      this.$emit("on-submit");
    },
  },
  mounted() {
    // Generate a new identity (public/private keys).
    this.identityStore.generateKeys();

    this.animationTimeout = window.setTimeout(async () => {
      this.showIdentity = true;
      // Force update to show the QR code.
      // Sometimes the QR code is not rendered correctly.
      this.$forceUpdate();
    }, this.animationDurationMS);
  },
  beforeUnmount() {
    window.clearTimeout(this.animationTimeout);
  },
};
</script>

<style scoped>
.gradient {
  background: rgb(124, 58, 237);
  background: linear-gradient(
    185deg,
    rgba(124, 58, 237, 1) 0%,
    rgba(124, 58, 237, 1) 40%,
    rgba(124, 58, 237, 0.8) 100%
  );
}
</style>

<template>
  <SquaresBackground :animate="!showIdentity" />
  <form
    class="flex items-center justify-center flex-1 gradient"
    v-on:submit.prevent="onSubmit"
  >
    <div
      class="flex flex-col items-center w-full max-w-md px-2 mx-auto space-y-3 text-center"
    >
      <template v-if="!showIdentity">
        <h1 class="text-3xl text-white">Generate your identity.</h1>
      </template>

      <template v-if="showIdentity">
        <div class="relative flex justify-center w-24 h-24">
          <div class="absolute flex items-center justify-center w-full h-full">
            <p class="font-bold text-white text-1xl opacity-90">
              YOUR IDENTITY
            </p>
          </div>
          <QRCodeImage
            :data="JSON.stringify(identityStore.shareData)"
            class="border rounded-md shadow-lg border-violet-700"
            colorDark="#4c1d95"
            colorLight="#8b5cf6"
          />
        </div>

        <p id="username-description" class="mt-3 text-gray-100">
          Please keep it somewhere safe. <br />You will need it later to recover
          your identity.
        </p>

        <div class="flex items-baseline space-x-2 text-white">
          <button
            type="button"
            @click="download"
            class="flex justify-center w-32 px-4 py-4 font-bold bg-white rounded text-violet-600"
          >
            Download
          </button>

          <template v-if="navigatorCanShare">
            <p>OR</p>
            <button
              type="button"
              @click="share"
              class="flex justify-center w-32 px-4 py-4 font-bold bg-white rounded text-violet-600"
            >
              Share
            </button>
          </template>
        </div>
      </template>
    </div>
    <div class="absolute bottom-0 z-10 flex w-full">
      <div class="w-full p-2">
        <button
          type="submit"
          :disabled="!showIdentity || !savedIdentity"
          class="flex justify-center w-full px-4 py-4 font-bold bg-white rounded text-violet-600 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  </form>
</template>
