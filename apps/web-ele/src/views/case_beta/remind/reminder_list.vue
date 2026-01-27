<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { CaseReminderApi } from '#/api/core/case-reminder';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';

import {
  ElButton,
  ElLink,
  ElMessage,
  ElMessageBox,
  ElPopover,
  ElTag,
} from 'element-plus';
import moment from 'moment';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { authUserListApi } from '#/api/core/authuser';
import { CaseRecordListApi } from '#/api/core/case-record';
import {
  confirmReminderResolvedApi,
  getFeedbackListApi,
  getReminderListApi,
  rejectReminderFeedbackApi,
  submitReminderFeedbackApi,
} from '#/api/core/case-reminder';

import CreateReminderModal from './CreateReminderModal.vue';
import IncreaseImportanceModal from './IncreaseImportanceModal.vue';

const router = useRouter();
const userStore = useUserStore();

const currentUserId = String(userStore.userInfo?.id || '');

// Current row for importance modal
const currentImportanceRow = ref<CaseReminderApi.TbCaseCuiban | null>(null);

// Feedback list state
const feedbackListMap = ref<Record<string, any[]>>({});
const feedbackLoadingMap = ref<Record<string, boolean>>({});

// Fetch feedback list
const fetchFeedbackList = async (cbId: string) => {
  if (feedbackListMap.value[cbId]) {
    return; // Already loaded
  }

  feedbackLoadingMap.value[cbId] = true;
  try {
    const response: any = await getFeedbackListApi(cbId);
    feedbackListMap.value[cbId] = response.list || [];
  } catch (error) {
    console.error('获取反馈列表失败:', error);
    feedbackListMap.value[cbId] = [];
  } finally {
    feedbackLoadingMap.value[cbId] = false;
  }
};

// Filter form configuration
const formOptions = {
  schema: [
    {
      component: 'ApiSelect',
      fieldName: 'receiver',
      label: '催办接收人',
      componentProps: {
        clearable: true,
        placeholder: '请选择',
        api: async () => {
          const res = await authUserListApi({
            page: 1,
            size: 1000,
            organid: 0,
            roleId: '1,13,19,20,21,22' as any,
          });
          return (
            res?.list?.map((user: any) => ({
              label: user.nickName || user.username || user.phone || '未知',
              value: user.userId || user.id,
            })) || []
          );
        },
        filterable: true,
      },
    },
    {
      component: 'ApiSelect',
      fieldName: 'caseId',
      label: '案件号',
      componentProps: {
        clearable: true,
        placeholder: '请选择',
        api: async () => {
          try {
            const res = await CaseRecordListApi({}, { page: 1, size: 1000 });
            const list = res?.list || [];
            return list.map((item: any) => ({
              label: `${item.id}-${item.name || '未知'}`,
              value: item.id,
            }));
          } catch (error) {
            console.error('获取案件列表失败:', error);
            return [];
          }
        },
        filterable: true,
      },
    },
    {
      component: 'Select',
      fieldName: 'type',
      label: '类型',
      componentProps: {
        clearable: true,
        placeholder: '请选择',
        style: { width: '200px' },
        options: [
          { label: '不限制', value: '0' },
          { label: '我创建的', value: '1' },
          { label: '我接收的', value: '2' },
          { label: '我创建的或接收的', value: '3' },
        ],
      },
      defaultValue: '0',
    },
  ],
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
  },
  layout: 'inline' as const,
  showCollapseButton: true,
  submitButtonOptions: {
    content: '查询',
  },
  resetButtonOptions: {
    content: '重置',
  },
};

