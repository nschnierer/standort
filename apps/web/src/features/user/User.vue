<script lang="ts">
import { mapStores } from "pinia";
import {
  ClipboardIcon,
  InformationCircleIcon,
} from "@heroicons/vue/24/outline";
import { useIdentityStore } from "~/store/useIdentityStore";

export default {
  name: "User",
  data: () => ({
    usernameInput: "",
  }),
  computed: {
    ...mapStores(useIdentityStore),
  },
  methods: {
    copyFingerprint: function () {
      try {
        navigator.clipboard.writeText(this.identityStore.fingerprint);
      } catch (err) {
        console.error(err);
      }
    },
    onClickUpdate: function () {
      this.identityStore.$patch({
        username: this.usernameInput,
      });
    },
    onClickGenerateMyKey: async function () {
      const yes = confirm(
        "Are you sure you want to generate a new key pair? This will invalidate your old key pair."
      );
      if (yes) {
        this.identityStore.generateKeys();
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
      <div v-if="identityStore.fingerprint" class="flex w-full text-center">
        <code class="w-full truncate">{{ identityStore.fingerprint }}</code>
        <button className="pl-1 hover:text-gray-700" @click="copyFingerprint()">
          <ClipboardIcon class="w-6 h-6" />
        </button>
      </div>
    </div>
    <div class="flex flex-col">
      <input
        class="p-2 py-3 border border-gray-500"
        type="text"
        v-model="usernameInput"
        placeholder="Username, Pseudonym, etc."
        @keyup.enter="onClickUpdate()"
      />
      <button
        @click="onClickUpdate()"
        className="p-1 bg-gray-900 rounded-md py-2 text-white mt-1"
      >
        Update
      </button>
    </div>

    <button
      @click="onClickGenerateMyKey()"
      className="p-1 bg-gray-900 rounded-md py-2 text-white"
    >
      [DANGER] Generate new key pair
    </button>
    <div
      v-if="!identityStore.fingerprint"
      class="flex items-center space-x-4 text-md"
    >
      <InformationCircleIcon class="w-12 h-12 text-violet-700" />
      <div>
        You don't have a key pair yet. Click the button above to generate one.
      </div>
    </div>
  </div>
</template>
