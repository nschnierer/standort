<template>
  <header
    class="sticky top-0 z-30 flex items-center justify-center h-16 bg-blue-500"
  >
    <div class="flex h-full px-4 py-2 items-center">
      <button v-if="showBackButton" @click="onClickBackHandler">Back</button>
    </div>
    <div class="flex flex-1 h-full justify-center items-center">
      <h1 class="text-2xl text-white">{{ title }}</h1>
    </div>
    <div class="flex h-full px-4 py-2 items-center">
      <slot name="right"></slot>
    </div>
  </header>
</template>

<script lang="ts">
import { PropType } from "vue";

export default {
  name: "AppBar",
  props: {
    title: {
      type: String,
      required: false,
    },
    onClickBack: {
      type: Function as PropType<(event: Event) => void>,
      required: false,
    },
    showBackButton: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  methods: {
    onClickBackHandler(event: Event) {
      if (this.$props.onClickBack) {
        this.$props.onClickBack(event);
        console.log("wadw");
      } else {
        console.log("wadw2");
        this.$router.go(-1);
      }
    },
  },
};
</script>
