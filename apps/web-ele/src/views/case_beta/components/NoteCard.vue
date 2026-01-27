<script lang="ts" setup>
import { computed, ref } from 'vue';

import { ElAvatar, ElButton, ElButtonGroup, ElInput } from 'element-plus';

interface Props {
  theme?: 'blue' | 'cyan' | 'green' | 'orange' | 'purple';
  status?: 'history' | 'operating'; // history: submitted/read-only, operating: editable
  roleName?: string;
  userName?: string;
  startTime?: string;
  duration?: string;
  rawDuration?: null | number; // New prop for raw duration value
  isLatest?: boolean; // New prop to check if it's the latest item
  isOverdue?: boolean;
  submitTime?: string;
  submitContent?: string;
  readonly?: boolean; // 查看模式，隐藏操作区域
  latestNegotiationTime?: string; // 最近对接更新时间
  avatar?: string; // 头像链接
}

const props = withDefaults(defineProps<Props>(), {
  theme: 'green',
  status: 'operating',
  roleName: '定损员',
  userName: 'AAA定损员',
  startTime: '2025/01/01 21:12:12',
  duration: '1天12时34分',
  rawDuration: null,
  isLatest: false,
  isOverdue: false,
  submitTime: '',
  submitContent: '',
  readonly: false,
  latestNegotiationTime: '',
  avatar: '',
});

defineEmits(['saveDraft', 'submit', 'back', 'exception', 'block', 'close']);

const inputValue = ref(props.submitContent || '');

const borderColor = computed(() => {
  const isOperating = props.status === 'operating' && !props.readonly;
  const map: Record<string, string> = {
    blue: isOperating
      ? 'border-blue-500 dark:border-blue-500'
      : 'border-blue-200 dark:border-blue-900',
    green: isOperating
      ? 'border-green-500 dark:border-green-500'
      : 'border-green-200 dark:border-green-900',
    orange: isOperating
      ? 'border-orange-500 dark:border-orange-500'
      : 'border-orange-200 dark:border-orange-900',
    purple: isOperating
      ? 'border-purple-500 dark:border-purple-500'
      : 'border-purple-200 dark:border-purple-900',
    cyan: isOperating
      ? 'border-cyan-500 dark:border-cyan-500'
      : 'border-cyan-200 dark:border-cyan-900',
  };
  return (
    map[props.theme] ||
    (isOperating
      ? 'border-blue-500 dark:border-blue-500'
      : 'border-blue-200 dark:border-blue-900')
  );
});

const headerBgColor = computed(() => {
  const isOperating = props.status === 'operating' && !props.readonly;
  const map: Record<string, string> = {
    blue: isOperating
      ? 'bg-blue-100 dark:bg-blue-900/50'
      : 'bg-blue-50/50 dark:bg-blue-900/20',
    green: isOperating
      ? 'bg-green-100 dark:bg-green-900/50'
      : 'bg-green-50/50 dark:bg-green-900/20',
    orange: isOperating
      ? 'bg-orange-100 dark:bg-orange-900/50'
      : 'bg-orange-50/50 dark:bg-orange-900/20',
    purple: isOperating
      ? 'bg-purple-100 dark:bg-purple-900/50'
      : 'bg-purple-50/50 dark:bg-purple-900/20',
    cyan: isOperating
      ? 'bg-cyan-100 dark:bg-cyan-900/50'
      : 'bg-cyan-50/50 dark:bg-cyan-900/20',
  };
  return (
    map[props.theme] ||
    (isOperating
      ? 'bg-blue-100 dark:bg-blue-900/50'
      : 'bg-blue-50/50 dark:bg-blue-900/20')
  );
});

const headerBorderColor = computed(() => {
  const isOperating = props.status === 'operating' && !props.readonly;
  const map: Record<string, string> = {
    blue: isOperating
      ? 'border-blue-500 dark:border-blue-500'
      : 'border-blue-100 dark:border-blue-800',
    green: isOperating
      ? 'border-green-500 dark:border-green-500'
      : 'border-green-100 dark:border-green-800',
    orange: isOperating
      ? 'border-orange-500 dark:border-orange-500'
      : 'border-orange-100 dark:border-orange-800',
    purple: isOperating
      ? 'border-purple-500 dark:border-purple-500'
      : 'border-purple-100 dark:border-purple-800',
    cyan: isOperating
      ? 'border-cyan-500 dark:border-cyan-500'
      : 'border-cyan-100 dark:border-cyan-800',
  };
  return map[props.theme] || 'border-blue-100 dark:border-blue-800';
});

const submitButtonColor = computed(() => {
  const map: Record<string, string> = {
    blue: '#3b82f6',
    green: '#10b981',
    orange: '#f97316',
    purple: '#a855f7',
    cyan: '#06b6d4',
  };
  return map[props.theme] || '#3b82f6';
});
</script>

