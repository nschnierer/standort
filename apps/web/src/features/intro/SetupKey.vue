<script lang="ts">
import QRCode from "qrcode";
import { useUser } from "~/store/useUser";

export default {
  name: "SetupKey",
  data: () => ({
    privateKey: "",
    interval: 0,
    generatedQR: "",
  }),
  setup() {
    const { user, updateUser } = useUser();
    return { user, updateUser };
  },
  emits: ["on-submit"],
  methods: {
    onSubmit() {
      this.$emit("on-submit");
    },
    generate() {},
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
  <SquaresBackground />
  <form
    class="flex flex-1 justify-center items-center gradient"
    v-on:submit.prevent="onSubmit"
  >
    <div class="text-center px-2 w-full max-w-md mx-auto">
      <h1 class="text-3xl text-white">Generate your secrets...</h1>

      <div class="flex w-full justify-center h-56 p-2">
        <img v-if="generatedQR" :src="generatedQR" class="opacity-50" />
      </div>

      <p id="username-description" class="mt-3 text-gray-100">
        IT'S IMPORTANT!
      </p>
    </div>
    <div class="absolute bottom-0 z-10 flex w-full">
      <div class="w-full p-2">
        <button
          type="submit"
          disabled="true"
          class="flex justify-center w-full px-4 py-4 font-bold text-violet-600 bg-white rounded disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  </form>
</template>
