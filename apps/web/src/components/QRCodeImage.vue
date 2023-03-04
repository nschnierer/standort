<script lang="ts">
import QRCode from "qrcode";

export default {
  name: "QRCodeImage",
  props: {
    data: {
      type: String,
      required: true,
    },
    colorDark: {
      type: String,
      default: "#000000",
    },
    colorLight: {
      type: String,
      default: "#ffffff",
    },
  },
  data: () => ({
    dataUrl: "",
  }),
  watch: {
    data() {
      this.generate();
    },
  },
  methods: {
    async generate() {
      const base64 = btoa(this.data);
      this.dataUrl = await QRCode.toDataURL(base64, {
        color: { dark: this.colorDark, light: this.colorLight },
      });
    },
  },
  mounted() {
    this.generate();
  },
};
</script>

<template>
  <img alt="QR-Code" v-if="dataUrl" :src="dataUrl" v-bind="$attrs" />
</template>
