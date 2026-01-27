<script lang="ts" setup>
import type { EchartsUIType } from '@vben/plugins/echarts';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

import { ElButton, ElCard } from 'element-plus';

interface StatisticCardProps {
  id: number;
  title: string;
  description?: string;
  chartType: 'bar' | 'line';
  data?: number[];
  xAxisData?: string[];
}

const props = defineProps<StatisticCardProps>();

const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);

const [DescriptionModal, descriptionModalApi] = useVbenModal({
  showConfirmButton: false,
  cancelText: '关闭',
  onOpenChange: (isOpen) => {
    if (isOpen) {
      descriptionModalApi.setState({
        title: props.title,
      });
    }
  },
});

const showDescription = () => {
  descriptionModalApi.open();
};

const renderChart = () => {
  const baseOption = {
    grid: {
      bottom: '15%', // Increase bottom space for dataZoom
      containLabel: true,
      left: '3%',
      right: '4%',
      top: '10%',
    },
    dataZoom: [
      {
        type: 'slider',
        show: true,
        xAxisIndex: [0],
        start: 0,
        end: 30, // Show first 30% by default to avoid overcrowding
      },
    ],
    tooltip: {
      axisPointer: {
        lineStyle: {
          color: '#019680',
          width: 1,
        },
      },
      trigger: 'axis' as const,
    },
    xAxis: {
      axisTick: {
        show: false,
      },
      axisLabel: {
        interval: 0, // Force show all labels
        rotate: 0, // No rotation if dataZoom handles density
      },
      boundaryGap: props.chartType === 'bar',
      data: props.xAxisData || [],
      splitLine: {
        lineStyle: {
          type: 'dashed' as const,
          width: 1,
        },
        show: true,
      },
      type: 'category' as const,
    },
    yAxis: [
      {
        axisTick: {
          show: false,
        },
        splitArea: {
          show: true,
        },
        splitNumber: 4,
        type: 'value' as const,
      },
    ],
  };

  if (props.chartType === 'line') {
    renderEcharts({
      ...baseOption,
      series: [
        {
          areaStyle: {
            color: {
              colorStops: [
                { offset: 0, color: 'rgba(90, 177, 239, 0.3)' },
                { offset: 1, color: 'rgba(90, 177, 239, 0)' },
              ],
              type: 'linear',
              x: 0,
              x2: 0,
              y: 0,
              y2: 1,
            },
          },
          data: props.data || [],
          itemStyle: {
            color: '#5ab1ef',
          },
          lineStyle: {
            width: 2,
          },
          smooth: true,
          type: 'line',
        },
      ],
    });
  } else {
    renderEcharts({
      ...baseOption,
      series: [
        {
          data: props.data || [],
          itemStyle: {
            color: '#5ab1ef',
          },
          type: 'bar',
        },
      ],
    });
  }
};

defineExpose({ renderChart });
</script>

<template>
  <ElCard class="statistic-card mb-6 !rounded-lg border-none shadow-md">
    <template #header>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <span class="text-lg font-bold text-gray-900 dark:text-gray-100">
            {{ title }}
          </span>
          <span class="text-sm text-gray-400">ID: {{ id }}</span>
        </div>
        <ElButton
          v-if="description"
          link
          type="primary"
          @click="showDescription"
        >
          查看说明
        </ElButton>
      </div>
    </template>

    <div class="chart-container">
      <EchartsUI ref="chartRef" style="height: 400px" />
    </div>
  </ElCard>

  <DescriptionModal>
    <div class="p-6">
      <p class="text-gray-700 dark:text-gray-300">
        {{ description || '暂无说明' }}
      </p>
    </div>
  </DescriptionModal>
</template>

<style scoped>
.statistic-card {
  transition: all 0.3s ease;
}

.statistic-card:hover {
  box-shadow: 0 8px 16px rgb(0 0 0 / 10%);
}
</style>
