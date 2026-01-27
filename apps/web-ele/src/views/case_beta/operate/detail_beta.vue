<script lang="ts" setup>
import type { CaseAlarmApi } from '#/api/core/case-alarm';
import type { TbCaseComment } from '#/api/core/case-comment';
import type { TbCaseFinal } from '#/api/core/case-final';
import type { CaseMoneyApi } from '#/api/core/case-money';
import type { TbCasePeifu } from '#/api/core/case-peifu';
import type { TbCaseWithBLOBs } from '#/api/core/case-record';
import type { TbCaseUserTimeline } from '#/api/core/case-timeline';

import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page, useVbenModal } from '@vben/common-ui';
import { useTabs } from '@vben/hooks';
import { ArrowDown, createIconifyIcon } from '@vben/icons';
import { useUserStore } from '@vben/stores';

import { useIntersectionObserver } from '@vueuse/core';
import {
  ElIcon,
  ElMessage,
  ElStep,
  ElSteps,
  ElTabPane,
  ElTabs,
} from 'element-plus';
import moment from 'moment';

import { getCaseAlarmListApi } from '#/api/core/case-alarm';
import { getCaseCommentListApi } from '#/api/core/case-comment';
import { getCaseFinalListApi } from '#/api/core/case-final';
import { DingsunMoneyGetApi } from '#/api/core/case-money';
import { getCasePeifuListApi } from '#/api/core/case-peifu';
import {
  caseRecordBackApi,
  caseRecordBlockApi,
  caseRecordCloseApi,
  caseRecordExceptionApi,
  CaseRecordGetApi,
  CaseRecordLockApi,
  CaseRecordUnlockApi,
} from '#/api/core/case-record';
import {
  getTimelineListApi,
  updateTimelineApi,
} from '#/api/core/case-timeline';

import { useCaseStore } from '../../../store/case';
import CaseCommLog from '../components/CaseCommLog_beta.vue';
import CaseImages from '../components/CaseImages.vue';
import CaseInfo from '../components/CaseInfo.vue';
import CaseReminderList from '../components/CaseReminderList.vue';
import CaseRiskInfo from '../components/CaseRiskInfo.vue';
import CompensationModal from '../components/CompensationModal.vue';
import DockingModal from '../components/DockingModal.vue';
import InsuranceDockingModal from '../components/InsuranceDockingModal.vue';
import LossAssessmentModal from '../components/LossAssessmentModal.vue';
import NegotiationModal from '../components/NegotiationModal.vue';
import NegotiationTableModal from '../components/NegotiationTableModal.vue';
import NoteCard from '../components/NoteCard.vue';
import NoteCardActions from '../components/NoteCardActions.vue';
import TimelineItemContent from '../components/TimelineItemContent.vue';
import UpdateAccidentInfoModal from '../components/UpdateAccidentInfoModal.vue';
import ValueAssessmentModal from '../components/ValueAssessmentModal.vue';
import ReasonModal from './ReasonModal.vue';

// Helper to get theme color based on role id
const getRoleTheme = (roleId?: number) => {
  if (!roleId) return 'blue';

  const id = Number(roleId);
  if (id === 13 || id === 1) return 'blue'; // 管理员(13), 超级管理员(1)
  if (id === 19) return 'green'; // 理赔客服
  if (id === 20) return 'orange'; // 定损员
  if (id === 21) return 'purple'; // 初审及保司对接员
  if (id === 22) return 'cyan'; // 理赔管理员

  return 'blue'; // Fallback
};

const riskCount = ref(0);
const reminderCount = ref(0);
const latestRiskWarning = ref<CaseAlarmApi.TbCaseYujing[]>([]);

const fetchRiskCount = async () => {
  if (!id.value) return;
  try {
    const res = await getCaseAlarmListApi({
      caseId: id.value,
      page: 1,
      size: 100,
    });
    riskCount.value = res.total || 0;
    latestRiskWarning.value = (res.list || []) as any; // Store all list
  } catch (error) {
    console.error('Failed to fetch risk count:', error);
  }
};

const WarningFilled = createIconifyIcon('ep:warning-filled');

const route = useRoute();
const useRouterInstance = useRouter();
const { closeCurrentTab } = useTabs();
const userStore = useUserStore();
const caseStore = useCaseStore();

