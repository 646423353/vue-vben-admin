import { defineStore } from 'pinia';

export const useOrderStore = defineStore('orderStore', {
  state: () => ({
    isUpdated: false,
  }),
  actions: {
    changeOrderStatus(status: boolean) {
      this.isUpdated = status;
    },
  },
});
