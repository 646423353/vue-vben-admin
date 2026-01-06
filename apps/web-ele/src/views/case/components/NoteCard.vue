<script lang="ts" setup>
import { computed } from 'vue';

import { ElButton, ElButtonGroup, ElInput } from 'element-plus';

interface Props {
  theme?: 'blue' | 'green';
  status?: 'history' | 'operating'; // history: submitted/read-only, operating: editable
  roleName?: string;
  userName?: string;
  startTime?: string;
  duration?: string;
  isOverdue?: boolean;
  submitTime?: string;
  submitContent?: string;
}

const props = withDefaults(defineProps<Props>(), {
  theme: 'green',
  status: 'operating',
  roleName: '定损员',
  userName: 'AAA定损员',
  startTime: '2025/01/01 21:12:12',
  duration: '1天12时34分',
  isOverdue: false,
  submitTime: '',
  submitContent: '',
});

const borderColor = computed(() => {
  return props.theme === 'blue' ? 'border-blue-200' : 'border-green-200';
});

const headerBgColor = computed(() => {
  return props.theme === 'blue' ? 'bg-blue-50/50' : 'bg-green-50/50';
});

const headerBorderColor = computed(() => {
  return props.theme === 'blue' ? 'border-blue-100' : 'border-green-100';
});
</script>

<template>
  <div
    class="mb-6 rounded-xl border bg-white shadow-sm transition-all duration-300 hover:shadow-md"
    :class="[borderColor]"
  >
    <!-- Header -->
    <div
      class="flex flex-wrap items-center justify-between gap-3 rounded-t-xl border-b px-5 py-4"
      :class="[headerBgColor, headerBorderColor]"
    >
      <div class="flex items-center gap-3">
        <span class="text-base font-bold text-gray-900">
          {{ userName }}
          <span class="ml-1 text-sm font-normal text-gray-500">
            ({{ roleName }})
          </span>
        </span>
      </div>
      <div
        class="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500"
      >
        <span class="whitespace-nowrap">开始于 {{ startTime }}</span>
        <span class="flex items-center whitespace-nowrap">
          操作用时 {{ duration }}
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

      <!-- Action Buttons Area (Only for operating status) -->
      <div v-if="status === 'operating'" class="actions-btns mt-4">
        <slot name="actions">
          <!-- Default empty or specific buttons passed from parent -->
        </slot>
      </div>
    </div>

    <!-- Footer Area -->
    <div class="rounded-b-xl border-t border-gray-100 bg-gray-50/50 px-5 py-4">
      <div
        v-if="status === 'history'"
        class="flex flex-col gap-1 text-sm text-gray-600 sm:flex-row sm:items-start sm:gap-2"
      >
        <span class="shrink-0 font-medium text-gray-900">
          于 {{ submitTime }} 提交：
        </span>
        <span class="leading-relaxed">{{ submitContent }}</span>
      </div>

      <div v-else class="flex flex-col gap-4 lg:flex-row lg:items-stretch">
        <!-- Input Area -->
        <div class="w-full flex-1">
          <ElInput
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
          <ElButtonGroup direction="vertical">
            <ElButton
              plain
              size="default"
              class="flex-1 !border-gray-200 !bg-white !text-gray-600 shadow-sm hover:!border-blue-400 hover:!text-blue-600"
            >
              驳回前一处理人
            </ElButton>
            <ElButton
              plain
              size="default"
              class="flex-1 !border-gray-200 !bg-white !text-gray-600 shadow-sm hover:!border-blue-400 hover:!text-blue-600"
            >
              转异常
            </ElButton>
            <ElButton
              plain
              size="default"
              class="flex-1 !border-gray-200 !bg-white !text-gray-600 shadow-sm hover:!border-blue-400 hover:!text-blue-600"
            >
              挂起
            </ElButton>
            <ElButton
              plain
              size="default"
              class="flex-1 !border-gray-200 !bg-white !text-gray-600 shadow-sm hover:!border-blue-400 hover:!text-blue-600"
            >
              已确认赔付结案
            </ElButton>
          </ElButtonGroup>
        </div>

        <!-- Right Actions (Submit & Save) -->
        <div class="flex w-full shrink-0 flex-col gap-2 lg:w-32">
          <ElButton
            type="primary"
            :color="theme === 'blue' ? '#3b82f6' : '#10b981'"
            class="flex-1 !text-lg !font-medium !text-white shadow-sm"
          >
            提交 <span class="ml-1">↑</span>
          </ElButton>
          <ElButton
            plain
            class="!ml-0 w-full !border-gray-200 !bg-white !text-gray-600 shadow-sm hover:!border-green-500 hover:!text-green-600"
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

.vertical-group {
  :deep(.el-button) {
    /* Ensure full width */
    width: 100%;

    /* Handle overlapping borders */
    margin-top: -1px;

    /* Reset horizontal group margin */
    margin-left: 0;

    /* Reset border radius */
    border-radius: 0;
  }

  /* First button: Top radius, normal top margin */
  :deep(.el-button:first-child) {
    margin-top: 0;
    border-top-left-radius: var(--el-border-radius-base);
    border-top-right-radius: var(--el-border-radius-base);
  }

  /* Last button: Bottom radius */
  :deep(.el-button:last-child) {
    border-bottom-right-radius: var(--el-border-radius-base);
    border-bottom-left-radius: var(--el-border-radius-base);
  }

  /* Ensure active/hover state z-index handles border visibility properly is usually auto-handled by element button focus, 
     but we might need `z-index: 1` on hover if borders disappear. 
     Standard element plus buttons usually handle this. */
}
</style>
