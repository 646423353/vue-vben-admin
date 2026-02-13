<script lang="ts" setup>
import type { VxeGridProps } from '#/adapter/vxe-table';

import { useVbenDrawer } from '@vben/common-ui';

import moment from 'moment';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { OrderLogListApi } from '#/api/core/order';

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
          0: '修改骑手信息',
          1: '修改名义保单生成范围',
          2: '删除订单',
        };
        return map[cellValue] || cellValue;
      },
    },
    { field: 'ori', title: '修改前值', width: 150, showOverflow: true },
    { field: 'curr', title: '修改后值', width: 150, showOverflow: true },
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
        const { orderId } = formValues;
        if (!orderId) return { list: [], total: 0 };
        const res = await OrderLogListApi({
          orderId,
          page: page.currentPage,
          size: page.pageSize,
        });
        return { list: res.list || [], total: res.total || 0 };
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions } as any);

// ... imports

const [Drawer, drawerApi] = useVbenDrawer({
  title: '订单修改历史',
  showConfirmButton: false,
  cancelText: '关闭',
  async onOpenChange(isOpen) {
    if (isOpen) {
      const { orderId } = drawerApi.getData<Record<string, any>>();
      // Force update UI options

      setTimeout(() => {
        if (orderId) {
          try {
            gridApi.reload({ orderId });
          } catch (error) {
            console.error('Grid reload failed', error);
          }
        }
      }, 500);
    }
  },
});

const open = (orderId: number | string) => {
  drawerApi.setData({ orderId });
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
