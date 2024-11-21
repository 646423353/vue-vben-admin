import { defineStore } from 'pinia';

interface AppState {
  /**
   * userId
   */
  userId: null | number;
}

export const useUserIdStore = defineStore('userId', {
  actions: {
    resetUserId() {
      this.userId = null;
    },

    setUserId(id: number) {
      this.userId = id;
    },
  },
  persist: {
    pick: ['userId'],
  },
  state: (): AppState => ({
    userId: null,
  }),
});
