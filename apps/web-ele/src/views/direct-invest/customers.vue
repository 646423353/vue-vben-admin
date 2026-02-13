<script lang="ts" setup>
import type { VxeGridProps } from '#/adapter/vxe-table';

import { watch } from 'vue';

import { Page } from '@vben/common-ui';

import { useDebounceFn, useWindowSize } from '@vueuse/core';
import moment from 'moment';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { CustomerListApi } from '#/api/core/customer';

interface CustomerType {
  id: number;
  username: string;
  carda: string;
  cardb: string;
  mail: string;
  systemnum: string;
  created: string;
  updated: string;
  stopHour: number;
}

const gridOptions: VxeGridProps<CustomerType> = {
  columns: [
    { field: 'id', title: '序号', width: 80 },
    { field: 'username', title: '客户名称', minWidth: 200 },
    { field: 'systemnum', title: '统一社会信用代码', minWidth: 180 },
    { field: 'uuid', title: '系统编号', minWidth: 120 },
    { field: 'mail', title: '邮箱', minWidth: 180 },
    {
      field: 'stopHour',
      title: '批量投保截止时间',
      minWidth: 150,
      formatter: ({ row }) => {
        if (row.stopHour === -1) return '不参与批量投保';
        return row.stopHour ? `${row.stopHour}:00` : '';
      },
    },
    {
      field: 'created',
      title: '创建时间',
      formatter: ({ row }) =>
        row.created ? moment(row.created).format('YYYY-MM-DD HH:mm:ss') : '',
      minWidth: 160,
    },
    {
      field: 'updated',
      title: '修改时间',
      formatter: ({ row }) =>
        row.updated ? moment(row.updated).format('YYYY-MM-DD HH:mm:ss') : '',
      minWidth: 160,
    },
  ],
  pagerConfig: {
    enabled: true,
    pageSize: 20,
    pageSizes: [10, 20, 30, 50],
  },
  sortConfig: {
    multiple: true,
  },
  toolbarConfig: {
    custom: true,
  },
  minHeight: 500,
  stripe: true,
  border: true,
  proxyConfig: {
    response: {
      result: 'list',
      total: 'total',
      list: 'list',
    },
    ajax: {
      query: async ({ page }) => {
        // TODO: 待后端提供APP客户类型过滤参数后补充过滤条件
        return await CustomerListApi(
          { zt: 1 },
          {
            page: page.currentPage,
            size: page.pageSize,
            withTag: 0,
            withStop: 0,
            withInsure: 0,
          },
        );
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions } as any);

const { height } = useWindowSize();

const resizeHandler: () => void = useDebounceFn(resize, 200);
watch([height], () => {
  resizeHandler?.();
});

function resize() {
  if (height.value - 210 < 600) {
    gridApi.setGridOptions({
      height: height.value + 190,
      maxHeight: 0,
    });
  } else {
    gridApi.setGridOptions({
      height: 0,
      maxHeight: height.value - 210,
    });
  }
}
resize();
</script>

<template>
  <Page title="直投客户列表">
    <div class="vp-raw w-full">
      <Grid />
    </div>
  </Page>
</template>
