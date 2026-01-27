<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { CaseReminderApi } from '#/api/core/case-reminder';

import { ref } from 'vue';

import { useUserStore } from '@vben/stores';

import {
  ElLink,
  ElMessage,
  ElMessageBox,
  ElPopover,
  ElTag,
} from 'element-plus';
import moment from 'moment';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  confirmReminderResolvedApi,
  getFeedbackListApi,
  getReminderListApi,
  rejectReminderFeedbackApi,
  submitReminderFeedbackApi,
} from '#/api/core/case-reminder';

import IncreaseImportanceModal from '../remind/IncreaseImportanceModal.vue';

// Local interface for feedback
interface TbCaseCuibanFeedback {
  id?: number;
  comments?: string; // Add comments backend field for rejection
  commentsBack?: string;
  commentsFeedback?: string;
  created?: string;
  status?: number;
  statusClose?: string;
}

// Props
const props = defineProps<{
  caseId: number | string;
}>();

// Emits
const emits = defineEmits(['update:total']);

const userStore = useUserStore();
const currentUserId = String(userStore.userInfo?.id || '');

// Current row for importance modal
const currentImportanceRow = ref<CaseReminderApi.TbCaseCuiban | null>(null);

// Feedback list state
const feedbackListMap = ref<Record<string, TbCaseCuibanFeedback[]>>({});
const feedbackLoadingMap = ref<Record<string, boolean>>({});

// Helpers for permissions
const isInitiator = (row: CaseReminderApi.TbCaseCuiban) => {
  return row.uid === currentUserId;
};

const isReceiver = (row: CaseReminderApi.TbCaseCuiban) => {
  return row.receiver && String(row.receiver) === currentUserId;
};

const canSubmitFeedback = (row: CaseReminderApi.TbCaseCuiban) => {
  return row.statusFeedback === 0 && isReceiver(row);
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
  return isInitiator(row) && row.imp !== 3;
};

// Load feedback list for a reminder
// Load feedback list for a reminder
const fetchFeedbackList = async (cbId: string) => {
  if (feedbackLoadingMap.value[cbId]) return;

  feedbackLoadingMap.value[cbId] = true;
  try {
    const response: any = await getFeedbackListApi(cbId);
    feedbackListMap.value[cbId] = response.list || [];
  } catch (error: any) {
    console.error('获取反馈列表失败:', error);
    ElMessage.error(error.message || '获取反馈列表失败');
  } finally {
    feedbackLoadingMap.value[cbId] = false;
  }
};

// Handle submit feedback
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

    // Clear cache to reload
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

// Handle reject feedback
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

    // Get latest feedback ID
    const response: any = await getFeedbackListApi(String(row.id));
    const feedbackList = response.list || [];

    if (feedbackList.length === 0) {
      ElMessage.error('未找到反馈记录');
      return;
    }

    const latestFeedback = feedbackList[0];

    await rejectReminderFeedbackApi({
      fbId: latestFeedback.id!,
      comments: value,
    });

    // Clear cache
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

