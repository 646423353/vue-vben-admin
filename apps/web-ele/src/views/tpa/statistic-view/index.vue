<script lang="ts" setup>
import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

// import { CaseSetApi } from '#/api/core/case-set';
import {
  getMonthlyChartDataApi,
  getPersonChartDataApi,
} from '#/api/core/case-statistics';

import StatisticCard from './StatisticCard.vue';

interface StatisticItem {
  id: number;
  title: string;
  description?: string;
  chartType: 'bar' | 'line';
  data?: number[];
  xAxisData?: string[];
}

const loading = ref(false);
const statisticCards = ref<StatisticItem[]>([]);
const cardRefs = ref<any[]>([]);

const loadStatistics = async () => {
  loading.value = true;
  try {
    const [monthRes, personRes] = await Promise.all([
      getMonthlyChartDataApi(),
      getPersonChartDataApi({ page: 1, size: 100 }),
    ]);

    const lineChartData = {
      data: [] as number[],
      xAxisData: [] as string[],
    };

    if (monthRes) {
      monthRes.forEach((item) => {
        lineChartData.xAxisData.push(item.months || '');
        lineChartData.data.push(item.cc || 0);
      });
    }

    const barChartData = {
      data: [] as number[],
      xAxisData: [] as string[],
    };

    if (personRes && personRes.list) {
      personRes.list.forEach((item) => {
        barChartData.xAxisData.push(item.username || '未知');
        barChartData.data.push(item.cc || 0);
      });
    }

    statisticCards.value = [
      {
        id: 1,
        title: '月度理赔案件数',
        description:
          '统计过去12个月内，每个月创建的理赔案件数。纵轴数量，横轴年月份，类似2025-10、2025-11、2025-12',
        chartType: 'line',
        data: lineChartData.data,
        xAxisData: lineChartData.xAxisData,
      },
      {
        id: 2,
        title: '案件处理效率统计',
        description: '统计各处理人的案件处理数量和平均处理时长',
        chartType: 'bar',
        data: barChartData.data,
        xAxisData: barChartData.xAxisData,
      },
    ];
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  await loadStatistics();
  // 渲染所有图表
  setTimeout(() => {
    cardRefs.value.forEach((card) => {
      card?.renderChart();
    });
  }, 100);
});
</script>

<template>
  <Page title="统计展示" v-loading="loading">
    <div class="px-4 py-6">
      <div
        v-if="statisticCards.length === 0 && !loading"
        class="py-12 text-center"
      >
        <p class="text-lg text-gray-400">暂无统计数据</p>
      </div>

      <div v-else class="space-y-6">
        <StatisticCard
          v-for="item in statisticCards"
          :id="item.id"
          :key="item.id"
          ref="cardRefs"
          :chart-type="item.chartType"
          :data="item.data"
          :description="item.description"
          :title="item.title"
          :x-axis-data="item.xAxisData"
        />
      </div>
    </div>
  </Page>
</template>
