<script lang="ts">
import { PlusIcon } from "@heroicons/vue/24/solid";
import { useContacts } from "../../store/useContacts";

export default {
  name: "Contacts",
  components: { PlusIcon },
  setup: () => {
    const { contacts } = useContacts();
    return { contacts };
  },
};
</script>

<template>
  <AppBar title="Contacts" showBackButton>
    <template v-slot:right>
      <PlusIcon class="h-8 w-8 text-white" />
    </template>
  </AppBar>

  <div
    v-for="contact in contacts"
    :key="contact.name"
    class="max-w-md mx-auto mt-10 grid grid-cols-2 gap-1"
  >
    <div>{{ contact.name }}</div>
    <div>
      {{ contact.addedAt.toLocaleDateString() }}
    </div>
    <div class="text-sm col-span-2">
      {{ contact.fingerprint }}
    </div>
  </div>
</template>
