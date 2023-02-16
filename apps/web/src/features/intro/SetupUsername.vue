<script lang="ts">
import { useUser } from "~/store/useUser";

export default {
  name: "SetupUsername",
  emits: ["on-submit"],
  data: () => ({
    username: "",
    usernamePlaceholder: "",
    interval: 0,
    intervalDelay: 2500,
  }),
  setup() {
    const { user, updateUser } = useUser();
    return { user, updateUser };
  },
  methods: {
    /**
     * Get a random name from the list of names.
     */
    getRandomName() {
      const names = [
        "Alice",
        "Yehosheva",
        "Charlie",
        "David",
        "Jovita",
        "Frank",
        "Grace",
        "Heidi",
        "Ivan",
        "Judy",
        "Kevin",
        "Keisha",
        "Mike",
        "Yachle'el",
        "Hayat",
        "Eun-Woo",
        "Quentin",
        "Berniece",
        "Murielle",
        "Frančiška",
        "Ursula",
        "Victor",
        "Filomena",
        "Xavier",
        "Rasul",
        "Evelína",
      ];
      return names[Math.floor(Math.random() * names.length)];
    },
    startInterval() {
      this.usernamePlaceholder = this.getRandomName();
      this.interval = window.setInterval(() => {
        this.usernamePlaceholder = this.getRandomName();
      }, this.intervalDelay);
    },
    onSubmit() {
      this.updateUser({ username: this.username });
      this.$emit("on-submit");
    },
  },
  mounted() {
    if (this.user.username) {
      this.username = this.user.username;
    }

    this.startInterval();
  },
  unmounted() {
    window.clearInterval(this.interval);
  },
};
</script>

<template>
  <form
    class="flex flex-1 justify-center items-center bg-violet-600"
    v-on:submit.prevent="onSubmit"
  >
    <div class="text-center px-2 w-full max-w-md mx-auto">
      <h1 class="text-3xl text-white">Your name</h1>

      <div class="flex flex-col justify-center items-center">
        <input
          type="text"
          aria-describedby="username-description"
          v-model="username"
          maxlength="35"
          class="w-full px-4 py-3 mt-4 text-gray-800 text-xl bg-white rounded outline-none appearance-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2"
          :placeholder="usernamePlaceholder"
        />
      </div>

      <p id="username-description" class="mt-3 text-gray-100">
        Just to identify you to your friends and family.
      </p>
    </div>
    <div class="absolute bottom-0 z-10 flex w-full">
      <div class="w-full p-2">
        <button
          type="submit"
          :disabled="username.length === 0"
          class="flex justify-center w-full px-4 py-4 font-bold text-violet-600 bg-white rounded disabled:opacity-40 disabled:cursor-not-allowed transition-opacity duration-500"
        >
          Next
        </button>
      </div>
    </div>
  </form>
</template>
