import { defineStore } from 'pinia';

export const useCaseStore = defineStore('caseStore', {
  state: () => ({
    isUpdated: false,
  }),
  actions: {
    changeCaseStatus(status: boolean) {
      this.isUpdated = status;
    },
  },
});