// Grid options
const gridOptions: VxeTableGridOptions<CaseReminderApi.TbCaseCuiban> = {
  id: 'reminder-list-grid',
  loading: false,
  rowConfig: {
    keyField: 'id',
    isHover: true,
  },
  columnConfig: {
    resizable: true,
  },
  minHeight: 500,
  pagerConfig: {
    enabled: true,
    currentPage: 1,
    pageSize: 20,
    pageSizes: [20, 50, 100],
  },
  columns: [
    {
      field: 'id',
      title: 'ID.',
      width: 60,
      fixed: 'left',
    },
    {
      title: '当前催办风险状态',
      field: 'statusTime',
      width: 120,
      slots: { default: 'risk-status' },
    },
    {
      title: '重要程度',
      field: 'imp',
      width: 80,
      slots: { default: 'importance' },
    },
    {
      title: '截止时间',
      field: 'endTime',
      width: 140,
      slots: { default: 'deadline' },
    },
    // {
    //   title: '催办单编号',
    //   field: 'id',
    //   width: 80,
    // },
    {
      title: '催办接收人',
      field: 'receiverName',
      width: 120,
      slots: { default: 'receiver-name' },
    },
    {
      title: '关联案件编号',
      field: 'caseId',
      width: 140,
      slots: { default: 'case-ids' },
    },
    {
      title: '催办事件类型',
      field: 'type',
      width: 150,
      showOverflow: false,
      slots: { default: 'reminder-type' },
    },
    {
      title: '催办发起备注',
      field: 'zt',
      minWidth: 150,
      slots: { default: 'initiator-remark' },
    },
    {
      title: '当前状态',
      field: 'statusFeedback',
      width: 100,
      slots: { default: 'status' },
    },
    {
      title: '实际反馈时间',
      field: 'dtFeedback',
      width: 150,
      slots: { default: 'feedback-time' },
    },
    {
      title: '催办反馈备注',
      field: 'commentsFeedback',
      minWidth: 150,
      slots: { default: 'feedback-remark' },
    },
    {
      title: '发起人',
      field: 'username',
      width: 100,
    },
    {
      title: '生成时间',
      field: 'created',
      width: 150,
      slots: { default: 'created-time' },
    },
    {
      title: '操作',
      field: 'action',
      width: 120,
      fixed: 'right',
      slots: { default: 'action' },
      showOverflow: false,
    },
  ],
  scrollY: { enabled: false },
  proxyConfig: {
    response: {
      result: 'list',
      total: 'total',
      list: 'list',
    },
    ajax: {
      query: async ({ page }, formValues: any) => {
        const params: CaseReminderApi.ReminderListParams = {
          page: page.currentPage,
          size: page.pageSize,
          type: formValues?.type || '0',
          receiver: formValues?.receiver
            ? String(formValues.receiver)
            : undefined,
          caseId: formValues?.caseId ? String(formValues.caseId) : undefined,
        };
        return await getReminderListApi(params);
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions,
  gridOptions: gridOptions as any,
}); // Ref to IncreaseImportanceModal component instance
const increaseModalRef = ref<InstanceType<typeof IncreaseImportanceModal>>();

// Format time
const formatTime = (timestamp?: string) => {
  if (!timestamp) return '-';
  return moment(timestamp).format('YYYY-MM-DD HH:mm:ss');
};

// Map statusTime to display text and color
const getStatusTimeText = (statusTime?: number) => {
  if (statusTime === 2) return '最高'; // 严重超时
  if (statusTime === 1) return '中'; // 超时
  return '低'; // 未超时
};

// Map imp to display text
const getImpText = (imp?: number) => {
  if (imp === 3) return '最高';
  if (imp === 2) return '高';
  return '普通';
};

// Map status to display text, prioritize statusClose
const getStatusText = (row: CaseReminderApi.TbCaseCuiban) => {
  if (row.statusClose === '1') {
    return '已解决';
  }
  return row.statusFeedback === 1 ? '已反馈' : '未反馈';
};

// Map reminder type to display text
const getReminderTypeText = (type?: number | string) => {
  const typeMap: Record<string, string> = {
    '1': '加速定损',
    '2': '尽快联系骑手',
    '3': '尽快联系保司',
    '4': '加快案件处理',
  };

  if (!type) return '';

  const typeStr = String(type);
  const types = typeStr.split(',').map((t) => t.trim());
  return types.map((t) => typeMap[t] || t).join('、');
};

// Calculate time remaining
const getTimeRemaining = (endTime?: string) => {
  if (!endTime) return '';
  const now = Date.now();
  const deadline = new Date(endTime).getTime();
  const remaining = deadline - now;
  if (remaining < 0) return '已超时';

  const minutes = Math.floor(remaining / 60_000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}天${hours % 24}小时`;
  if (hours > 0) return `${hours}小时${minutes % 60}分钟`;
  return `${minutes}分钟`;
};

// Check if deadline is urgent (<30min)
const isUrgent = (endTime?: string) => {
  if (!endTime) return false;
  const remaining = new Date(endTime).getTime() - Date.now();
  return remaining > 0 && remaining < 30 * 60 * 1000;
};

// Navigate to case detail
const handleViewCase = (caseId: string) => {
  router.push(`/case_beta/detail_beta?id=${caseId}&check=1`);
};

// Check if user is initiator
const isInitiator = (row: CaseReminderApi.TbCaseCuiban) => {
  return row.uid === currentUserId;
};

// Check if user is receiver
const isReceiver = (row: CaseReminderApi.TbCaseCuiban) => {
  return row.receiver && String(row.receiver) === currentUserId;
};

// Determine which buttons to show
const canSubmitFeedback = (row: CaseReminderApi.TbCaseCuiban) => {
  return row.statusFeedback === 0 && row.statusClose === '0' && isReceiver(row);
};

const canConfirmResolved = (row: CaseReminderApi.TbCaseCuiban) => {
  return (
    row.statusFeedback === 1 && row.statusClose === '0' && isInitiator(row)
  );
};

const canRejectFeedback = (row: CaseReminderApi.TbCaseCuiban) => {
  return (
    row.statusFeedback === 1 && row.statusClose === '0' && isInitiator(row)
  );
};

const canIncreaseImportance = (row: CaseReminderApi.TbCaseCuiban) => {
  return row.statusClose === '0' && isInitiator(row) && row.imp !== 3;
};

// Actions
const handleSubmitFeedback = async (row: CaseReminderApi.TbCaseCuiban) => {
  try {
    const { value } = await ElMessageBox.prompt('请输入反馈内容', '提交反馈', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputType: 'textarea',
      inputPlaceholder: '请输入反馈内容',
      inputValidator: (value) => {
        if (!value || !value.trim()) {
          return '反馈内容不能为空';
        }
        return true;
      },
    });

    await submitReminderFeedbackApi({
      cuibanId: row.id!,
      commentsFeedback: value,
    });

    // 清除缓存以便重新加载
    delete feedbackListMap.value[String(row.id)];

    ElMessage.success('提交反馈成功');
    gridApi.reload();
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('提交反馈失败:', error);
      ElMessage.error(error.message || '提交反馈失败');
    }
  }
};

const handleConfirmResolved = async (row: CaseReminderApi.TbCaseCuiban) => {
  try {
    await ElMessageBox.confirm('确认该催办已解决?', '确认解决', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });

    // 获取反馈列表，使用最新一条记录的ID
    const response: any = await getFeedbackListApi(String(row.id));
    const feedbackList = response.list || [];

    if (feedbackList.length === 0) {
      ElMessage.error('未找到反馈记录');
      return;
    }

    // 使用最新一条记录的ID（列表第一条）
    const latestFeedbackId = feedbackList[0].id;

    await confirmReminderResolvedApi(latestFeedbackId);

    // 清除缓存以便重新加载
    delete feedbackListMap.value[String(row.id)];

    ElMessage.success('确认解决成功');
    gridApi.reload();
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('确认解决失败:', error);
      ElMessage.error(error.message || '确认解决失败');
    }
  }
};

const handleRejectFeedback = async (row: CaseReminderApi.TbCaseCuiban) => {
  try {
    const { value } = await ElMessageBox.prompt('请输入驳回原因', '驳回反馈', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputType: 'textarea',
      inputPlaceholder: '请输入驳回原因',
      inputValidator: (value) => {
        if (!value || !value.trim()) {
          return '驳回原因不能为空';
        }
        return true;
      },
    });

    // 获取反馈列表，使用最新一条记录的ID
    const response: any = await getFeedbackListApi(String(row.id));
    const feedbackList = response.list || [];

    if (feedbackList.length === 0) {
      ElMessage.error('未找到反馈记录');
      return;
    }

    // 使用最新一条记录的ID（列表第一条）
    const latestFeedbackId = feedbackList[0].id;

    await rejectReminderFeedbackApi({
      fbId: latestFeedbackId,
      comments: value,
    });

    // 清除缓存以便重新加载
    delete feedbackListMap.value[String(row.id)];

    ElMessage.success('驳回反馈成功');
    gridApi.reload();
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('驳回反馈失败:', error);
      ElMessage.error(error.message || '驳回反馈失败');
    }
  }
};

const handleIncreaseImportance = (row: CaseReminderApi.TbCaseCuiban) => {
  currentImportanceRow.value = row;
  const modalInstance = increaseModalRef.value as any;
  if (modalInstance?.modalApi) {
    // Set reminder ID for the modal to use
    modalInstance.reminderId = row.id;
    modalInstance.modalApi.open();
  } else {
    console.error('IncreaseModal API not found', modalInstance);
  }
};

// Ref to CreateReminderModal component instance
const createReminderModalRef = ref<InstanceType<typeof CreateReminderModal>>();

// Open create modal
const handleCreateReminder = () => {
  // Access the modal instance via ref and open it
  const modalInstance = createReminderModalRef.value as any;
  if (modalInstance?.modalApi) {
    modalInstance.modalApi.open();
  } else {
    console.error('Modal API not found', modalInstance);
  }
};
</script>

<template>
  <div class="h-full">
    <Page content-class="flex flex-col" title="催办列表">
      <template #extra>
        <ElButton type="primary" @click="handleCreateReminder">新建</ElButton>
      </template>

      <Grid>
        <!-- Risk Status Column -->
        <template #risk-status="{ row }">
          <div class="flex-center flex items-center gap-1">
            <div
              class="h-full w-1 rounded-full"
              :class="{
                'bg-red-500': row.statusTime === 2,
                'bg-orange-500': row.statusTime === 1,
                'bg-gray-400': row.statusTime === 0,
              }"
            ></div>
            <span
              class="text-xs"
              :class="{
                'text-red-600 dark:text-red-400': row.statusTime === 2,
                'text-orange-600 dark:text-orange-400': row.statusTime === 1,
                'text-gray-600 dark:text-gray-400': row.statusTime === 0,
              }"
            >
              {{ getStatusTimeText(row.statusTime) }}
            </span>
          </div>
        </template>

        <!-- Importance Column -->
        <template #importance="{ row }">
          <div class="flex items-center gap-1">
            <span v-if="row.imp === 3" class="text-lg">🚩</span>
            <span v-else-if="row.imp === 2" class="text-lg">⚠️</span>
            <span v-else class="text-lg text-gray-400">•</span>
            <span
              class="text-xs"
              :class="{
                'text-red-600': row.imp === 3,
                'text-orange-600': row.imp === 2,
                'text-gray-600': row.imp === 1,
              }"
            >
              {{ getImpText(row.imp) }}
            </span>
          </div>
        </template>

        <!-- Deadline Column -->
        <template #deadline="{ row }">
          <div
            class="text-xs"
            :class="{ 'animate-pulse text-red-600': isUrgent(row.endTime) }"
            :title="getTimeRemaining(row.endTime)"
          >
            {{ formatTime(row.endTime) }}
          </div>
        </template>

        <!-- Case IDs Column -->
        <template #case-ids="{ row }">
          <div class="flex flex-wrap gap-1">
            <template v-if="row.caseId">
              <a
                v-for="(caseId, index) in row.caseId.split(',').slice(0, 2)"
                :key="index"
                class="cursor-pointer text-xs text-blue-600 hover:underline"
                @click="handleViewCase(caseId.trim())"
              >
                {{ caseId.trim() }}
              </a>
              <span
                v-if="row.caseId.split(',').length > 2"
                class="text-xs text-gray-500"
              >
                +{{ row.caseId.split(',').length - 2 }}
              </span>
            </template>
            <span v-else class="text-xs text-gray-400">-</span>
          </div>
        </template>

        <!-- Reminder Type Column -->
        <template #reminder-type="{ row }">
          <div v-if="row.type" class="flex-center flex flex-col gap-1">
            <ElTag
              v-for="(typeText, index) in getReminderTypeText(row.type).split(
                '、',
              )"
              :key="index"
              size="small"
              :type="
                typeText === '加速定损'
                  ? 'danger'
                  : typeText === '尽快联系骑手'
                    ? 'warning'
                    : typeText === '尽快联系保司'
                      ? 'success'
                      : 'primary'
              "
            >
              {{ typeText }}
            </ElTag>
          </div>
          <span v-else class="text-xs text-gray-400">-</span>
        </template>

        <!-- Status Column -->
        <template #status="{ row }">
          <span class="text-xs">{{ getStatusText(row) }}</span>
        </template>

        <!-- Initiator Remark Column -->
        <template #initiator-remark="{ row }">
          <div class="line-clamp-2 text-xs" :title="row.zt || '-'">
            {{ row.zt || '-' }}
          </div>
        </template>

        <!-- Feedback Time Column -->
        <template #feedback-time="{ row }">
          <span class="text-xs">{{ formatTime(row.dtFeedback) }}</span>
        </template>

        <!-- Feedback Remark Column -->
        <template #feedback-remark="{ row }">
          <ElPopover
            placement="top"
            :width="400"
            trigger="hover"
            @show="fetchFeedbackList(String(row.id))"
          >
            <template #reference>
              <div
                class="line-clamp-2 cursor-pointer text-xs hover:text-blue-600"
                :title="row.commentsFeedback || '-'"
              >
                {{ row.commentsFeedback || '-' }}
              </div>
            </template>

            <div
              v-if="feedbackLoadingMap[String(row.id)]"
              class="py-4 text-center"
            >
              <span class="text-sm text-gray-500">加载中...</span>
            </div>

            <div
              v-else-if="feedbackListMap[String(row.id)]?.length ?? 0 > 0"
              class="max-h-80 overflow-y-auto"
            >
              <div class="mb-2 text-sm font-semibold">反馈列表</div>
              <div
                v-for="(feedback, index) in feedbackListMap[String(row.id)]"
                :key="index"
                class="mb-3 border-b border-gray-200 pb-3 last:border-0"
              >
                <div class="mb-1 flex items-start justify-between">
                  <span class="text-xs text-gray-500">
                    {{ formatTime(feedback.created) }}
                  </span>
                  <span
                    class="rounded px-2 py-0.5 text-xs"
                    :class="{
                      'bg-green-100 text-green-700':
                        feedback.statusClose === '1',
                      'bg-yellow-100 text-yellow-700':
                        feedback.statusClose === '0',
                    }"
                  >
                    {{ feedback.statusClose === '1' ? '已关闭' : '进行中' }}
                  </span>
                </div>
                <div class="text-sm text-gray-700">
                  {{ feedback.commentsFeedback || '-' }}
                </div>
                <div
                  v-if="feedback.commentsBack"
                  class="mt-1 text-xs text-red-600"
                >
                  驳回: {{ feedback.commentsBack }}
                </div>
              </div>
            </div>

            <div v-else class="py-4 text-center">
              <span class="text-sm text-gray-500">暂无反馈记录</span>
            </div>
          </ElPopover>
        </template>

        <!-- Receiver Name Column -->
        <template #receiver-name="{ row }">
          <span class="text-xs">{{ row.receiverName || '-' }}</span>
        </template>

        <!-- Created Time Column -->
        <template #created-time="{ row }">
          <span class="text-xs">{{ formatTime(row.created) }}</span>
        </template>

        <!-- Action Column -->
        <template #action="{ row }">
          <div class="flex flex-col gap-1">
            <ElLink
              v-if="canSubmitFeedback(row)"
              type="primary"
              underline="never"
              @click="handleSubmitFeedback(row)"
            >
              提交反馈
            </ElLink>
            <ElLink
              v-if="canConfirmResolved(row)"
              type="success"
              underline="never"
              @click="handleConfirmResolved(row)"
            >
              确认解决
            </ElLink>
            <ElLink
              v-if="canRejectFeedback(row)"
              type="warning"
              underline="never"
              @click="handleRejectFeedback(row)"
            >
              驳回反馈
            </ElLink>
            <ElLink
              v-if="canIncreaseImportance(row)"
              type="danger"
              underline="never"
              @click="handleIncreaseImportance(row)"
            >
              提高重要程度
            </ElLink>
          </div>
        </template>
      </Grid>
    </Page>
    <CreateReminderModal
      ref="createReminderModalRef"
      @success="gridApi.reload()"
    />
    <IncreaseImportanceModal
      ref="increaseModalRef"
      :current-importance="currentImportanceRow?.imp || 1"
      @success="gridApi.reload()"
    />
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
