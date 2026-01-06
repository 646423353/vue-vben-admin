<script lang="ts" setup>
import { ref } from 'vue';

import {
  ElCard,
  ElDescriptions,
  ElDescriptionsItem,
  ElEmpty,
  ElTag,
} from 'element-plus';

// Mock Data for Risk Parameters
const riskParams = ref({
  totalInsureCount: 156, // 1 骑手历史总投保次数
  earliestInsureDate: '2023-01-15', // 2 最早投保日期
  latestInsureDate: '2025-05-20', // 3 最近投保日期
  consecutiveInsureDays: 45, // 4 最近投保连续天数
  pre30DaysInsureCount: 28, // 5 出险日期前30天投保天数
  post30DaysInsureCount: 12, // 6 出险日期后30天投保天数
  historyCaseCount: 3, // 7 骑手历史案件数
  historyPaidCaseCount: 2, // 8 骑手历史获赔案件数
  historyTotalPaidAmount: 3500, // 9 骑手历史累计获赔金额
  reportTimeLag: '24小时', // 10 当前案件报案时效
  avgReportTimeLag: '18小时', // 11 骑手历史案件报案总时效平均
});

// Mock Data for Triggered Rules
// Set to empty array to test empty state, or populate to show rules
const triggeredRules = ref([
  {
    id: '00001',
    time: '2025-11-01 10:11:11',
    title: '案件发现风险预警规则00001',
    description: '编号00001 预设的规则说明：{骑手历史案件数} > 2',
  },
  {
    id: '00002',
    time: '2025-11-01 10:11:11',
    title: '案件发现Rule2',
    description: '编号00002 预设的规则说明：报案时效超过24小时',
  },
]);

// Helper to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
  }).format(amount);
};
</script>

<template>
  <div class="space-y-6">
    <!-- Risk Parameters Section -->
    <ElCard
      shadow="hover"
      class="risk-card rounded-lg border-none shadow-sm ring-1 ring-gray-100"
    >
      <template #header>
        <div class="flex items-center gap-2">
          <div class="h-4 w-1 rounded-full bg-blue-600"></div>
          <span class="text-base font-bold text-gray-800">基础风险情况</span>
        </div>
      </template>

      <ElDescriptions :column="3" border class="custom-descriptions">
        <ElDescriptionsItem label="骑手历史总投保次数">
          <span class="font-medium text-gray-900">{{
            riskParams.totalInsureCount
          }}</span>
        </ElDescriptionsItem>
        <ElDescriptionsItem label="最早投保日期">
          <span class="font-medium text-gray-900">{{
            riskParams.earliestInsureDate
          }}</span>
        </ElDescriptionsItem>
        <ElDescriptionsItem label="最近投保日期">
          <span class="font-medium text-gray-900">{{
            riskParams.latestInsureDate
          }}</span>
        </ElDescriptionsItem>

        <ElDescriptionsItem label="最近投保连续天数">
          <span class="font-medium text-gray-900"
            >{{ riskParams.consecutiveInsureDays }} 天</span
          >
        </ElDescriptionsItem>
        <ElDescriptionsItem label="出险日期前30天投保天数">
          <span class="font-medium text-gray-900"
            >{{ riskParams.pre30DaysInsureCount }} 天</span
          >
        </ElDescriptionsItem>
        <ElDescriptionsItem label="出险日期后30天投保天数 (截止创建案件)">
          <span class="font-medium text-gray-900"
            >{{ riskParams.post30DaysInsureCount }} 天</span
          >
        </ElDescriptionsItem>

        <ElDescriptionsItem label="骑手历史案件数">
          <span class="font-medium text-gray-900">{{
            riskParams.historyCaseCount
          }}</span>
        </ElDescriptionsItem>
        <ElDescriptionsItem label="骑手历史获赔案件数">
          <span class="font-medium text-gray-900">{{
            riskParams.historyPaidCaseCount
          }}</span>
        </ElDescriptionsItem>
        <ElDescriptionsItem label="骑手历史累计获赔金额 (赔付已结案)">
          <span class="font-medium text-gray-900">{{
            formatCurrency(riskParams.historyTotalPaidAmount)
          }}</span>
        </ElDescriptionsItem>

        <ElDescriptionsItem label="当前案件报案时效 (创建-出险)">
          <span class="font-medium text-gray-900">{{
            riskParams.reportTimeLag
          }}</span>
        </ElDescriptionsItem>
        <ElDescriptionsItem
          label="骑手历史案件 (不含当前) 报案总时效平均"
          :span="2"
        >
          <span class="font-medium text-gray-900">{{
            riskParams.avgReportTimeLag
          }}</span>
        </ElDescriptionsItem>
      </ElDescriptions>
    </ElCard>

    <!-- Triggered Rules Section -->
    <ElCard
      shadow="hover"
      class="risk-card rounded-lg border-none shadow-sm ring-1 ring-gray-100"
    >
      <template #header>
        <div class="flex items-center gap-2">
          <div class="h-4 w-1 rounded-full bg-red-500"></div>
          <span class="text-base font-bold text-gray-800"
            >触发风险预警记录</span
          >
        </div>
      </template>

      <div v-if="triggeredRules.length > 0" class="space-y-4">
        <div
          v-for="rule in triggeredRules"
          :key="rule.id"
          class="relative overflow-hidden rounded-lg bg-red-50 p-4 transition-all hover:shadow-md"
        >
          <!-- Left accent border -->
          <div class="absolute bottom-0 left-0 top-0 w-1 bg-red-500"></div>

          <div class="pl-2">
            <div class="mb-2 flex items-center gap-3">
              <span class="font-mono text-sm text-gray-500">{{
                rule.time
              }}</span>
              <ElTag type="danger" effect="dark" size="small" round
                >风险预警</ElTag
              >
              <span class="font-bold text-gray-800">{{ rule.title }}</span>
            </div>
            <div class="text-sm text-gray-600">
              <span class="font-medium text-gray-700">计算规则：</span>
              {{ rule.description }}
            </div>
          </div>
        </div>
      </div>

      <div v-else class="py-10">
        <ElEmpty description="未触发风险预警" :image-size="100" />
      </div>
    </ElCard>
  </div>
</template>

<style scoped>
/* Custom styling for descriptions to match 'Chinese enterprise' aesthetic */
.custom-descriptions :deep(.el-descriptions__label) {
  width: 180px; /* Fixed width labels for alignment */
  font-weight: 500;
  color: #64748b;
  background-color: #f8fafc;
}

.custom-descriptions :deep(.el-descriptions__content) {
  color: #1e293b;
  background-color: #fff;
}

.risk-card :deep(.el-card__header) {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #f1f5f9;
}

.risk-card :deep(.el-card__body) {
  padding: 1.25rem;
}
</style>
