import { reactive, onMounted } from "vue";
import localforage from "localforage";

export type Contact = {
  fingerprint: string;
  username: string;
  publicKey: JsonWebKey;
  addedAt: Date;
};

var contactsStore = localforage.createInstance({
  name: "contacts",
});

// Create a reactive state for managing contacts
const contacts = reactive<Contact[]>([]);

export const useContacts = () => {
  // Define a computed property for filtering contacts by name
  // const filterContacts = computed(() => {
  //  return contacts.filter((contact) => contact.name.includes(search));
  // });

  // Define a function for loading contact data from the API
  const loadContacts = async () => {
    const entries: Contact[] = [];
    await contactsStore.iterate((value: Omit<Contact, "fingerprint">, key) => {
      entries.push({ fingerprint: key, ...value });
    });
    contacts.splice(0, contacts.length, ...entries);
  };

  // Define a function for adding a new contact
  const createContact = async (contact: Contact) => {
    const { fingerprint, ...data } = contact;
    try {
      await contactsStore.setItem(fingerprint, data);
      loadContacts();
    } catch (err) {
      console.error("Unable to create contact", err);
    }
  };

  // Define a function for removing a contact
  const removeContact = async (fingerprint: string) => {
    try {
      await contactsStore.removeItem(fingerprint);
      loadContacts();
    } catch (err) {
      console.error("Unable to delete contact", err);
    }
  };

  // Load the contact data when the component is mounted
  onMounted(loadContacts);

  // Return the reactive state and the functions
  return {
    contacts,
    createContact,
    removeContact,
    loadContacts,
  };
};
