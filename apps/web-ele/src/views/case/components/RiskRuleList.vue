<script lang="ts" setup>
import { AntdPlusOutlined } from '@vben/icons';

import { ElButton, ElIcon } from 'element-plus';

interface RiskRule {
  id: string;
  code: string;
  status: 'active' | 'inactive';
  rule: string;
  message: string;
}

const emit = defineEmits(['create']);

const rules: RiskRule[] = [
  {
    id: '1',
    code: '00001',
    status: 'active',
    rule: '{骑手历史总投保次数} ÷ {骑手历史案件数} < 100 则 进行风险预警',
    message: '案件预警-骑手高频报案!',
  },
  {
    id: '2',
    code: '00002',
    status: 'inactive',
    rule: '{骑手历史案件数} > 10 则 进行风险预警',
    message: '案件预警-骑手大量报案!',
  },
];

function handleCreate() {
  emit('create');
}
</script>

<template>
  <div class="px-2 py-4">
    <div class="mb-6 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <div class="h-5 w-1 rounded-full bg-blue-600"></div>
        <h2 class="text-lg font-bold text-gray-900">设置风险预警规则</h2>
      </div>
      <ElButton type="primary" class="!rounded-lg" @click="handleCreate">
        <ElIcon class="mr-1"><AntdPlusOutlined /></ElIcon>
        新建规则
      </ElButton>
    </div>

    <div class="space-y-4">
      <div
        v-for="item in rules"
        :key="item.id"
        class="group relative overflow-hidden rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-300 hover:border-blue-100 hover:shadow-md"
      >
        <!-- Status Strip -->
        <div
          class="absolute bottom-0 left-0 top-0 w-1 transition-colors duration-300"
          :class="item.status === 'active' ? 'bg-green-500' : 'bg-gray-300'"
        ></div>

        <div class="mb-4 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="text-base font-bold text-gray-900"
              >编号：{{ item.code }}</span
            >
            <span
              class="flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
              :class="
                item.status === 'active'
                  ? 'bg-green-50 text-green-600'
                  : 'bg-gray-100 text-gray-500'
              "
            >
              <span
                class="h-1.5 w-1.5 rounded-full"
                :class="
                  item.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                "
              ></span>
              {{ item.status === 'active' ? '已生效' : '未生效' }}
            </span>
          </div>
          <!-- Optional: Edit/Delete actions could go here -->
        </div>

        <div class="space-y-3 pl-1">
          <div class="flex items-start gap-4">
            <span class="w-20 shrink-0 text-sm text-gray-500">计算规则</span>
            <div
              class="flex-1 rounded-md bg-gray-50 px-3 py-2 text-sm font-medium text-gray-800"
            >
              {{ item.rule }}
            </div>
          </div>
          <div class="flex items-start gap-4">
            <span class="w-20 shrink-0 text-sm text-gray-500">提示文字</span>
            <span class="py-1 text-sm font-medium text-red-500">
              {{ item.message }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
