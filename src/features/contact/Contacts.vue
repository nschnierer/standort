<script lang="ts">
import { PlusIcon, TrashIcon } from "@heroicons/vue/24/solid";
import { defineComponent } from "vue";
import { useContacts } from "../../store/useContacts";
import { formatRelativeTime } from "../../utils";

export default defineComponent({
  name: "Contacts",
  components: { PlusIcon, TrashIcon },
  setup: () => {
    const { contacts, removeContact } = useContacts();

    return { contacts, removeContact, formatRelativeTime };
  },
  methods: {
    onRemoveContact: function (fingerprint: string) {
      const ok = confirm("Are you sure you want to remove this contact?");
      if (ok) {
        this.removeContact(fingerprint);
      }
    },
  },
});
</script>

<template>
  <AppBar
    title="Contacts"
    showBackButton
    :onClickBack="() => $router.push('/')"
  >
    <template v-slot:right>
      <router-link to="/contacts/add" class="h-full px-2 flex items-center">
        <PlusIcon class="h-8 w-8 text-white" />
      </router-link>
    </template>
  </AppBar>

  <div
    v-for="contact in contacts"
    :key="contact.fingerprint"
    class="max-w-md mx-auto p-4 pt-8 grid grid-cols-2 gap-1"
  >
    <div>{{ contact.username }}</div>
    <div class="text-right">
      {{ formatRelativeTime(contact.addedAt) }}
    </div>
    <div class="col-span-1">
      <div class="flex w-full">
        <code
          class="w-full truncate border border-gray-300 rounded-xl px-2 py-0.5 text-xs"
          >{{ contact.fingerprint }}</code
        >
      </div>
    </div>
    <div class="flex justify-end">
      <button @click="onRemoveContact(contact.fingerprint)">
        <TrashIcon class="w-5 h-5 text-black" />
      </button>
    </div>
  </div>
</template>