// Handle confirm resolved
const handleConfirmResolved = async (row: CaseReminderApi.TbCaseCuiban) => {
  try {
    await ElMessageBox.confirm('确认该催办已解决?', '确认解决', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });

    // Get feedback list
    const response: any = await getFeedbackListApi(String(row.id));
    const feedbackList = response.list || [];

    if (feedbackList.length === 0) {
      ElMessage.error('请先提交反馈后再确认解决');
      return;
    }

    // Use latest feedback ID
    const latestFeedback = feedbackList[0];
    await confirmReminderResolvedApi(latestFeedback.id!);

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

// Increase importance wrapper
const handleIncreaseImportance = (row: CaseReminderApi.TbCaseCuiban) => {
  currentImportanceRow.value = row;
  const modalInstance = increaseModalRef.value as any;
  if (modalInstance?.modalApi) {
    modalInstance.reminderId = row.id;
    modalInstance.modalApi.open();
  } else {
    console.error('IncreaseModal API not found', modalInstance);
  }
};

// Grid options
const gridOptions: VxeTableGridOptions<CaseReminderApi.TbCaseCuiban> = {
  rowConfig: {
    isHover: true,
  },
  columns: [
    { field: 'id', title: 'ID', width: 80 },
    {
      field: 'statusTime',
      title: '当前催办风险状态',
      width: 150,
      formatter: ({ row }) => {
        const map: Record<number, string> = {
          0: '未超时',
          1: '超时',
          2: '严重超时',
        };
        return map[row.statusTime || 0] || '未超时';
      },
    },
    {
      field: 'imp',
      title: '重要程度',
      width: 100,
      slots: { default: 'importance' },
    },
    {
      field: 'endTime',
      title: '截止时间',
      width: 180,
      formatter: ({ row }: { row: CaseReminderApi.TbCaseCuiban }) =>
        row.endTime
          ? moment(Number(row.endTime)).format('YYYY-MM-DD HH:mm:ss')
          : '',
    },
    { field: 'receiverName', title: '催办接收人', width: 120 },
    {
      field: 'type',
      title: '催办事件类型',
      width: 150,
      showOverflow: false,
      slots: { default: 'type' },
    },
    { field: 'zt', title: '催办发起备注', minWidth: 200 },
    {
      field: 'statusFeedback',
      title: '当前状态',
      width: 100,
      formatter: ({ row }) => {
        return row.statusFeedback === 1 ? '已反馈' : '未反馈';
      },
    },
    {
      field: 'dtFeedback',
      title: '实际反馈时间',
      width: 180,
      formatter: ({ row }) =>
        row.dtFeedback
          ? moment(Number(row.dtFeedback)).format('YYYY-MM-DD HH:mm:ss')
          : '',
    },
    {
      field: 'commentsFeedback',
      title: '催办反馈备注',
      minWidth: 200,
      slots: { default: 'feedback-remark' },
    },
    { field: 'username', title: '发起人', width: 100 },
    {
      field: 'created',
      title: '生成时间',
      width: 180,
      formatter: ({ row }) =>
        row.created
          ? moment(Number(row.created)).format('YYYY-MM-DD HH:mm:ss')
          : '',
    },
    {
      title: '操作',
      width: 120,
      fixed: 'right',
      slots: { default: 'actions' },
      showOverflow: false,
    },
  ],
  pagerConfig: {
    enabled: true,
    pageSize: 10,
    pageSizes: [10, 20, 30, 50],
  },
  minHeight: 400,
  stripe: true,
  border: true,
  scrollY: { enabled: false },
  proxyConfig: {
    response: {
      result: 'list',
      total: 'total',
      list: 'list',
    },
    ajax: {
      query: async ({ page }: { page: any }) => {
        const params: CaseReminderApi.ReminderListParams = {
          page: page.currentPage,
          size: page.pageSize,
          caseId: String(props.caseId),
          type: '0',
        };
        const res = await getReminderListApi(params);
        emits('update:total', res.total || 0);
        return res;
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: gridOptions as any,
});

// Ref to IncreaseImportanceModal component instance
const increaseModalRef = ref<InstanceType<typeof IncreaseImportanceModal>>();

// Format time
const formatTime = (timestamp?: string) => {
  if (!timestamp) return '';
  return moment(Number(timestamp)).format('YYYY-MM-DD HH:mm:ss');
};

// Format reminder type
const formatReminderType = (type?: number | string) => {
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

// Expose reload method
defineExpose({
  reload: () => gridApi.reload(),
});
</script>

<template>
  <div class="case-reminder-list">
    <Grid>
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
            {{ row.imp === 3 ? '最高' : row.imp === 2 ? '高' : '普通' }}
          </span>
        </div>
      </template>

      <!-- 催办事件类型 Column -->
      <template #type="{ row }">
        <div v-if="row.type" class="flex flex-col gap-1">
          <ElTag
            v-for="(typeText, index) in formatReminderType(row.type).split(
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
              <div class="mb-1 flex justify-between">
                <span class="text-xs text-gray-500">
                  {{ formatTime(feedback.created) }}
                </span>
                <span
                  class="rounded px-2 py-0.5 text-xs"
                  :class="{
                    'bg-green-100 text-green-700': feedback.statusClose === '1',
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

      <template #actions="{ row }">
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
    <IncreaseImportanceModal
      ref="increaseModalRef"
      :current-importance="currentImportanceRow?.imp || 1"
      @success="gridApi.reload()"
    />
  </div>
</template>

<style scoped>
.case-reminder-list {
  height: 100%;
}
</style>