const caseForm = reactive<TbCaseWithBLOBs>({
  files: [],
  zts: [],
} as TbCaseWithBLOBs);

const id = ref(String(route.query.id));
// const processMode = ref(route.query.processMode as string); // Removed
const ownerFromQuery = ref(route.query.owner as string); // Case owner from list page
const isLocked = ref(false); // Track if case is successfully locked
const logCount = ref(0);
const activeTab = ref('detail');
const isExpanded = ref(false);
const lossAssessmentData = ref<CaseMoneyApi.TbCaseMoneyDetails | null>(null);
const historyRefreshKey = ref(0);

const imageCount = computed(() => caseForm.files?.length || 0);

const formatTime = (time: number | string | undefined) => {
  if (!time) return '';
  return moment(Number(time)).format('YYYY-MM-DD HH:mm:ss');
};

const formatDuration = (hours?: number | string) => {
  if (!hours) return '';
  const numHours = Number(hours);
  if (Number.isNaN(numHours)) return '';

  if (numHours >= 24) {
    const days = Math.floor(numHours / 24);
    const remainingHours = numHours % 24;
    return remainingHours > 0 ? `${days}天${remainingHours}小时` : `${days}天`;
  }
  return `${numHours}小时`;
};

const steps = [
  { title: '案件待定损' },
  { title: '已有定损表待对接' },
  { title: '已创建保司对接表待提交' },
  { title: '已提交保司待保司反馈' },
  { title: '已有保司反馈待客户确认' },
  { title: '客户协商已完成' },
  { title: '理赔付款已完成' },
];

const getCaseDetail = async (id: number | string) => {
  const res = await CaseRecordGetApi(id);
  if (!res) return;

  Object.assign(caseForm, res);

  // Ensure numeric fields are correctly typed if needed, though Partial<TbCaseWithBLOBs> handles string | number often.
  // We might want to ensure 'zts' and 'files' are arrays.
  caseForm.zts = res.zts || [];
  caseForm.files = res.files || [];

  // Mock data for Status and Risk Display (These are not in TbCaseWithBLOBs yet, so we cast or add to type if needed, or just let them be flexible as caseForm is reactive)
  // Since caseForm is Partial<TbCaseWithBLOBs>, we might need to cast to any to add these extra display properties if they aren't in the interface.
  // Or better, define an intersection type. For now, we'll cast caseForm to any for these assignments to avoid TS errors if they are missing from TbCaseWithBLOBs.
  const formAny = caseForm as any;

  // Dynamic Status and Tags
  formAny.runStatusString = res.guaqiTag === 1 ? '挂起' : '';

  formAny.hangUpTag = res.guaqiTag === 1 ? res.guaqiType || '' : '';

  formAny.abnormalTag =
    res.exceptionTag === 1 ? res.exceptionType || '异常' : '';
  // Check edit permissions based on latest data
  await checkEditPermission(res);
};

// Logic to check edit permission based on case details
const checkEditPermission = async (caseData: any) => {
  const currentUserId = String(userStore.userInfo?.id || '');
  const isCheckMode = route.query.check === '1';

  // Rule 0: Check Mode (force read-only)
  if (isCheckMode) {
    isLocked.value = false;
    return;
  }

  // Use data from API
  const zerenVal = String(caseData.zeren || ''); // Default to empty if missing
  const ownerVal = String(caseData.owner || ''); // Default to empty

  // Store for reference (though current logic relies on API data now)
  ownerFromQuery.value = ownerVal;

  const isOwner = ownerVal === currentUserId;

  // Rule 1: zeren == -1 -> Enable edit (and Lock if needed)
  if (zerenVal === '-1') {
    // If it's -1, it means we need to CLAIM it (lock it)
    try {
      await CaseRecordLockApi(id.value);
      isLocked.value = true;
      ownerFromQuery.value = currentUserId;

      // Update local state to reflect the lock immediately
      // (Optional: update store too if needed)
      caseStore.updateCaseStatus(id.value, {
        zeren: '7',
        owner: currentUserId,
      });
    } catch (error: any) {
      console.error('Failed to lock case:', error);
      isLocked.value = false;
      const errorMsg = error?.message || '案件被其他用户锁定，无法编辑';
      ElMessage.error(errorMsg);
    }
  } else if (isOwner && zerenVal === '7') {
    // Rule 2: owner == me && zeren == 7 -> Enable edit (Already claimed)
    isLocked.value = true;
  } else {
    // Rule 3: Others -> Disable edit
    isLocked.value = false;
  }
};

