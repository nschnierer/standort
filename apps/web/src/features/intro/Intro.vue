<script lang="ts">
export default {
  name: "Intro",
};
</script>

<template>
  <div class="flex flex-1 justify-center items-center">
    <article class="text-center">
      <h1 class="text-3xl text-violet-600">Standort.live</h1>
      <p>Share your location with friends and family.</p>
    </article>
    <div class="absolute bottom-0 z-10 flex w-full">
      <div class="w-full p-2">
        <router-link
          to="/setup"
          class="flex justify-center w-full px-4 py-4 font-bold text-white bg-violet-500 rounded"
        >
          Get started
        </router-link>
      </div>
    </div>
  </div>
</template>
