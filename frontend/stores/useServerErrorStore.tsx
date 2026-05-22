// stores/serverErrorStore.js

import { create } from "zustand";

interface ServerErrorState {
  serverError: boolean;
  setServerError: (value: boolean) => void;
}

export const useServerErrorStore = create<ServerErrorState>((set) => ({
  serverError: false,

  setServerError: (value: any) =>
    set({ serverError: value }),
}));