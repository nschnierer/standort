<script lang="ts">
import { mapStores } from "pinia";
import localforage from "localforage";
import {
  ClipboardIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/vue/24/outline";
import { useIdentityStore } from "~/store/useIdentityStore";

const appState = localforage.createInstance({
  name: "standort-state",
});

export default {
  name: "User",
  components: { ClipboardIcon, InformationCircleIcon, ExclamationTriangleIcon },
  data: () => ({
    usernameInput: "",
  }),
  computed: {
    ...mapStores(useIdentityStore),
  },
  methods: {
    onClickUpdate: function () {
      this.identityStore.$patch({
        username: this.usernameInput,
      });
    },
    onClickGenerateMyKey: async function () {
      const yes = confirm(
        "Are you sure you want to wipe all your data? This action cannot be undone."
      );
      if (yes) {
        await appState.clear();
        window.location.reload();
      }
    },
  },
  mounted: function () {
    this.usernameInput = this.identityStore.username;
  },
};
</script>

<template>
  <AppBar
    title="My Identity"
    showBackButton
    :onClickBack="() => $router.push('/')"
  />
  <div class="flex flex-col justify-center w-full p-4 space-y-6">
    <div class="flex flex-col justify-center">
      <div v-if="identityStore.qrCodeData" class="flex justify-center w-full">
        <QRCodeImage :data="JSON.stringify(identityStore.qrCodeData)" />
      </div>
      <div v-if="identityStore.fingerprint" class="flex w-full justify-center">
        <code class="px-1 rounded-md border border-violet-600 text-violet-700">
          {{ identityStore.fingerprint.slice(0, 8) }}
        </code>
      </div>
    </div>

    <div class="flex flex-col">
      <input
        class="p-2 py-3 border border-violet-500 rounded-md"
        type="text"
        v-model="usernameInput"
        placeholder="Username, Pseudonym, etc."
        @keyup.enter="onClickUpdate()"
      />
      <button
        @click="onClickUpdate()"
        className="p-3 bg-violet-600 rounded-md text-white mt-1"
      >
        Update your name
      </button>
    </div>

    <div class="flex flex-col w-full space-y-1">
      <button
        @click="onClickGenerateMyKey()"
        className="p-3 bg-red-600 rounded-md text-white mt-1 flex space-x-2 justify-center items-center"
      >
        <ExclamationTriangleIcon class="w-6 h-6" />
        <span>Wipe my data</span>
      </button>
      <p class="text-sm text-gray-500">
        This action will delete all contacts and your identity. Please make sure
        you backup your identity before.
      </p>
    </div>
  </div>
</template>
