import { defineStore } from 'pinia';

export const useCustomerStore = defineStore('customerStore', {
  state: () => ({
    isUpdated: false,
  }),
  actions: {
    changeCustomerStatus(status: boolean) {
      this.isUpdated = status;
    },
  },
});
