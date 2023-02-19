<script lang="ts">
import { ref } from "vue";

export default {
  name: "SquaresBackground",
  props: {
    animate: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      /** Defines the size of the squares on the canvas */
      squareSize: 25,
      /** Reference of the setInterval function */
      interval: 0,
      /** Defines how often the squares are redrawn */
      intervalDuration: 600,
    };
  },
  setup() {
    const wrapper = ref<HTMLElement>();
    const canvas = ref<HTMLCanvasElement>();
    return { wrapper, canvas };
  },
  watch: {
    animate(animate: boolean) {
      if (!animate) {
        window.clearInterval(this.interval);
      }
    },
  },
  methods: {
    /**
     * Generate a random number between 1 and 10.
     * Using the native crypto API to generate a random number.
     */
    generateRandomNumber(range?: [start: number, to: number]) {
      const [from = 1, to = 10] = range || [];
      const randomBytes = window.crypto.getRandomValues(new Uint8Array(1));
      const randomNumber = Math.floor((randomBytes[0] / 255) * to) + from;
      return randomNumber;
    },
    /**
     * Draws random squares on the canvas and repeats the process
     * of the given interval duration (see `intervalDuration`).
     */
    generateSquareColors() {
      if (!this.canvas || !this.wrapper) {
        // Skip if canvas or wrapper is not available
        return;
      }

      const context = this.canvas.getContext("2d");

      // Get the size of the wrapper to fill the screen
      const { width, height } = this.wrapper!.getBoundingClientRect();

      // Set canvas dimensions to match the size of the window
      this.canvas!.style.width = `${width}px`;
      this.canvas!.style.height = `${height}px`;

      // Set actual size in memory (scaled to account for extra pixel density).
      // Change to 1 on retina screens to see blurry canvas.
      const scale = window.devicePixelRatio;
      this.canvas!.width = Math.floor(width * scale);
      this.canvas!.height = Math.floor(height * scale);

      // Calculate the number of squares needed to fill the screen
      const numCols = Math.ceil(this.canvas!.width / this.squareSize);
      const numRows = Math.ceil(this.canvas!.height / this.squareSize);
      const numSquares = numCols * numRows;

      /**
       * Draw squares randomly on the canvas.
       */
      const drawSquares = () => {
        context!.clearRect(0, 0, this.canvas!.width, this.canvas!.height);

        for (let row = 0; row < numSquares / numCols; row++) {
          for (let col = 0; col < numCols; col++) {
            if (this.generateRandomNumber() > 3) {
              continue;
            }
            context!.fillStyle = "#7c3aed50";
            context!.fillRect(
              col * this.squareSize,
              row * this.squareSize,
              this.squareSize - 5,
              this.squareSize - 5
            );
          }
        }
      };

      // Draw for the first time
      drawSquares();

      // Make sure to clear the interval before setting a new one
      clearInterval(this.interval);

      if (this.animate === false) {
        return;
      }

      this.interval = window.setInterval(() => {
        // Redraw the squares
        drawSquares();
      }, this.intervalDuration);
    },
  },
  mounted() {
    this.generateSquareColors();

    // Update the squares when the window is resized
    window.addEventListener("resize", this.generateSquareColors);
  },
  beforeUnmount() {
    // Cleanup interval and event listener
    clearInterval(this.interval);
    window.removeEventListener("resize", this.generateSquareColors);
  },
};
</script>

<template>
  <div ref="wrapper" class="absolute top-0 bottom-0 left-0 right-0 -z-10">
    <canvas ref="canvas" />
  </div>
</template>
