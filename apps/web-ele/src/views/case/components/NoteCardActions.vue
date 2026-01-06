<script lang="ts" setup>
import { computed } from 'vue';

import { createIconifyIcon, Pencil } from '@vben/icons';

import { ElButton, ElIcon } from 'element-plus';

const props = withDefaults(defineProps<{ theme?: 'blue' | 'green' }>(), {
  theme: 'green',
});

defineEmits(['update', 'modify', 'addDocking', 'addPayment']);

const Plus = createIconifyIcon('ep:plus');

const btnClass = computed(() => {
  return props.theme === 'blue'
    ? '!border-blue-400 !text-blue-600 hover:!bg-blue-50'
    : '!border-green-400 !text-green-700 hover:!bg-green-50';
});
</script>

<template>
  <div class="grid grid-cols-1 gap-3 px-2 sm:grid-cols-2 lg:grid-cols-4">
    <ElButton
      class="mb-3 w-full !border-dashed !bg-white shadow-sm lg:mb-0"
      :class="btnClass"
      @click="$emit('update')"
    >
      <ElIcon class="mr-1"><Plus /></ElIcon> 更新出险信息
    </ElButton>
    <ElButton
      class="mb-3 w-full !border-dashed !bg-white shadow-sm lg:mb-0"
      :class="btnClass"
      @click="$emit('modify')"
    >
      <ElIcon class="mr-1"><Pencil /></ElIcon> 修改定损表
    </ElButton>
    <ElButton
      class="mb-3 w-full !border-dashed !bg-white shadow-sm lg:mb-0"
      :class="btnClass"
      @click="$emit('addDocking')"
    >
      <ElIcon class="mr-1"><Plus /></ElIcon> 添加保司对接表
    </ElButton>
    <ElButton
      class="w-full !border-dashed !bg-white shadow-sm"
      :class="btnClass"
      @click="$emit('addPayment')"
    >
      <ElIcon class="mr-1"><Plus /></ElIcon> 添加赔付表
    </ElButton>
  </div>
</template>
