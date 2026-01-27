<script lang="ts" setup>
import { computed } from 'vue';

import { createIconifyIcon, Pencil } from '@vben/icons';

import { ElButton, ElIcon } from 'element-plus';

const props = withDefaults(
  defineProps<{
    hasLossAssessment?: boolean;
    theme?: 'blue' | 'cyan' | 'green' | 'orange' | 'purple';
  }>(),
  {
    hasLossAssessment: false,
    theme: 'green',
  },
);

defineEmits(['update', 'modify', 'addDocking', 'addNegotiation']);

const Plus = createIconifyIcon('ep:plus');

const btnClass = computed(() => {
  const map: Record<string, string> = {
    blue: '!border-blue-400 !text-blue-600 hover:!bg-blue-50 dark:!border-blue-500 dark:!text-blue-300 dark:hover:!bg-blue-900/30',
    green:
      '!border-green-400 !text-green-700 hover:!bg-green-50 dark:!border-green-500 dark:!text-green-300 dark:hover:!bg-green-900/30',
    orange:
      '!border-orange-400 !text-orange-700 hover:!bg-orange-50 dark:!border-orange-500 dark:!text-orange-300 dark:hover:!bg-orange-900/30',
    purple:
      '!border-purple-400 !text-purple-700 hover:!bg-purple-50 dark:!border-purple-500 dark:!text-purple-300 dark:hover:!bg-purple-900/30',
    cyan: '!border-cyan-400 !text-cyan-700 hover:!bg-cyan-50 dark:!border-cyan-500 dark:!text-cyan-300 dark:hover:!bg-cyan-900/30',
  };
  return (
    map[props.theme] ||
    '!border-blue-400 !text-blue-600 hover:!bg-blue-50 dark:!border-blue-500 dark:!text-blue-300 dark:hover:!bg-blue-900/30'
  );
});
const gridCols = computed(() => 'lg:grid-cols-4');
</script>

<template>
  <div class="grid grid-cols-1 gap-3 px-2 sm:grid-cols-2" :class="gridCols">
    <ElButton
      class="mb-3 w-full !border-dashed !bg-white shadow-sm lg:mb-0 dark:!bg-slate-800"
      :class="btnClass"
      @click="$emit('update')"
    >
      <ElIcon class="mr-1"><Plus /></ElIcon> 更新案件基础信息
    </ElButton>
    <ElButton
      class="mb-3 w-full !border-dashed !bg-white shadow-sm lg:mb-0 dark:!bg-slate-800"
      :class="btnClass"
      @click="$emit('modify')"
    >
      <ElIcon class="mr-1">
        <component :is="hasLossAssessment ? Pencil : Plus" />
      </ElIcon>
      {{ hasLossAssessment ? '修改定损表' : '新建定损表' }}
    </ElButton>
    <ElButton
      class="mb-3 w-full !border-dashed !bg-white shadow-sm lg:mb-0 dark:!bg-slate-800"
      :class="btnClass"
      @click="$emit('addDocking')"
    >
      <ElIcon class="mr-1"><Plus /></ElIcon> 添加保司对接表
    </ElButton>
    <ElButton
      class="w-full !border-dashed !bg-white shadow-sm dark:!bg-slate-800"
      :class="btnClass"
      @click="$emit('addNegotiation')"
    >
      <ElIcon class="mr-1"><Plus /></ElIcon> 添加赔付表
    </ElButton>
  </div>
</template>
