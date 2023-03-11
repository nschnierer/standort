<script lang="ts">
import { PlusIcon, MinusIcon, TrashIcon } from "@heroicons/vue/24/solid";
import { defineComponent } from "vue";
import { mapStores } from "pinia";
import addMinutes from "date-fns/addMinutes";
import differenceInMinutes from "date-fns/differenceInMinutes";
import { useIdentityStore } from "~/store/useIdentityStore";
import { useContactsStore } from "~/store/useContactsStore";
import { useSessionHandlerStore } from "~/store/useSessionsStore";
import { formatRelativeTime, formatRelativeTimeDiff } from "../../utils";

const FROM_ISO = "2023-01-01T00:00:00.000Z";

export default defineComponent({
  name: "Contacts",
  components: { PlusIcon, MinusIcon, TrashIcon },
  data: (): {
    selectedContacts: string[];
    sharingTimeRangeFrom: Date;
    sharingTimeRangeTo: Date;
  } => ({
    selectedContacts: [],
    sharingTimeRangeFrom: new Date(FROM_ISO),
    sharingTimeRangeTo: addMinutes(new Date(FROM_ISO), 15),
  }),
  computed: {
    ...mapStores(useIdentityStore),
    ...mapStores(useContactsStore),
    ...mapStores(useSessionHandlerStore),
  },
  setup: () => {
    return {
      formatRelativeTime,
      formatRelativeTimeDiff,
    };
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
        this.contactsStore.removeContact(fingerprint);
      }
    },
    decreaseTimeRange: function () {
      const diff = differenceInMinutes(
        this.$data.sharingTimeRangeTo,
        this.$data.sharingTimeRangeFrom
      );
      const value = diff <= 60 ? 15 : 60;
      if (value <= 15) {
        return;
      }
      this.$data.sharingTimeRangeTo = addMinutes(
        this.$data.sharingTimeRangeTo,
        value * -1
      );
    },
    increaseTimeRange: function () {
      const diff = differenceInMinutes(
        this.$data.sharingTimeRangeTo,
        this.$data.sharingTimeRangeFrom
      );
      const value = diff >= 60 ? 60 : 15;
      if (value > 60 * 24) {
        return;
      }
      this.$data.sharingTimeRangeTo = addMinutes(
        this.$data.sharingTimeRangeTo,
        value
      );
    },
    onShare: function () {
      this.$data.selectedContacts.forEach((toFingerprint) => {
        const minutes = differenceInMinutes(
          this.$data.sharingTimeRangeTo,
          this.$data.sharingTimeRangeFrom
        );
        const end = addMinutes(new Date(), minutes);
        this.sessionHandlerStore.startSession({
          to: toFingerprint,
          end,
        });
      });
      this.$router.push("/");
    },
  },
});
</script>

<style scoped>
.contact-list {
  @apply p-4 pt-8 flex flex-col space-y-4 w-full max-w-md mx-auto;
  padding-bottom: 160px;
}
.sharing-settings-box {
  @apply fixed bottom-0 flex flex-col w-full p-2 space-y-3 bg-violet-600 rounded-t-lg;
  height: 130px;
}
</style>

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

  <div class="contact-list">
    <div
      v-if="contactsStore.contacts.length === 0"
      class="flex flex-col text-center text-gray-500 italic"
    >
      <p>Add contacts by clicking the plus icon.</p>
    </div>
    <template
      v-for="contact in contactsStore.contacts"
      :key="contact.fingerprint"
    >
      <div class="flex space-x-4">
        <div class="flex items-center">
          <label class="inline-flex items-center">
            <input
              type="checkbox"
              @click="onSelectContact(contact.fingerprint)"
              :selected="selectedContacts.includes(contact.fingerprint)"
              class="w-5 h-5 text-violet-600 border border-gray-300 rounded-md checked:border-1 accent-violet-600 focus:ring-2 focus:ring-violet-500"
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
            {{ formatRelativeTime(new Date(contact.addedAt)) }}
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

  <div class="sharing-settings-box">
    <div class="flex flex-row items-center space-x-3 w-full max-w-md mx-auto">
      <div class="flex-1 text-white">Time range:</div>
      <div>
        <button
          type="button"
          class="flex w-10 h-10 rounded-full items-center justify-center bg-white disabled:bg-violet-300"
          :disabled="selectedContacts.length === 0"
          @click="decreaseTimeRange"
        >
          <MinusIcon class="h-8 w-8 text-violet-700" />
        </button>
      </div>
      <div class="w-24 text-center text-white">
        {{ formatRelativeTimeDiff(sharingTimeRangeFrom, sharingTimeRangeTo) }}
      </div>
      <div>
        <button
          type="button"
          class="flex w-10 h-10 rounded-full items-center justify-center bg-white disabled:bg-violet-300"
          :disabled="selectedContacts.length === 0"
          @click="increaseTimeRange"
        >
          <PlusIcon class="h-8 w-8 text-violet-700" />
        </button>
      </div>
    </div>
    <div class="w-full max-w-md mx-auto">
      <button
        @click="onShare()"
        :disabled="selectedContacts.length === 0"
        class="flex justify-center w-full px-4 py-4 font-bold text-violet-700 bg-white rounded disabled:bg-violet-300"
      >
        Share with selected ({{ selectedContacts.length }})
      </button>
    </div>
  </div>
</template>
