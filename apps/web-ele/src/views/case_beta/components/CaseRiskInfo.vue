<script lang="ts" setup>
import type { CaseAlarmApi } from '#/api/core/case-alarm';

import { ref, watch } from 'vue';

import {
  ElCard,
  ElDescriptions,
  ElDescriptionsItem,
  ElEmpty,
  ElTag,
} from 'element-plus';
import moment from 'moment';

import {
  getCaseAlarmListApi,
  getCaseAlarmParasApi,
} from '#/api/core/case-alarm';

const props = defineProps<{
  caseId?: string;
}>();

const riskParams = ref<CaseAlarmApi.TbCaseAlarmPara>({});
const loading = ref(false);

const triggeredRules = ref<CaseAlarmApi.TbCaseYujing[]>([]);

async function fetchRiskParams() {
  if (!props.caseId) return;
  loading.value = true;
  try {
    const res = await getCaseAlarmParasApi(props.caseId);
    riskParams.value = res || {};
  } catch (error) {
    console.error('Failed to fetch risk params:', error);
  } finally {
    loading.value = false;
  }
}

async function fetchRiskRules() {
  if (!props.caseId) return;
  try {
    const res = await getCaseAlarmListApi({
      caseId: props.caseId,
      page: 1,
      size: 100, // Fetch all or enough items
    });
    triggeredRules.value = res.list || [];
  } catch (error) {
    console.error(error);
  }
}

watch(
  () => props.caseId,
  (val) => {
    if (val) {
      fetchRiskParams();
      fetchRiskRules();
    }
  },
  { immediate: true },
);

// Helper to format currency
const formatCurrency = (amount?: number) => {
  if (!amount) return '¥0.00';
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
  }).format(amount);
};

// Helper to format hours
const formatHours = (hours?: number) => {
  if (!hours) return '-';
  return `${hours}小时`;
};

// Helper to format timestamp
const formatTimestamp = (timestamp?: number | string) => {
  if (!timestamp) return '-';
  return moment(Number(timestamp)).format('YYYY-MM-DD HH:mm:ss');
};

// Helper to format date
const formatDate = (timestamp?: number | string) => {
  if (!timestamp) return '-';
  return moment(Number(timestamp)).format('YYYY-MM-DD');
};
</script>

<template>
  <div class="space-y-6">
    <!-- Risk Parameters Section -->
    <ElCard
      shadow="hover"
      class="risk-card rounded-lg border-none shadow-sm ring-1 ring-gray-100 dark:bg-slate-800 dark:ring-gray-700"
    >
      <template #header>
        <div class="flex items-center gap-2">
          <div class="h-4 w-1 rounded-full bg-blue-600"></div>
          <span class="text-base font-bold text-gray-800 dark:text-gray-100"
            >基础风险情况</span
          >
        </div>
      </template>

      <div class="overflow-x-auto">
        <div class="min-w-[800px]">
          <ElDescriptions :column="3" border class="custom-descriptions">
            <ElDescriptionsItem label="骑手历史总投保次数">
              <span class="font-medium text-gray-900 dark:text-gray-200">{{
                riskParams.tbCount || 0
              }}</span>
            </ElDescriptionsItem>
            <ElDescriptionsItem label="最早投保日期">
              <span class="font-medium text-gray-900 dark:text-gray-200">{{
                formatDate(riskParams.tbBeginTime)
              }}</span>
            </ElDescriptionsItem>
            <ElDescriptionsItem label="最近投保日期">
              <span class="font-medium text-gray-900 dark:text-gray-200">{{
                formatDate(riskParams.tbBeginTimeRecent)
              }}</span>
            </ElDescriptionsItem>

            <ElDescriptionsItem label="最近投保距今天数">
              <span class="font-medium text-gray-900 dark:text-gray-200"
                >{{ riskParams.tbDays || 0 }} 天</span
              >
            </ElDescriptionsItem>
            <ElDescriptionsItem label="出险日期前30天投保天数">
              <span class="font-medium text-gray-900 dark:text-gray-200"
                >{{ riskParams.tbDaysAccident || 0 }} 天</span
              >
            </ElDescriptionsItem>
            <ElDescriptionsItem label="出险日期后30天投保天数 (截止创建案件)">
              <span class="font-medium text-gray-900 dark:text-gray-200"
                >{{ riskParams.tbDaysAfterAccident || 0 }} 天</span
              >
            </ElDescriptionsItem>

            <ElDescriptionsItem label="骑手历史案件数">
              <span class="font-medium text-gray-900 dark:text-gray-200">{{
                riskParams.caseCountHistory || 0
              }}</span>
            </ElDescriptionsItem>
            <ElDescriptionsItem label="骑手历史获赔案件数">
              <span class="font-medium text-gray-900 dark:text-gray-200">{{
                riskParams.caseCountHistoryLipei || 0
              }}</span>
            </ElDescriptionsItem>
            <ElDescriptionsItem label="骑手历史累计获赔金额 (赔付已结案)">
              <span class="font-medium text-gray-900 dark:text-gray-200">{{
                formatCurrency(riskParams.caseMoneyHistoryLipei)
              }}</span>
            </ElDescriptionsItem>

            <ElDescriptionsItem label="当前案件报案时效 (创建-出险)">
              <span class="font-medium text-gray-900 dark:text-gray-200">{{
                formatHours(riskParams.times)
              }}</span>
            </ElDescriptionsItem>
            <ElDescriptionsItem label="骑手历史案件 (不含当前) 报案总时效平均">
              <span class="font-medium text-gray-900 dark:text-gray-200">{{
                formatHours(riskParams.timesAverage)
              }}</span>
            </ElDescriptionsItem>
            <ElDescriptionsItem label="黑名单库">
              <span class="font-medium text-gray-900 dark:text-gray-200"
                >无记录</span
              >
            </ElDescriptionsItem>
          </ElDescriptions>
        </div>
      </div>
    </ElCard>

    <!-- Triggered Rules Section -->
    <ElCard
      shadow="hover"
      class="risk-card rounded-lg border-none shadow-sm ring-1 ring-gray-100 dark:bg-slate-800 dark:ring-gray-700"
    >
      <template #header>
        <div class="flex items-center gap-2">
          <div class="h-4 w-1 rounded-full bg-red-500"></div>
          <span class="text-base font-bold text-gray-800 dark:text-gray-100"
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
                formatTimestamp(rule.created)
              }}</span>
              <ElTag type="danger" effect="dark" size="small" round
                >风险预警</ElTag
              >
              <div class="text-base font-bold text-gray-800">
                {{ rule.rules }}
              </div>
            </div>
            <div class="text-sm text-gray-600">
              <span class="font-medium text-gray-700">计算规则：</span>
              {{ rule.zt }}
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

<style>
.dark .custom-descriptions .el-descriptions__label {
  color: #94a3b8;
  background-color: #1e293b;
}

.dark .custom-descriptions .el-descriptions__content {
  color: #e2e8f0;
  background-color: #0f172a;
}

.dark .risk-card .el-card__header {
  border-bottom: 1px solid #334155;
}
</style>
