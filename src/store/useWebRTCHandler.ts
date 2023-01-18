import { ref } from "vue";

export function useWebRTCHandler() {
  const connected = ref(false);

  const connect = () => {
    console.log("connecting...");
    connected.value = true;
  };

  return { connect, connected };
}
