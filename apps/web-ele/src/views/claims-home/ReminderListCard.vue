<script lang="ts" setup>
import type { Component } from 'vue';

import { ref } from 'vue';

import { AntdClockCircle } from '@vben/icons';

import {
  ElButton,
  ElCard,
  ElEmpty,
  ElMessage,
  ElMessageBox,
  ElScrollbar,
  ElTag,
} from 'element-plus';
import moment from 'moment';

import {
  confirmReminderResolvedApi,
  getFeedbackListApi,
  rejectReminderFeedbackApi,
  submitReminderFeedbackApi,
} from '#/api/core/case-reminder';
import IncreaseImportanceModal from '#/views/case_beta/remind/IncreaseImportanceModal.vue';

interface ReminderItem {
  id: number | string; // Support number from API
  caseId: string;
  caseName: string;
  reminderType: string;
  priority: '最高' | '普通' | '高';
  deadline: string;
  content: string;
  createdTime: string;
  handler?: string;
  uid?: string;
  receiver?: number | string; // Support number
  statusFeedback?: number; // 0: 未反馈, 1: 已反馈
  statusClose?: string; // '0': 未解决, '1': 已解决
  imp?: number; // 1-3
}

interface Props {
  reminders: ReminderItem[];
  currentUserId?: string;
}

const props = withDefaults(defineProps<Props>(), {
  currentUserId: 'user_001',
});

const emit = defineEmits(['reload', 'viewCase']);

// Increase Importance Modal Ref
const increaseModalRef = ref<InstanceType<typeof IncreaseImportanceModal>>();
const currentImportanceRow = ref<null | ReminderItem>(null);

// 时钟图标
const clockIcon: Component = AntdClockCircle;

// 获取优先级标签类型
const getPriorityType = (priority: ReminderItem['priority']) => {
  if (priority === '最高') return 'danger';
  if (priority === '高') return 'warning';
  return undefined;
};

// 获取优先级状态条颜色
const getPriorityColor = (priority: ReminderItem['priority']) => {
  if (priority === '最高') return '#f56c6c';
  if (priority === '高') return '#e6a23c';
  return '#909399';
};

// 判断是否超时
const isOverdue = (deadline: string) => {
  return moment(deadline).isBefore(moment());
};

// 格式化时间
const formatTime = (time: string) => {
  return moment(time).format('YYYY-MM-DD HH:mm');
};

// 计算剩余时间
const getTimeRemaining = (deadline: string) => {
  const now = moment();
  const end = moment(deadline);
  const diff = end.diff(now, 'hours');

  if (diff < 0) return '已超时';
  if (diff < 24) return `${diff}小时后`;
  return `${Math.floor(diff / 24)}天后`;
};

// Check if user is initiator
const isInitiator = (row: ReminderItem) => {
  return String(row.uid) === String(props.currentUserId);
};

// Check if user is receiver
const isReceiver = (row: ReminderItem) => {
  return row.receiver && String(row.receiver) === String(props.currentUserId);
};

// Determine which buttons to show
const canSubmitFeedback = (row: ReminderItem) => {
  return (
    (row.statusFeedback === 0 || row.statusFeedback === undefined) &&
    (row.statusClose === '0' || row.statusClose === undefined) &&
    isReceiver(row)
  );
};

const canConfirmResolved = (row: ReminderItem) => {
  return (
    row.statusFeedback === 1 &&
    (row.statusClose === '0' || row.statusClose === undefined) &&
    isInitiator(row)
  );
};

const canRejectFeedback = (row: ReminderItem) => {
  return (
    row.statusFeedback === 1 &&
    (row.statusClose === '0' || row.statusClose === undefined) &&
    isInitiator(row)
  );
};

const canIncreaseImportance = (row: ReminderItem) => {
  return (
    (row.statusClose === '0' || row.statusClose === undefined) &&
    isInitiator(row) &&
    row.imp !== 3
  );
};

// Actions
const handleSubmitFeedback = async (item: ReminderItem) => {
  try {
    const { value } = await ElMessageBox.prompt('请输入反馈内容', '提交反馈', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputType: 'textarea',
      inputPlaceholder: '请输入反馈内容',
      inputValidator: (val) => {
        if (!val || !val.trim()) {
          return '反馈内容不能为空';
        }
        return true;
      },
    });

    await submitReminderFeedbackApi({
      cuibanId: Number(item.id),
      commentsFeedback: value,
    });

    ElMessage.success('提交反馈成功');
    emit('reload');
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('提交反馈失败:', error);
      ElMessage.error(error.message || '提交反馈失败');
    }
  }
};