// 统一初始化函数
const initData = async () => {
  if (!id.value) return;

  // 1. 获取详情并完成潜在的锁定操作（必须await）
  await getCaseDetail(id.value);

  // 2. 只有在详情（和权限）确定后，才加载其他数据
  timelinePage.value = 1;
  fetchTimeline();
  fetchLossAssessmentData();
  fetchRiskCount();
  caseStore.fetchExceptionReasons();
  caseStore.fetchSuspendReasons();
};

onMounted(() => {
  id.value = route.query.id as string;
  ownerFromQuery.value = route.query.owner as string;

  // Initial permissions check related to query param can stay,
  // but getCaseDetail will overwrite isLocked status anyway.
  const isCheckMode = route.query.check === '1';
  if (isCheckMode) {
    isLocked.value = false;
  }

  // Trigger init
  initData();
});

// Watch for ID changes (e.g. rewriting routes)
watch(
  () => route.query.id,
  (newId) => {
    if (newId && newId !== id.value) {
      id.value = newId as string;
      initData();
    }
  },
);

// Removed the old watch on id.value to prevent double/concurrent fetching
// watch(
//   () => id.value,
//   (newId) => {
//     if (newId) {
//       timelinePage.value = 1;
//       fetchTimeline();
//     }
//   },
// );

const [DockingModalComponent, dockingModalApi] = useVbenModal({
  connectedComponent: DockingModal,
});
const [NegotiationModalComponent, negotiationModalApi] = useVbenModal({
  connectedComponent: NegotiationModal,
});
const [NegotiationTableModalComponent, negotiationTableModalApi] = useVbenModal(
  {
    connectedComponent: NegotiationTableModal,
  },
);

const [CompensationModalComponent, compensationModalApi] = useVbenModal({
  connectedComponent: CompensationModal,
});

const [InsuranceDockingModalComponent, insuranceDockingModalApi] = useVbenModal(
  {
    connectedComponent: InsuranceDockingModal,
  },
);

const [ReasonModalComponent, reasonModalApi] = useVbenModal({
  connectedComponent: ReasonModal,
});

function openDockingModal(record?: any) {
  const data: any = { caseId: id.value };
  if (record) {
    data.commentId = record.id;
  }
  dockingModalApi.setData(data);
  dockingModalApi.open();
}

function openNegotiationModal(record?: any) {
  const data: any = { caseId: id.value };
  if (record) {
    data.commentId = record.id;
  }
  negotiationModalApi.setData(data);
  negotiationModalApi.open();
}

function openNegotiationTableModal(record?: any) {
  negotiationTableModalApi.setData({
    caseId: id.value,
    subjects: caseForm.zts,
    record,
  });
  negotiationTableModalApi.open();
}

function openCompensationModal() {
  compensationModalApi.setData({
    caseId: id.value,
    subjects: caseForm.zts,
  });
  compensationModalApi.open();
}

function openInsuranceDockingModal(record?: any) {
  const data: any = {
    caseId: id.value,
    creditcard: caseForm.creditcard,
    insureTime: caseForm.insureTime,
  };

  // 如果传入了record，表示编辑模式
  if (record) {
    data.record = record;
    data.isEdit = true;
  } else {
    data.isEdit = false;
  }

  insuranceDockingModalApi.setData(data);
  insuranceDockingModalApi.open();
}

const [UpdateAccidentInfoModalComponent, updateAccidentInfoModalApi] =
  useVbenModal({
    connectedComponent: UpdateAccidentInfoModal,
  });

function openUpdateAccidentModal() {
  updateAccidentInfoModalApi.setData({
    caseId: id.value,
    caseData: { ...caseForm },
  });
  updateAccidentInfoModalApi.open();
}

