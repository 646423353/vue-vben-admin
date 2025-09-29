<script lang="ts" setup>
import type { EchartsUIType } from '@vben/plugins/echarts';

import { onMounted, ref } from 'vue';

import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

import moment from 'moment';

import { getRiderDailyActiveAnalytics } from '#/api/core/analytics';

const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);

onMounted(async () => {
  const riderDailyActiveAnalyticsResult = await getRiderDailyActiveAnalytics({
    begintime: moment().subtract(30, 'days').startOf('day').valueOf(),
    endtime: moment().endOf('day').valueOf(),
  });

  const data =
    riderDailyActiveAnalyticsResult?.map(
      (item: { peoplecount: number }) => item.peoplecount,
    ) || [];

  renderEcharts({
    grid: {
      bottom: 0,
      containLabel: true,
      left: '1%',
      right: '1%',
      top: '2 %',
    },
    series: [
      {
        areaStyle: {},
        data: data.reverse(),
        itemStyle: {
          color: '#5ab1ef',
        },
        smooth: true,
        type: 'line',
      },
    ],
    tooltip: {
      axisPointer: {
        lineStyle: {
          color: '#019680',
          width: 1,
        },
      },
      trigger: 'axis',
    },
    xAxis: {
      axisTick: {
        show: false,
      },
      boundaryGap: false,
      data: Array.from({ length: 31 }).map((_item, index) => {
        const date = new Date();
        date.setDate(date.getDate() - (30 - index));
        return `${date.getMonth() + 1}-${date.getDate()}`;
      }),
      splitLine: {
        lineStyle: {
          type: 'solid',
          width: 1,
        },
        show: true,
      },
      type: 'category',
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
        type: 'value',
      },
    ],
  });
});
</script>

<template>
  <EchartsUI ref="chartRef" style="height: 450px" />
</template>
