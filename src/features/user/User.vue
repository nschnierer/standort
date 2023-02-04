<script lang="ts">
import { watch } from "vue";
import QRCode from "qrcode";
import {
  ClipboardIcon,
  InformationCircleIcon,
} from "@heroicons/vue/24/outline";
import { generateFingerprint } from "../../utils/generateFingerprint";
import { useUser } from "../../store/useUser";

const generateQRCodeDataUrl = async (
  username: string,
  publicKey: JsonWebKey
) => {
  const publicKeyString = JSON.stringify({
    // short for "username"
    uname: username,
    ...publicKey,
  });

  // Convert the JSON string to Base64 to minimize the size of the QR code.
  // Because Base64 is using less characters than JSON.
  const publicKeyBase64 = btoa(publicKeyString);

  return await QRCode.toDataURL(publicKeyBase64);
};

export default {
  name: "User",
  components: {
    ClipboardIcon,
    InformationCircleIcon,
  },
  data: (): {
    usernameInput: string;
    publicKeyHash: string;
    qrCodeDataUrl: string;
  } => ({
    usernameInput: "",
    publicKeyHash: "",
    qrCodeDataUrl: "",
  }),
  setup: () => {
    const { user, updateUser } = useUser();
    return { user, updateUser };
  },
  watch: {
    user: {
      handler: async function (newUser: typeof this.user) {
        if (!newUser.publicKey) {
          return;
        }
        this.$data.publicKeyHash = await generateFingerprint(newUser.publicKey);
        this.$data.qrCodeDataUrl = await generateQRCodeDataUrl(
          newUser.username,
          newUser.publicKey
        );
        this.$data.usernameInput = newUser.username;
      },
      deep: true,
    },
  },
  methods: {
    copyFingerprint: function () {
      try {
        navigator.clipboard.writeText(this.$data.publicKeyHash);
      } catch (err) {
        console.error(err);
      }
    },
    onClickUpdate: function () {
      this.updateUser({
        username: this.$data.usernameInput,
      });
    },
    onClickGenerateMyKey: async function () {
      const yes = confirm(
        "Are you sure you want to generate a new key pair? This will invalidate your old key pair."
      );
      if (!yes) {
        return;
      }

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

      const privateKey = await crypto.subtle.exportKey("jwk", key.publicKey);
      const publicKey = await crypto.subtle.exportKey("jwk", key.publicKey);

      this.updateUser({
        username: this.$data.usernameInput,
        privateKey,
        publicKey,
      });
    },
  },
};
</script>

<template>
  <AppBar title="Me" showBackButton :onClickBack="() => $router.push('/')" />
  <div class="flex w-full p-4 justify-center flex-col space-y-6">
    <div class="flex flex-col justify-center">
      <div v-if="qrCodeDataUrl" class="flex w-full justify-center">
        <img :src="qrCodeDataUrl" />
      </div>
      <div v-if="publicKeyHash" class="flex w-full text-center">
        <code class="w-full truncate">{{ publicKeyHash }}</code>
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
    <div v-if="!publicKeyHash" class="flex text-md items-center space-x-4">
      <InformationCircleIcon class="w-12 h-12 text-violet-700" />
      <div>
        You don't have a key pair yet. Click the button above to generate one.
      </div>
    </div>
  </div>
</template>