function openUpdateAccidentModalReadonly() {
  updateAccidentInfoModalApi.setData({
    caseId: id.value,
    caseData: { ...caseForm },
    readonly: true,
    customTitle: '案件基本信息',
  });
  updateAccidentInfoModalApi.open();
}

const [LossAssessmentModalComponent, lossAssessmentModalApi] = useVbenModal({
  connectedComponent: LossAssessmentModal,
});

function openLossAssessmentModal() {
  lossAssessmentModalApi.setData({
    caseId: id.value,
    subjects: caseForm.zts || [],
    isReadonly: !isLocked.value,
    onSuccess: () => {
      fetchLossAssessmentData();
    },
  });
  lossAssessmentModalApi.open();
}

const fetchLossAssessmentData = async () => {
  if (!id.value) return;
  try {
    const res = await DingsunMoneyGetApi(id.value);
    lossAssessmentData.value = res;
  } catch (error) {
    console.error('Failed to fetch loss assessment data:', error);
  }
};

const [ValueAssessmentModalComponent, valueAssessmentModalApi] = useVbenModal({
  connectedComponent: ValueAssessmentModal,
});

function openValueAssessmentModal() {
  const fileList = (caseForm.files || []).map((file) => ({
    label: `${file.title || '未知文件'} - ${file.cateName || '未知标签'}`,
    value: file.id || '',
  }));
  valueAssessmentModalApi.setData({
    caseId: id.value,
    fileList,
    zts: caseForm.zts || [],
    isRiderUpdated: !isLocked.value,
    isThreeUpdated: !isLocked.value,
    onSuccess: () => {
      fetchLossAssessmentData();
    },
  });
  valueAssessmentModalApi.open();
}

// 案件操作处理函数
// 暂存的操作指令（备注内容）
const currentCommand = ref('');

// 案件操作处理函数
// 退回前一处理人
const handleBack = (command?: string) => {
  currentCommand.value = command || '';
  reasonModalApi.setData({
    title: '退回前一处理人',
    label: '请输入退回理由（多个以英文逗号隔开）：',
    type: 'back',
    mode: 'input',
  });
  reasonModalApi.open();
};

// 转异常
const handleException = (command?: string) => {
  currentCommand.value = command || '';
  const exceptionOptions = caseStore.exceptionReasonList.map((item) => ({
    label: item.title,
    value: String(item.id),
  }));
  reasonModalApi.setData({
    options: exceptionOptions,
    title: '转异常',
    type: 'exception',
  });
  reasonModalApi.open();
};

// 挂起
const handleBlock = (command?: string) => {
  currentCommand.value = command || '';
  const blockOptions = caseStore.suspendReasonList.map((item) => ({
    label: item.title,
    value: String(item.id),
  }));
  reasonModalApi.setData({
    options: blockOptions,
    title: '挂起',
    type: 'block',
  });
  reasonModalApi.open();
};

const handleReasonSuccess = async ({
  type,
  value,
}: {
  type: string;
  value: string | string[];
}) => {
  try {
    let reason = '';
    reason = Array.isArray(value) ? value.join(',') : value;

    switch (type) {
      case 'back': {
        await caseRecordBackApi({
          caseId: String(id.value),
          reason,
          command: currentCommand.value,
        });
        ElMessage.success('退回成功');

        break;
      }
      case 'block': {
        await caseRecordBlockApi({
          caseId: String(id.value),
          reason,
          command: currentCommand.value,
        });
        ElMessage.success('挂起成功');

        break;
      }
      case 'close': {
        await caseRecordCloseApi({
          caseId: String(id.value),
          reason,
          command: currentCommand.value,
        });
        ElMessage.success('结案成功');

        break;
      }
      case 'exception': {
        await caseRecordExceptionApi({
          caseId: String(id.value),
          reason,
          command: currentCommand.value,
        });
        ElMessage.success('转异常成功');

        break;
      }
      // No default
    }
    await getCaseDetail(id.value);
    await closeCurrentTab();
    caseStore.changeCaseStatus(true);
    useRouterInstance.push('/case_beta/list_beta');
  } catch (error) {
    console.error(error);
    ElMessage.error('操作失败');
  }
};

