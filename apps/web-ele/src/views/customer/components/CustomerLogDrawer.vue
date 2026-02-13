<script lang="ts" setup>
import type { VxeGridProps } from '#/adapter/vxe-table';

import { useVbenDrawer } from '@vben/common-ui';

import moment from 'moment';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { CustomerLogListApi } from '#/api/core/customer';

interface RowType {
  dt: string;
  username: string;
  type: number;
  ori: string;
  curr: string;
}

const gridOptions: VxeGridProps<RowType> = {
  columns: [
    {
      field: 'dt',
      title: '修改时间',
      minWidth: 160,
      formatter: ({ cellValue }) => {
        return cellValue
          ? moment(Number(cellValue)).format('YYYY-MM-DD HH:mm:ss')
          : '';
      },
    },
    { field: 'username', title: '操作人', minWidth: 120 },
    {
      field: 'type',
      title: '修改类型',
      minWidth: 150,
      formatter: ({ cellValue }) => {
        const map: Record<number, string> = {
          1: '修改批处理时间',
          2: '删除客户',
        };
        return map[cellValue] || cellValue;
      },
    },
    { field: 'ori', title: '修改前值', width: 150 },
    { field: 'curr', title: '修改后值', width: 150 },
  ],
  minHeight: 300,
  pagerConfig: {
    enabled: true,
  },
  showOverflow: true,
  tooltipConfig: {
    enterable: true,
  },
  proxyConfig: {
    response: {
      result: 'list',
      total: 'total',
      list: 'list',
    },
    ajax: {
      query: async ({ page }, formValues) => {
        const { customerId } = formValues;
        if (!customerId) return { list: [], total: 0 };
        const res = await CustomerLogListApi({
          customerId,
          page: page.currentPage,
          size: page.pageSize,
        });
        return { list: res.list || [], total: res.total || 0 };
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions } as any);

const [Drawer, drawerApi] = useVbenDrawer({
  title: '客户修改历史',
  showConfirmButton: false,
  cancelText: '关闭',
  async onOpenChange(isOpen) {
    if (isOpen) {
      const { customerId } = drawerApi.getData<Record<string, any>>();
      // Force update UI options
      drawerApi.setState({ showConfirmButton: false, cancelText: '关闭' });

      setTimeout(() => {
        if (customerId) {
          try {
            gridApi.reload({ customerId });
          } catch (error) {
            console.error('Grid reload failed', error);
          }
        }
      }, 500);
    }
  },
});

const open = (customerId: number | string) => {
  drawerApi.setData({ customerId });
  drawerApi.open();
};

defineExpose({ open });
</script>

<template>
  <Drawer>
    <Grid />
  </Drawer>
</template>

<style>
.vxe-tooltip--wrapper {
  z-index: 99999 !important;
}
</style>