const handleConfirmResolved = async (item: ReminderItem) => {
  try {
    await ElMessageBox.confirm('确认该催办已解决?', '确认解决', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });

    // 获取反馈列表，使用最新一条记录的ID
    const response: any = await getFeedbackListApi(String(item.id));
    const feedbackList = response.list || [];

    if (feedbackList.length === 0) {
      ElMessage.error('未找到反馈记录');
      return;
    }

    // 使用最新一条记录的ID（列表第一条）
    const latestFeedbackId = feedbackList[0].id;

    await confirmReminderResolvedApi(latestFeedbackId);

    ElMessage.success('确认解决成功');
    emit('reload');
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('确认解决失败:', error);
      ElMessage.error(error.message || '确认解决失败');
    }
  }
};

const handleRejectFeedback = async (item: ReminderItem) => {
  try {
    const { value } = await ElMessageBox.prompt('请输入驳回原因', '驳回反馈', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputType: 'textarea',
      inputPlaceholder: '请输入驳回原因',
      inputValidator: (val) => {
        if (!val || !val.trim()) {
          return '驳回原因不能为空';
        }
        return true;
      },
    });

    // 获取反馈列表
    const response: any = await getFeedbackListApi(String(item.id));
    const feedbackList = response.list || [];

    if (feedbackList.length === 0) {
      ElMessage.error('未找到反馈记录');
      return;
    }

    const latestFeedbackId = feedbackList[0].id;

    await rejectReminderFeedbackApi({
      fbId: latestFeedbackId,
      comments: value,
    });

    ElMessage.success('驳回反馈成功');
    emit('reload');
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('驳回反馈失败:', error);
      ElMessage.error(error.message || '驳回反馈失败');
    }
  }
};

const handleIncreaseImportance = (item: ReminderItem) => {
  currentImportanceRow.value = item;
  const modalInstance = increaseModalRef.value as any;
  if (modalInstance?.modalApi) {
    // Set reminder ID for the modal to use
    // Using any cast because detailed types might misalign in strict mode temporarily
    // assuming modalInstance expects standard prop/method
    modalInstance.reminderId = item.id;
    // We pass currentImportance prop to modal in template
    modalInstance.modalApi.open();
  } else {
    console.error('IncreaseModal API not found', modalInstance);
  }
};

const handleViewDetail = (caseId: string) => {
  emit('viewCase', caseId);
};

// Parse caseId and caseName strings into an array of objects
const parseCaseList = (item: ReminderItem) => {
  if (!item.caseId) return [];
  const ids = String(item.caseId).split(',');
  // Use regex to split by comma, but handle potential commas in names if better separating is needed in future.
  // For now assuming simple comma separation for names too matching ids count.
  const names = item.caseName ? String(item.caseName).split(',') : [];

  return ids.map((id, index) => {
    return {
      id: id.trim(),
      name: names[index] ? names[index].trim() : '未知',
    };
  });
};
</script>

