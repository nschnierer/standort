<script lang="ts">
import SetupUsername from "./SetupUsername.vue";
import SetupKey from "./SetupKey.vue";

export default {
  name: "Setup",
  components: { SetupUsername, SetupKey },
  methods: {},
  computed: {
    step() {
      const { step } = this.$route.query;
      // parse number if possible, otherwise return 1
      return typeof step !== "string" ? 1 : parseInt(step, 10) || 1;
    },
  },
};
</script>

<template>
  <SetupUsername
    @on-submit="() => $router.push('/setup?step=2')"
    v-if="step === 1"
  />
  <SetupKey
    @on-submit="() => $router.push('/setup?step=3')"
    v-if="step === 2"
  />
</template>