// 已确认赔付结案
const handleClose = (command?: string) => {
  currentCommand.value = command || '';
  reasonModalApi.setData({
    title: '已确认赔付结案',
    label: '请输入结案备注：',
    type: 'close',
    mode: 'input',
  });
  reasonModalApi.open();
};

// Timeline Logic
const timelineList = ref<TbCaseUserTimeline[]>([]);
const timelinePage = ref(1);
const timelineSize = ref(5);
const timelineTotal = ref(0);
const timelineLoading = ref(false);
const hasMoreTimeline = computed(
  () => timelineList.value.length < timelineTotal.value,
);
const sentinel = ref<HTMLElement | null>(null);

// Store communication records for each timeline item (keyed by cid)
const commentRecords = ref<Record<number, TbCaseComment[]>>({});
// Store peifu records for each timeline item (keyed by pid)
const peifuRecords = ref<Record<number, TbCasePeifu[]>>({});
// Store final payment records for each timeline item (keyed by fid)
const finalRecords = ref<Record<number, TbCaseFinal[]>>({});
// Store latest negotiation time for each timeline item (keyed by item.id)
const latestNegotiationTimes = ref<Record<number | string, number>>({});

const handleUpdateNegotiationTime = (
  time: number,
  itemId?: number | string,
) => {
  if (itemId) {
    latestNegotiationTimes.value[itemId] = time;
  }
};

const fetchTimeline = async () => {
  if (timelineLoading.value) return;
  timelineLoading.value = true;
  try {
    const res = await getTimelineListApi({
      page: timelinePage.value,
      size: timelineSize.value,
      id: id.value,
    });
    const list = res.list || [];
    if (timelinePage.value === 1) {
      timelineList.value = list;
    } else {
      timelineList.value.push(...list);
    }
    timelineTotal.value = res.total || 0;
    timelinePage.value += 1;

    // Fetch comment records for each timeline item that has cid
    await fetchCommentRecordsForTimeline(list);
    await fetchPeifuRecordsForTimeline(list);
    await fetchFinalRecordsForTimeline(list);
  } catch (error) {
    console.error('Failed to fetch timeline:', error);
  } finally {
    timelineLoading.value = false;
  }
};

// Fetch comment records for timeline items with cid
const fetchCommentRecordsForTimeline = async (items: TbCaseUserTimeline[]) => {
  for (const item of items) {
    if (!item.id) continue;

    // Check if valid to fetch: Must be latest item OR have cid
    const isLatest =
      timelineList.value.length > 0 && timelineList.value[0]?.id === item.id;
    if (!isLatest && !item.cid) continue;

    try {
      const params: any = {
        caseId: id.value,
        page: 1,
        size: 10,
      };

      // Only add maxId if cid exists
      if (item.cid) {
        params.maxId = String(item.cid);
      }

      const res = await getCaseCommentListApi(params);

      if (res && res.list && item.id) {
        commentRecords.value[item.id] = res.list;
      }
    } catch (error) {
      console.error(`Failed to fetch comments for item ${item.id}:`, error);
      if (item.id) {
        commentRecords.value[item.id] = [];
      }
    }
  }
};

// Fetch peifu records for timeline items with pid
const fetchPeifuRecordsForTimeline = async (items: TbCaseUserTimeline[]) => {
  for (const item of items) {
    if (!item.id) continue;

    // Check if valid to fetch: Must be latest item OR have pid
    const isLatest =
      timelineList.value.length > 0 && timelineList.value[0]?.id === item.id;
    if (!isLatest && !item.pid) continue;

    try {
      const params: any = {
        caseId: id.value,
        page: 1,
        size: 10,
      };

      if (item.pid) {
        params.maxId = String(item.pid);
      }

      const res = await getCasePeifuListApi(params);
      if (res && res.list && item.id) {
        peifuRecords.value[item.id] = res.list;
      }
    } catch (error) {
      console.error(
        `Failed to fetch peifu records for item ${item.id}:`,
        error,
      );
      if (item.id) {
        peifuRecords.value[item.id] = [];
      }
    }
  }
};

