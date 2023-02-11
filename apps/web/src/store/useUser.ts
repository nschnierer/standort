import { reactive, onMounted } from "vue";
import localforage from "localforage";
import { Contact } from "./useContacts";

export type User = {
  username: string;
  publicKey?: JsonWebKey;
  privateKey?: JsonWebKey;
  updatedAt: Date;
  createdAt: Date;
};

var contactsStore = localforage.createInstance({
  name: "app",
});

const USER_ITEM_KEY = "user";

// Create a reactive state for managing contacts
const user = reactive<User>({
  username: "",
  createdAt: new Date(),
  updatedAt: new Date(),
});

export const useUser = () => {
  // Define a function for loading contact data from the API
  const loadUser = async () => {
    try {
      const data = await contactsStore.getItem<User>(USER_ITEM_KEY);
      Object.assign(user, data);
    } catch (err) {
      console.log("Unable to load user", err);
    }
  };

  const updateUser = async (data: Omit<User, "createdAt" | "updatedAt">) => {
    try {
      const newUser = {
        ...user,
        ...data,
        updatedAt: new Date(),
        createdAt: user.createdAt,
      } as User;
      await contactsStore.setItem(
        USER_ITEM_KEY,
        JSON.parse(JSON.stringify(newUser))
      );
    } catch (err) {
      console.error("Unable to create contact", err);
    }
    await loadUser();
  };

  // Load the contact data when the component is mounted
  onMounted(loadUser);

  // Return the reactive state and the functions
  return {
    user,
    loadUser,
    updateUser,
  };
};
