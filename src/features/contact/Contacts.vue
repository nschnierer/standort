<script lang="ts">
import { PlusIcon, TrashIcon } from "@heroicons/vue/24/solid";
import { defineComponent } from "vue";
import { useContacts } from "../../store/useContacts";
import { useWebRTCHandler } from "../../store/useWebRTCHandler";
import { formatRelativeTime } from "../../utils";

export default defineComponent({
  name: "Contacts",
  components: { PlusIcon, TrashIcon },
  data: (): { selectedContacts: string[] } => ({
    selectedContacts: [],
  }),
  setup: () => {
    const { contacts, removeContact } = useContacts();
    const { sendOffer } = useWebRTCHandler();

    return { contacts, removeContact, formatRelativeTime, sendOffer };
  },
  methods: {
    onSelectContact: function (fingerprint: string) {
      if (this.$data.selectedContacts.includes(fingerprint)) {
        this.$data.selectedContacts = this.$data.selectedContacts.filter(
          (entry) => entry !== fingerprint
        );
      } else {
        this.$data.selectedContacts.push(fingerprint);
      }
    },
    onRemoveContact: function (fingerprint: string) {
      const ok = confirm("Are you sure you want to remove this contact?");
      if (ok) {
        this.removeContact(fingerprint);
      }
    },
    onShare: function () {
      this.$data.selectedContacts.forEach((fingerprint) => {
        this.sendOffer(fingerprint);
      });
      this.$router.push("/");
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

  <div class="flex flex-col h-full w-full">
    <div
      class="max-w-md mx-auto p-4 pt-8 flex flex-col space-y-4 pb-36 flex-1 w-full"
    >
      <div v-if="contacts.length === 0" class="text-center">
        No contacts yet.
      </div>
      <template v-for="contact in contacts" :key="contact.fingerprint">
        <div class="flex space-x-4">
          <div class="flex items-center">
            <label class="inline-flex items-center">
              <input
                type="checkbox"
                @click="onSelectContact(contact.fingerprint)"
                :selected="selectedContacts.includes(contact.fingerprint)"
                class="w-5 h-5 text-blue-600 border border-gray-300 rounded-md checked:border-1 accent-blue-600 focus:ring-2 focus:ring-blue-500"
              />
              <span class="hidden ml-2"
                >Select to share location with {{ contact.username }}</span
              >
            </label>
          </div>
          <div class="flex flex-col flex-1">
            <div>{{ contact.username }}</div>
            <div>
              <code class="text-xs">{{ contact.fingerprint.slice(0, 8) }}</code>
            </div>
          </div>
          <div class="">
            <div class="text-right">
              {{ formatRelativeTime(contact.addedAt) }}
            </div>
            <div class="flex justify-end">
              <button @click="onRemoveContact(contact.fingerprint)">
                <TrashIcon class="w-5 h-5 text-black" />
              </button>
            </div>
          </div>
        </div>
      </template>
    </div>

    <div
      class="bottom-0 z-10 flex w-full h-20 bg-white rounded-b-none shadow-2xl rounded-2xl"
    >
      <div class="w-full p-2">
        <button
          @click="onShare()"
          :disabled="selectedContacts.length === 0"
          class="flex justify-center w-full px-4 py-4 font-bold text-white bg-blue-500 rounded disabled:bg-blue-200"
        >
          Share with selected ({{ selectedContacts.length }})
        </button>
      </div>
    </div>
  </div>
</template>
