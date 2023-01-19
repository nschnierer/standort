<script lang="ts">
import { PlusIcon, TrashIcon } from "@heroicons/vue/24/solid";
import { defineComponent } from "vue";
import { useContacts } from "../../store/useContacts";

export default defineComponent({
  name: "Contacts",
  components: { PlusIcon, TrashIcon },
  setup: () => {
    const { contacts, removeContact } = useContacts();
    return { contacts, removeContact };
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
  <AppBar title="Contacts" showBackButton>
    <template v-slot:right>
      <router-link to="/contacts/add" class="h-full px-2 flex items-center">
        <PlusIcon class="h-8 w-8 text-white" />
      </router-link>
    </template>
  </AppBar>

  <div
    v-for="contact in contacts"
    :key="contact.fingerprint"
    class="max-w-md mx-auto mt-10 grid grid-cols-2 gap-1"
  >
    <div>{{ contact.username }}</div>
    <div>
      {{ contact.addedAt.toLocaleDateString() }}
    </div>
    <div class="text-sm col-span-2">
      {{ contact.fingerprint }}
    </div>
    <div class="col-span-2">
      <button @click="onRemoveContact(contact.fingerprint)">
        <TrashIcon class="w-6 h-6 text-black" />
      </button>
    </div>
  </div>
</template>
