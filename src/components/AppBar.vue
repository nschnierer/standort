<script lang="ts">
import { PropType } from "vue";
import { ChevronLeftIcon } from "@heroicons/vue/24/outline";

export default {
  name: "AppBar",
  components: { ChevronLeftIcon },
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
      } else {
        this.$router.go(-1);
      }
    },
  },
};
</script>

<template>
  <header
    class="sticky top-0 z-30 flex items-center justify-center h-16 bg-blue-500"
  >
    <div class="flex h-full px-2 py-2 items-center justify-start w-28">
      <button
        v-if="showBackButton"
        @click="onClickBackHandler"
        class="h-full px-2"
      >
        <ChevronLeftIcon class="h-8 w-8 text-white" />
      </button>
    </div>
    <div class="flex flex-1 h-full justify-center items-center">
      <h1 class="text-2xl text-white">{{ title }}</h1>
    </div>
    <div class="flex h-full px-2 py-2 items-center justify-end w-28">
      <slot name="right"></slot>
    </div>
  </header>
</template>
