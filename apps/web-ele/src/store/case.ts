import { acceptHMRUpdate, defineStore } from 'pinia';

export const useCaseStore = defineStore('caseStore', {
  state: () => ({
    isUpdated: false,
    caseStatusMap: {} as Record<string, { owner: string; zeren: string }>,
    exceptionReasonList: [] as any[],
    suspendReasonList: [] as any[],
    specialJudgmentList: [] as any[],
  }),
  getters: {
    exceptionReasonMap(state) {
      const map: Record<string, string> = {};
      state.exceptionReasonList.forEach((item) => {
        if (item.id && item.title) {
          map[String(item.id)] = item.title;
        }
      });
      return map;
    },
    suspendReasonMap(state) {
      const map: Record<string, string> = {};
      state.suspendReasonList.forEach((item) => {
        if (item.id && item.title) {
          map[String(item.id)] = item.title;
        }
      });
      return map;
    },
    specialJudgmentMap(state) {
      const map: Record<string, string> = {};
      state.specialJudgmentList.forEach((item) => {
        if (item.id && item.title) {
          map[String(item.id)] = item.title;
        }
      });
      return map;
    },
  },
  actions: {
    changeCaseStatus(status: boolean) {
      this.isUpdated = status;
    },
    updateCaseStatus(id: string, status: { owner?: string; zeren?: string }) {
      if (!this.caseStatusMap[id]) {
        this.caseStatusMap[id] = { zeren: '', owner: '' };
      }
      this.caseStatusMap[id] = { ...this.caseStatusMap[id], ...status };
    },
    async fetchExceptionReasons() {
      // Import dynamically to avoid circular dependencies if any
      const { CaseExceptionApi } = await import('#/api/core/case-exception');
      try {
        const res = await CaseExceptionApi.getExceptionReasonList();
        this.exceptionReasonList = res;
      } catch (error) {
        console.error('Failed to fetch exception reasons:', error);
      }
    },
    async fetchSuspendReasons() {
      const { CaseSuspendApi } = await import('#/api/core/case-suspend');
      try {
        const res = await CaseSuspendApi.getSuspendReasonList();
        this.suspendReasonList = res;
      } catch (error) {
        console.error('Failed to fetch suspend reasons:', error);
      }
    },
    async fetchSpecialJudgmentList() {
      const { CaseSpecialJudgmentApi } =
        await import('#/api/core/case-special-judgment');
      try {
        const res = await CaseSpecialJudgmentApi.getSpecialJudgmentTagList();
        this.specialJudgmentList = res;
      } catch (error) {
        console.error('Failed to fetch special judgment list:', error);
      }
    },
    // Helper to format string "1,2" to ["Major", "Complex"]
    getExceptionLabels(ids?: string) {
      if (!ids) return [];
      const map = this.exceptionReasonMap;
      return ids
        .split(',')
        .map((id) => map[id.trim()] || id)
        .filter(Boolean);
    },
    getSuspendLabels(ids?: string) {
      if (!ids) return [];
      const map = this.suspendReasonMap;
      return ids
        .split(',')
        .map((id) => map[id.trim()] || id)
        .filter(Boolean);
    },
    getSpecialJudgmentLabels(ids?: string) {
      if (!ids) return [];
      const map = this.specialJudgmentMap;
      return ids
        .split(',')
        .map((id) => map[id.trim()] || id)
        .filter(Boolean);
    },
  },
  persist: true,
});

// 解决热更新问题
const hot = import.meta.hot;
if (hot) {
  hot.accept(acceptHMRUpdate(useCaseStore, hot));
}
