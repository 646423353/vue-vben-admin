import { defineStore } from 'pinia';

export const usePolicyStore = defineStore('policyStore', {
  state: () => ({
    isUpdated: false,
  }),
  actions: {
    changePolicyStatus(status: boolean) {
      this.isUpdated = status;
    },
  },
});
