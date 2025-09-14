<script lang="ts" setup>
import type { AnalysisOverviewItem } from '@vben/common-ui';

import { AnalysisOverview } from '@vben/common-ui';
import {
  SvgBellIcon,
  SvgCakeIcon,
  SvgLocationIcon,
  SvgRiderIcon,
} from '@vben/icons';

import { ElCard } from 'element-plus';

import AnalyticsTrends from './analytics-trends.vue';

const overviewItems: AnalysisOverviewItem[] = [
  {
    icon: SvgRiderIcon,
    title: '在保骑手',
    totalTitle: '历史总骑手数',
    totalValue: 120_000,
    value: 2000,
  },
  {
    icon: SvgCakeIcon,
    title: '生效中订单',
    totalTitle: '历史总订单数',
    totalValue: 500_000,
    value: 20_000,
  },
  {
    icon: SvgLocationIcon,
    title: '生效站点',
    totalTitle: '总站点数',
    totalValue: 120_000,
    value: 8000,
  },
  {
    icon: SvgBellIcon,
    title: '最近自动投保单',
    totalTitle: '最近操作时间',
    totalValue: '2025/9/1 20:18',
    value: '10成功/10总待投',
  },
];
</script>

<template>
  <div class="p-5">
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