<template>
  <ElCard class="reminder-list-card" shadow="hover">
    <template #header>
      <div class="card-header">
        <component :is="clockIcon" class="header-icon" />
        <span class="header-title">待处理催办</span>
        <ElTag type="info" size="small" round>
          {{ reminders.length }} 条
        </ElTag>
      </div>
    </template>

    <ElScrollbar v-if="reminders.length > 0" max-height="400px">
      <div class="reminder-list">
        <div
          v-for="item in reminders"
          :key="item.id"
          class="reminder-item"
          :class="{ overdue: isOverdue(item.deadline) }"
        >
          <!-- 优先级状态条 -->
          <div
            class="priority-bar"
            :style="{ backgroundColor: getPriorityColor(item.priority) }"
          />

          <!-- 主体内容 -->
          <div class="reminder-content">
            <div class="reminder-header">
              <div class="case-info">
                <template
                  v-for="(caseItem, index) in parseCaseList(item)"
                  :key="index"
                >
                  <span
                    class="case-name cursor-pointer hover:text-blue-500"
                    @click="handleViewDetail(caseItem.id)"
                  >
                    案件{{ caseItem.id }} 骑手{{ caseItem.name }}
                  </span>
                  <span
                    v-if="index < parseCaseList(item).length - 1"
                    class="mx-1 text-gray-400"
                  >
                    ,
                  </span>
                </template>
              </div>
              <ElTag :type="getPriorityType(item.priority)" size="small">
                {{ item.priority }}
              </ElTag>
            </div>

            <div class="reminder-body">
              <div class="flex items-center gap-2 text-xs">
                <span class="font-bold text-red-500">
                  {{ item.reminderType }}
                </span>
                <span v-if="item.handler" class="text-gray-500">
                  催办接收人: {{ item.handler }}
                </span>
              </div>
              <div class="reminder-text">{{ item.content }}</div>
            </div>

            <div class="reminder-footer">
              <div class="time-info">
                <span
                  class="deadline"
                  :class="{ overdue: isOverdue(item.deadline) }"
                >
                  截止: {{ formatTime(item.deadline) }}
                  <span class="time-remaining">
                    ({{ getTimeRemaining(item.deadline) }})
                  </span>
                </span>
              </div>
              <div class="actions">
                <!-- Dynamic Buttons -->
                <ElButton
                  v-if="canSubmitFeedback(item)"
                  size="small"
                  type="primary"
                  link
                  @click="handleSubmitFeedback(item)"
                >
                  提交反馈
                </ElButton>
                <ElButton
                  v-if="canConfirmResolved(item)"
                  size="small"
                  type="success"
                  link
                  @click="handleConfirmResolved(item)"
                >
                  确认解决
                </ElButton>
                <ElButton
                  v-if="canRejectFeedback(item)"
                  size="small"
                  type="warning"
                  link
                  @click="handleRejectFeedback(item)"
                >
                  驳回反馈
                </ElButton>
                <ElButton
                  v-if="canIncreaseImportance(item)"
                  size="small"
                  type="danger"
                  link
                  @click="handleIncreaseImportance(item)"
                >
                  提高重要程度
                </ElButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ElScrollbar>

    <ElEmpty v-else description="暂无待处理催办" :image-size="100" />

    <IncreaseImportanceModal
      ref="increaseModalRef"
      :current-importance="currentImportanceRow?.imp || 1"
      @success="emit('reload')"
    />
  </ElCard>
</template>

<style scoped>
.reminder-list-card {
  background-color: var(--el-bg-color);
  border-radius: 8px;
}

.card-header {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
}

.header-icon {
  width: 20px;
  height: 20px;
  color: var(--el-color-primary);
}

.header-title {
  flex: 1;
}

.reminder-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.reminder-item {
  position: relative;
  display: flex;
  gap: 12px;
  padding: 16px;
  overflow: hidden;
  background: var(--el-fill-color-light);
  border-radius: 8px;
  transition: all 0.3s ease;
}

.reminder-item:hover {
  background: var(--el-fill-color);
  box-shadow: var(--el-box-shadow-light);
}

.reminder-item.overdue {
  background: var(--el-color-danger-light-9);
  border: 1px solid var(--el-color-danger-light-7);
}

.reminder-item.overdue:hover {
  background: var(--el-color-danger-light-8);
}

.priority-bar {
  flex-shrink: 0;
  width: 4px;
  border-radius: 2px;
}

.reminder-content {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 8px;
}

.reminder-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.case-info {
  display: flex;
  gap: 8px;
  align-items: center;
}

.case-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.case-id {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.reminder-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.reminder-type {
  font-size: 12px;
  font-weight: 500;
  color: var(--el-color-primary);
}

.reminder-text {
  font-size: 13px;
  line-height: 1.5;
  color: var(--el-text-color-regular);
}

.reminder-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 4px;
}

.time-info {
  display: flex;
  gap: 8px;
  align-items: center;
}

.deadline {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.deadline.overdue {
  font-weight: 600;
  color: var(--el-color-danger);
}

.time-remaining {
  font-weight: 500;
}

.actions {
  display: flex;
  gap: 8px;
}

@media (max-width: 768px) {
  .reminder-footer {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }

  .actions {
    justify-content: flex-end;
    width: 100%;
  }
}
</style>