<template>
  <div
    class="mb-6 rounded-xl border bg-white shadow-sm transition-all duration-300 hover:shadow-md dark:border-gray-700 dark:bg-slate-900"
    :class="[borderColor]"
  >
    <!-- Header -->
    <div
      class="flex flex-wrap items-center justify-between gap-3 rounded-t-xl border-b px-5 py-4 dark:border-gray-700"
      :class="[headerBgColor, headerBorderColor]"
    >
      <div class="flex items-center gap-3">
        <ElAvatar :size="32" :src="avatar" class="mr-2">
          {{ userName ? userName.charAt(0).toUpperCase() : '' }}
        </ElAvatar>
        <span class="text-base font-bold text-gray-900 dark:text-gray-100">
          {{ userName }}
          <span
            class="ml-1 text-sm font-normal text-gray-500 dark:text-gray-400"
          >
            ({{ roleName }})
          </span>
        </span>
      </div>
      <div
        class="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500 dark:text-gray-400"
      >
        <span class="whitespace-nowrap">开始于 {{ startTime }}</span>
        <span
          v-if="latestNegotiationTime"
          class="whitespace-nowrap font-medium text-gray-900 dark:text-gray-100"
        >
          最近对接更新 {{ latestNegotiationTime }}
        </span>
        <span
          v-if="rawDuration !== null && rawDuration !== undefined"
          class="flex items-center whitespace-nowrap"
        >
          {{
            rawDuration === 0
              ? isLatest
                ? '进行中'
                : '用时不到1小时'
              : `操作用时 ${duration}`
          }}
          <span
            v-if="isOverdue"
            class="ml-1 rounded bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-600"
          >
            已超时
          </span>
        </span>
      </div>
    </div>

    <!-- Content Area -->
    <div class="p-5">
      <div class="min-h-[80px]">
        <slot name="content">
          <div class="flex h-20 items-center justify-center text-gray-400">
            无操作数据
          </div>
        </slot>
      </div>

      <!-- Action Buttons Area (Only for operating status and not readonly) -->
      <div v-if="status === 'operating' && !readonly" class="actions-btns mt-4">
        <slot name="actions">
          <!-- Default empty or specific buttons passed from parent -->
        </slot>
      </div>
    </div>

    <!-- Footer Area (hidden in readonly mode) -->
    <div
      v-if="!readonly || (status === 'history' && submitContent)"
      class="rounded-b-xl border-t border-gray-100 bg-gray-50/50 px-5 py-4 dark:border-gray-800 dark:bg-slate-800/50"
      :class="{ '!border-dashed': status === 'history' }"
    >
      <div v-if="status === 'history'">
        <div class="text-sm text-gray-700 dark:text-gray-300">
          <span class="font-bold">于 {{ submitTime }} 提交：</span>
          <span class="leading-relaxed">{{ submitContent }}</span>
        </div>
      </div>

      <div v-else class="flex flex-col gap-4 lg:flex-row lg:items-stretch">
        <!-- Input Area -->
        <div class="w-full flex-1">
          <ElInput
            v-model="inputValue"
            type="textarea"
            :rows="4"
            placeholder="在此处添加沟通内容..."
            resize="none"
            class="h-full !shadow-sm"
          />
        </div>

        <!-- Middle Actions (Button Groups) -->
        <div class="flex w-full shrink-0 flex-col gap-2 lg:w-auto">
          <!-- Row 1 -->
          <!-- Row 1 -->
          <!-- Mobile Layout: Grid (2x2) -->
          <!-- Mobile Layout: Grid (2x2) -->
          <!-- Mobile Layout: Grid (2x2) -->
          <div class="grid h-full w-full grid-cols-2 gap-2 lg:hidden">
            <ElButton
              plain
              size="small"
              class="!ml-0 w-full shadow-sm"
              @click="$emit('back', inputValue)"
            >
              驳回前一处理人
            </ElButton>
            <ElButton
              plain
              size="small"
              class="!ml-0 w-full shadow-sm"
              @click="$emit('exception', inputValue)"
            >
              转异常
            </ElButton>
            <ElButton
              plain
              size="small"
              class="!ml-0 w-full shadow-sm"
              @click="$emit('block', inputValue)"
            >
              挂起
            </ElButton>
            <ElButton
              plain
              size="small"
              class="!ml-0 w-full shadow-sm"
              @click="$emit('close', inputValue)"
            >
              已确认赔付结案
            </ElButton>
          </div>

          <!-- Desktop Layout: ButtonGroup (Vertical) -->
          <div class="hidden w-full lg:flex">
            <ElButtonGroup
              class="full-height-group"
              direction="vertical"
              size="small"
            >
              <ElButton plain size="small" @click="$emit('back', inputValue)">
                驳回前一处理人
              </ElButton>
              <ElButton
                plain
                size="small"
                @click="$emit('exception', inputValue)"
              >
                转异常
              </ElButton>
              <ElButton plain size="small" @click="$emit('block', inputValue)">
                挂起
              </ElButton>
              <ElButton plain size="small" @click="$emit('close', inputValue)">
                已确认赔付结案
              </ElButton>
            </ElButtonGroup>
          </div>
        </div>

        <!-- Right Actions (Submit & Save) -->
        <div class="flex w-full shrink-0 flex-col gap-2 lg:w-32">
          <ElButton
            type="primary"
            :color="submitButtonColor"
            class="flex-1 !text-lg !font-medium !text-white shadow-sm"
            @click="$emit('submit', inputValue)"
          >
            提交 <span class="ml-1">↑</span>
          </ElButton>
          <ElButton
            plain
            class="!ml-0 w-full !border-gray-200 !bg-white !text-gray-600 shadow-sm hover:!border-green-500 hover:!text-green-600 dark:!border-gray-700 dark:!bg-slate-800 dark:!text-gray-300"
            @click="$emit('saveDraft', inputValue)"
          >
            存草稿
          </ElButton>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.actions-btns {
  :deep(.el-button + .el-button) {
    margin-left: 0;
  }
}

.full-height-group {
  display: flex !important;
  flex-direction: column;
  height: 100%;

  :deep(.el-button) {
    flex: 1;
    margin-left: 0 !important;
  }
}
</style>
