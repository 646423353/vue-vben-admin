<script lang="ts" setup>
import type { OrderForm } from '../operate/detail.vue';

import type { VxeGridProps } from '#/adapter/vxe-table';

import { ElCard, ElLink, ElText } from 'element-plus';
import moment from 'moment';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { TaskPostListApi } from '#/api/core/task';

export interface PlanParams {
  id?: string;
  username?: string;
  beginTime: string;
  endTime: string;
  created: string;
  status: number;
}

interface Props {
  orderId?: string;
  locationtype: number | string;
  insureSn?: string | undefined;
  orderInfo?: OrderForm;
}

const props = defineProps<Props>();

const gridOptions: VxeGridProps<PlanParams> = {
  columns: [
    { field: 'seq', title: '操作编号', minWidth: 200 },
    { field: 'orderNo', title: '订单号', minWidth: 180 },
    { field: 'tbr', title: '投保人', minWidth: 180 },
    { field: 'num', title: '人数', minWidth: 180 },
    {
      field: 'created',
      title: '操作时间',
      minWidth: 150,
      visible: props.orderId !== undefined,
      formatter: ({ row }) => moment(row.created).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      field: 'statusPerson',
      title: '状态',
      minWidth: 140,
      visible: props.orderId !== undefined,
      slots: { default: 'status' },
    },
    { field: 'policyNo', title: '保单号', minWidth: 180 },
    {
      title: '投保成功时间',
      minWidth: 150,
      visible: props.orderId !== undefined,
      formatter: ({ row }) =>
        row.status === 2
          ? moment(row.created).format('YYYY-MM-DD HH:mm:ss')
          : '',
    },
    {
      field: 'beginTime',
      title: '保单起保时间',
      minWidth: 150,
      visible: props.orderId !== undefined,
      formatter: ({ row }) =>
        moment(row.beginTime).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      field: 'endTime',
      title: '保单终保时间',
      minWidth: 150,
      visible: props.orderId !== undefined,
      formatter: ({ row }) => moment(row.endTime).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      field: 'action',
      title: '保单下载',
      minWidth: 100,
      visible: props.orderId !== undefined,
      fixed: 'right',
      slots: { default: 'operate' },
    },
  ],
  pagerConfig: {
    enabled: props.orderId !== undefined,
    pageSize: 10,
    pageSizes: [10, 20, 30, 50],
  },
  data: [],
  showOverflow: true,
  minHeight: 300,
  proxyConfig: {
    response: {
      result: 'list',
      total: 'total',
      list: 'list',
    },
    ajax: {
      query: async ({ page }) => {
        const { list, total } = await TaskPostListApi({
          orderId: props.orderId,
          page: page.currentPage,
          size: page.pageSize,
        });
        return { list, total };
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

const getData = () => {
  const $grid = gridApi.grid;
  if ($grid) {
    return $grid.getTableData().fullData;
  }
};

defineExpose({
  getData,
});
</script>

<template>
  <ElCard class="mb-4">
    <template #header>
      <div class="flex items-center justify-between">
        <div>关联保单</div>
      </div>
    </template>

    <Grid>
      <template #status="{ row }">
        <ElText v-if="row.status === 0" type="primary"> 待投保 </ElText>
        <ElText v-else-if="row.status === 1" type="warning"> 投保中 </ElText>
        <ElText v-else-if="row.status === 2" type="success"> 投保成功 </ElText>
        <ElText v-else-if="row.status === 3" type="danger"> 投保失败 </ElText>
      </template>

      <template #operate="{ row }">
        <ElLink
          underline="always"
          type="primary"
          :href="row.pdf"
          target="_blank"
          v-if="row.pdf"
        >
          保单下载
        </ElLink>
      </template>
    </Grid>
  </ElCard>
</template>

<style scoped>
:deep(.relative.rounded) {
  padding: 0;
}

:deep(.bg-background-deep) {
  display: none;
}
</style>
