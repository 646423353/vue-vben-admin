<script lang="ts" setup>
import type { VxeGridProps } from '#/adapter/vxe-table';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import moment from 'moment';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { InsureLogListApi } from '#/api/core/insure';

const id = ref<string>('');

interface RowType {
  /** 主险或附加险id */
  cid?: number;
  /** 修改前单价单位 */
  dayOri?: number;
  /** 单价单位； 30：月/人，1：天/人 */
  days?: number;
  /** 记录id */
  id?: number;
  /** 单价 */
  money?: number;
  /** 修改前价格 */
  moneyOri?: number;
  /** 1启用 0停用 */
  status?: number;
  /** 修改前状态 */
  statusOri?: number;
  /** 0主险 1附加险 */
  type?: number;
  /** 修改人id */
  updateUid?: string;
  /** 修改人昵称 */
  updateUser?: string;
  /** 修改时间 */
  updatedAt?: string;
}

const [Modal, modalApi] = useVbenModal({
  onCancel() {
    id.value = '';
    modalApi.close();
  },
  onOpenChange(isOpen: boolean) {
    if (isOpen) {
      const { id: uid } = modalApi.getData<Record<string, any>>();
      id.value = uid;
    }
  },
  title: '修改记录',
  showConfirmButton: false,
  cancelText: '关闭',
});

const gridOptions: VxeGridProps<RowType> = {
  columns: [
    { title: '序号', type: 'seq', width: 50 },
    {
      field: 'updatedAt',
      title: '操作时间',
      minWidth: 160,
      formatter: ({ row }) =>
        moment(row.updatedAt).format('YYYY-MM-DD HH:mm:ss'),
    },
    { field: 'username', title: '操作人账号', minWidth: 120 },
    { field: 'updateUser', title: '操作人', minWidth: 120 },
    { field: 'moneyOri', title: '原价格', minWidth: 80 },
    { field: 'money', title: '修改后价格', minWidth: 80 },
    {
      field: 'days',
      title: '计价单位',
      minWidth: 100,
      formatter: ({ row }) => (row.days === 1 ? '人 / 日' : '人 / 月'),
    },
    {
      title: '状态修改记录',
      minWidth: 120,
      formatter: ({ row }) => {
        if (row.status === row.statusOri) {
          return '-';
        }
        return row.status === 1 ? '状态修改为可用' : '状态修改为不可用';
      },
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
        return await InsureLogListApi({
          page: page.currentPage,
          size: page.pageSize,
          cid: id.value,
        });
      },
    },
  },
};

const [Grid] = useVbenVxeGrid({ gridOptions });
</script>
<template>
  <Modal>
    <Grid />
  </Modal>
</template>

<style scoped></style>
