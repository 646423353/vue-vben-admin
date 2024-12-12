import { defineStore } from 'pinia';

export const useInsureStore = defineStore('insureStore', {
  state: () => ({
    isUpdated: false,
  }),
  actions: {
    changeUpdateStatus(status: boolean) {
      this.isUpdated = status;
    },
  },
});
