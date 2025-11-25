<script lang="ts" setup>
import type { AnalysisOverviewItem } from '@vben/common-ui';

import { markRaw, onMounted, reactive, ref } from 'vue';

import { AccessControl } from '@vben/access';
import { AnalysisOverview } from '@vben/common-ui';
import {
  SvgBellIcon,
  SvgCakeIcon,
  SvgLocationIcon,
  SvgRiderIcon,
} from '@vben/icons';

import { ElCard, ElTable, ElTableColumn } from 'element-plus';
import moment from 'moment';

import {
  getOrderAnalytics,
  getRiderCountAnalytics,
  getRiderHistoryCountAnalytics,
  getStationAnalytics,
} from '#/api/core/analytics';
import { TaskGetLastApi } from '#/api/core/task';

import AnalyticsTrends from './analytics-trends.vue';

const riderCount = ref(0);
const riderHistoryCount = ref(0);

const orderCount = ref(0);
const orderHistoryCount = ref(0);

const stopCount = ref(0);
const stopHistoryCount = ref(0);

const overviewItems = reactive<AnalysisOverviewItem[]>([
  {
    icon: markRaw(SvgRiderIcon),
    title: '在保骑手',
    totalTitle: '历史总骑手数',
    totalValue: 0,
    value: 0,
  },
  {
    icon: markRaw(SvgCakeIcon),
    title: '生效中订单',
    totalTitle: '历史总订单数',
    totalValue: orderHistoryCount.value,
    value: orderCount.value,
  },
  {
    icon: markRaw(SvgLocationIcon),
    title: '生效站点',
    totalTitle: '总站点数',
    totalValue: stopHistoryCount.value,
    value: stopCount.value,
  },
  {
    icon: markRaw(SvgBellIcon),
    title: '最近自动投保单',
    totalTitle: '最近操作时间',
    totalValue: '0000/00/00 00:00:00',
    value: '0成功/0总待投',
  },
]);

const tableData = [
  {
    date: '2025-09-20 10:00',
    address: '账号XCxiie完成自动投保，待投保保单10，成功9失败1',
  },
];

const getOrderCount = async (tag?: number) => {
  return await getOrderAnalytics(tag);
};

const getStopCount = async (tag?: number) => {
  return await getStationAnalytics(tag);
};

const getTaskList = async () => {
  const res = await TaskGetLastApi();
  const { policyCountSuccess, policyCount, created } = res || {};
  return {
    policyCount: policyCount || 0,
    policySuccessCount: policyCountSuccess || 0,
    policyTime: created || '',
  };
};

onMounted(async () => {
  const riderCountResult = await getRiderCountAnalytics();
  riderCount.value = riderCountResult || 0;
  const riderHistoryCountResult = await getRiderHistoryCountAnalytics();
  riderHistoryCount.value = riderHistoryCountResult || 0;

  const orderCountResult = await getOrderCount(0);
  orderCount.value = orderCountResult || 0;
  const orderHistoryCountResult = await getOrderAnalytics(1);
  orderHistoryCount.value = orderHistoryCountResult || 0;

  const stopCountResult = await getStopCount(0);
  stopCount.value = stopCountResult || 0;
  const stopHistoryCountResult = await getStopCount(1);
  stopHistoryCount.value = stopHistoryCountResult || 0;

  const { policyCount, policySuccessCount, policyTime } = await getTaskList();

  if (overviewItems.length > 0) {
    if (overviewItems[0]) {
      overviewItems[0].totalValue = riderHistoryCount.value;
      overviewItems[0].value = riderCount.value;
    }
    if (overviewItems[1]) {
      overviewItems[1].totalValue = orderHistoryCount.value;
      overviewItems[1].value = orderCount.value;
    }
    if (overviewItems[2]) {
      overviewItems[2].totalValue = stopHistoryCount.value;
      overviewItems[2].value = stopCount.value;
    }
    if (overviewItems[3]) {
      overviewItems[3].totalValue = policyTime
        ? moment(policyTime).format('YYYY-MM-DD HH:mm:ss')
        : '暂无数据';
      overviewItems[3].value = `${policySuccessCount}成功/${policyCount}总待投`;
    }
  }
});
</script>

<template>
  <div class="p-5">
    <AccessControl :codes="['1', '13']" type="code">
      <ElCard class="mb-5">
        <template #header>
          <div class="d-flex justify-between">
            <div>超管信息日志</div>
          </div>
        </template>

        <ElTable :data="tableData" border style="width: 100%">
          <ElTableColumn prop="date" label="时间" min-width="180" />
          <ElTableColumn prop="address" label="日志记录" min-width="250" />
        </ElTable>
      </ElCard>
    </AccessControl>

    <AnalysisOverview :items="overviewItems" />

    <ElCard class="mt-5">
      <template #header>
        <div class="d-flex justify-between">
          <div>骑手数量统计曲线图</div>
        </div>
      </template>

      <AnalyticsTrends />
    </ElCard>
  </div>
</template>
