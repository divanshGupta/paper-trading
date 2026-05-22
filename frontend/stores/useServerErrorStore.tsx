// stores/serverErrorStore.js

import { create } from "zustand";

// type
interface ServerErrorState {
  serverError: boolean;
  setServerError: (value: boolean) => void;
}

// actual store
export const useServerErrorStore = create<ServerErrorState>((set) => ({
  serverError: false,

  setServerError: (value) =>
    set({ serverError: value }),
}));