// Fetch final payment records for timeline items with fid
const fetchFinalRecordsForTimeline = async (items: TbCaseUserTimeline[]) => {
  for (const item of items) {
    if (!item.id) continue;

    // Check if valid to fetch: Must be latest item OR have fid
    const isLatest =
      timelineList.value.length > 0 && timelineList.value[0]?.id === item.id;
    if (!isLatest && !item.fid) continue;

    try {
      const params: any = {
        caseId: id.value,
        page: 1,
        size: 10,
      };

      if (item.fid) {
        params.maxId = String(item.fid);
      }

      const res = await getCaseFinalListApi(params);
      if (res && res.list && item.id) {
        finalRecords.value[item.id] = res.list;
      }
    } catch (error) {
      console.error(
        `Failed to fetch final records for item ${item.id}:`,
        error,
      );
      if (item.id) {
        finalRecords.value[item.id] = [];
      }
    }
  }
};

const handleSaveDraft = async (item: TbCaseUserTimeline, content: string) => {
  if (!content) {
    ElMessage.warning('请输入备注内容');
    return;
  }
  try {
    await updateTimelineApi({ id: item.id!, remark: content });
    ElMessage.success('保存草稿成功');
    item.remark = content;
  } catch (error) {
    console.error(error);
  }
};

const handleSubmit = async (content: string) => {
  if (!content) {
    ElMessage.warning('请输入提交内容');
    return;
  }
  try {
    if (id.value) {
      await CaseRecordUnlockApi(id.value, content);
      caseStore.updateCaseStatus(id.value, {
        zeren: '-1',
      });
      ElMessage.success('提交成功');

      await closeCurrentTab();
      caseStore.changeCaseStatus(true);
      useRouterInstance.push('/case_beta/list_beta');
    }
  } catch (error) {
    console.error('Failed to submit/unlock case:', error);
    ElMessage.error('提交失败');
  }
};

const loadMoreTimeline = () => {
  if (hasMoreTimeline.value && !timelineLoading.value) {
    fetchTimeline();
  }
};

useIntersectionObserver(sentinel, (entries) => {
  const entry = entries[0];
  if (
    entry?.isIntersecting &&
    !timelineLoading.value &&
    hasMoreTimeline.value
  ) {
    loadMoreTimeline();
  }
});

function handleReloadList() {
  // Reload both case detail and timeline
  if (id.value) {
    getCaseDetail(id.value);
    timelinePage.value = 1;
    fetchTimeline();
    fetchRiskCount();
    historyRefreshKey.value += 1;
  }
}

// Initial load
// Old watch removed to prevent concurrent requests.
// Logic moved to initData called by onMounted and route watcher.
</script>

<template>
  <Page :title="`案件详情 ${id}`" content-class="!p-0 md:!p-4">
    <div class="mx-auto max-w-7xl">
      <div class="rounded-xl bg-white shadow-sm dark:bg-slate-900">
        <ElTabs v-model="activeTab" class="demo-tabs px-6 pt-4">
          <ElTabPane name="detail">
            <template #label>
              <span class="text-base font-medium">基础信息</span>
            </template>
            <div
              class="relative border-b border-gray-100 pb-8 dark:border-gray-800"
            >
              <div
                class="overflow-hidden transition-all duration-300"
                :class="[isExpanded ? 'max-h-[5000px]' : 'max-h-[280px]']"
              >
                <div class="py-4">
                  <CaseInfo
                    :case-id="id"
                    :case-info="caseForm"
                    :file-list="caseForm.files || []"
                    :show-images="false"
                  />
                </div>
              </div>

              <!-- Expand/Collapse Button -->
              <div
                class="absolute bottom-0 left-0 right-0 flex cursor-pointer justify-center bg-gradient-to-t from-white via-white to-transparent py-4 dark:from-slate-900 dark:via-slate-900"
                @click="isExpanded = !isExpanded"
              >
                <div
                  class="flex items-center rounded-full bg-blue-50 px-6 py-1.5 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-100 dark:bg-slate-800 dark:text-blue-400 dark:hover:bg-slate-700"
                >
                  <span class="mr-1">{{
                    isExpanded ? '收起详情' : '展开详情'
                  }}</span>
                  <ElIcon
                    class="transition-transform duration-300"
                    :class="[isExpanded ? 'rotate-180' : '']"
                  >
                    <ArrowDown />
                  </ElIcon>
                </div>
              </div>
            </div>

            <!-- Process Flow Diagram -->
            <div class="mt-6 px-2">
              <!-- Mobile: Vertical Steps -->
              <div class="block md:hidden">
                <ElSteps
                  :active="(caseForm.status ?? 1) - 1"
                  :space="45"
                  direction="vertical"
                  finish-status="success"
                >
                  <ElStep
                    v-for="step in steps"
                    :key="step.title"
                    :title="step.title"
                  />
                </ElSteps>
              </div>

              <!-- Desktop: Horizontal Steps -->
              <div class="hidden overflow-x-auto pb-4 md:block">
                <ElSteps
                  :active="(caseForm.status ?? 1) - 1"
                  align-center
                  class="min-w-[800px]"
                  finish-status="success"
                >
                  <ElStep
                    v-for="step in steps"
                    :key="step.title"
                    :title="step.title"
                  />
                </ElSteps>
              </div>
            </div>

            <!-- Risk Log Alert -->
            <div v-if="latestRiskWarning.length > 0" class="mt-4 px-6">
              <div
                v-for="warning in latestRiskWarning"
                :key="warning.id"
                class="mb-2 rounded-md border border-red-100 bg-red-50 p-3 dark:border-red-900/30 dark:bg-red-900/20"
              >
                <div
                  class="flex items-center text-sm font-bold text-red-600 dark:text-red-400"
                >
                  <ElIcon class="mr-2"><WarningFilled /></ElIcon>
                  【{{ warning.zt }}】 {{ warning.rules }} (触发时间:
                  {{ formatTime(warning.created) }})
                </div>
              </div>
            </div>

            <!-- Note Card Operation/History Area -->
            <div class="mt-6 space-y-6">
              <!-- View Mode Status Hint -->
              <div v-if="!isLocked" class="flex items-center gap-4 px-2">
                <div class="h-px flex-1 bg-gray-200 dark:bg-gray-700"></div>
                <span class="text-xs text-gray-400">
                  {{
                    String(caseForm.zeren) === '7'
                      ? `当前正在由 ${caseForm.usernameOwner || (caseForm as any).ownerName || '未知用户'} 处理中，以下为历史处理记录`
                      : '当前无人处理，以下为历史操作记录'
                  }}
                </span>
                <div class="h-px flex-1 bg-gray-200 dark:bg-gray-700"></div>
              </div>

              <template v-if="timelineList.length > 0">
                <template v-for="(item, index) in timelineList" :key="item.id">
                  <NoteCard
                    :theme="getRoleTheme(item.roleId)"
                    :status="item.unlockTime ? 'history' : 'operating'"
                    :user-name="
                      item.nickname || item.lastUsername || '未知用户'
                    "
                    :role-name="item.roleName || '未知角色'"
                    :start-time="formatTime(item.startTime)"
                    :duration="formatDuration(item.durationTime)"
                    :raw-duration="item.durationTime"
                    :is-latest="index === 0"
                    :is-overdue="item.timeout !== 0"
                    :submit-time="formatTime(item.unlockTime)"
                    :submit-content="item.remark"
                    :readonly="!isLocked || index !== 0"
                    :latest-negotiation-time="
                      formatTime(latestNegotiationTimes[item.id || 0])
                    "
                    :avatar="item.file"
                    @save-draft="handleSaveDraft(item, $event)"
                    @submit="handleSubmit($event)"
                    @back="handleBack"
                    @exception="handleException"
                    @block="handleBlock"
                    @close="handleClose"
                  >
                    <template #actions>
                      <NoteCardActions
                        v-if="!item.unlockTime"
                        :theme="getRoleTheme(item.roleId)"
                        :has-loss-assessment="
                          !!lossAssessmentData && !!lossAssessmentData.id
                        "
                        @update="openUpdateAccidentModal"
                        @add-docking="openInsuranceDockingModal"
                        @add-payment="openCompensationModal"
                        @add-negotiation="openNegotiationTableModal"
                        @modify="openLossAssessmentModal"
                      />
                    </template>
                    <template #content>
                      <TimelineItemContent
                        :item="item"
                        :case-form="caseForm"
                        :comment-records="commentRecords[item.id || 0] || []"
                        :peifu-records="peifuRecords[item.id || 0] || []"
                        :final-records="finalRecords[item.id || 0] || []"
                        :loss-assessment-record="lossAssessmentData"
                        :is-first-item="index === 0"
                        :readonly="!isLocked"
                        :refresh-key="historyRefreshKey"
                        @open-value-assessment="openValueAssessmentModal"
                        @open-loss-assessment="openLossAssessmentModal"
                        @open-negotiation="openNegotiationModal"
                        @open-negotiation-table="openNegotiationTableModal"
                        @open-insurance-docking="openInsuranceDockingModal"
                        @open-docking-modal="openDockingModal"
                        @open-compensation="openCompensationModal"
                        @view-accident-info="openUpdateAccidentModalReadonly"
                        @update-negotiation-time="
                          (t) => handleUpdateNegotiationTime(t, item.id)
                        "
                        @refresh="handleReloadList"
                      />
                    </template>
                  </NoteCard>

                  <!-- Edit Mode History Divider -->
                  <div
                    v-if="isLocked && index === 0"
                    class="flex items-center gap-4 px-2"
                  >
                    <div class="h-px flex-1 bg-gray-200 dark:bg-gray-700"></div>
                    <span class="text-xs text-gray-400"
                      >以下为历史操作记录</span
                    >
                    <div class="h-px flex-1 bg-gray-200 dark:bg-gray-700"></div>
                  </div>
                </template>
              </template>
              <div
                v-else-if="!timelineLoading"
                class="flex h-32 items-center justify-center text-gray-400"
              >
                暂无处理记录
              </div>

              <!-- Loading Sentinel -->
              <div ref="sentinel" class="h-4 w-full"></div>
              <div
                v-if="timelineLoading"
                class="py-4 text-center text-gray-400"
              >
                加载中...
              </div>
              <div
                v-if="
                  !hasMoreTimeline &&
                  timelineList.length > 0 &&
                  timelinePage > 2
                "
                class="py-2 text-center text-sm text-gray-400"
              >
                没有更多数据了
              </div>
            </div>
          </ElTabPane>

          <ElTabPane name="log">
            <template #label>
              <span>
                处理日志
                <span class="text-gray-500">{{ logCount }}</span>
              </span>
            </template>
            <CaseCommLog
              :case-id="id"
              @update:total="(val) => (logCount = val)"
            />
          </ElTabPane>

          <ElTabPane name="reminder">
            <template #label>
              <span
                >关联催办
                <span class="text-gray-500">{{ reminderCount }}</span></span
              >
            </template>
            <div class="p-4">
              <CaseReminderList
                :case-id="id"
                @update:total="(val) => (reminderCount = val)"
              />
            </div>
          </ElTabPane>

          <ElTabPane name="images">
            <template #label>
              <span>
                图像文件
                <span class="text-gray-500">{{ imageCount }}</span>
              </span>
            </template>
            <div class="p-4">
              <CaseImages :file-list="caseForm.files || []" />
            </div>
          </ElTabPane>

          <ElTabPane name="risk">
            <template #label>
              <span
                >风险预警
                <span class="text-red-500">{{ riskCount }}</span></span
              >
            </template>
            <div class="px-2 py-4">
              <CaseRiskInfo :case-id="id" />
            </div>
          </ElTabPane>
        </ElTabs>
      </div>
      <DockingModalComponent @success="handleReloadList" />
      <NegotiationModalComponent @success="handleReloadList" />
      <NegotiationTableModalComponent @success="handleReloadList" />
      <CompensationModalComponent @reload-list="handleReloadList" />
      <InsuranceDockingModalComponent @reload-list="handleReloadList" />
      <UpdateAccidentInfoModalComponent @success="handleReloadList" />
      <ReasonModalComponent @success="handleReasonSuccess" />
      <LossAssessmentModalComponent
        @switch-to-value-assessment="openValueAssessmentModal"
      />
      <ValueAssessmentModalComponent />
    </div>
  </Page>
</template>

<style scoped>
:deep(.footer-button .el-form-item__content) {
  justify-content: flex-end;
}

:deep(.el-form-item .el-date-editor) {
  width: 100%;
}

:deep(.el-form-item--label-top .el-form-item__label) {
  font-weight: 600;
}
</style>
