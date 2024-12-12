<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';

import { Page, useVbenModal } from '@vben/common-ui';

import { ElLink } from 'element-plus';
import moment from 'moment';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { OrderMembersApi } from '#/api/core/order';

import planDetailModal from './components/PlanDetailModal.vue';

interface OrderType {
  id: number;
  beginTime: string;
  bxbm: string;
  creditcard: string;
  customerId: string;
  endTime: string;
  lzxtype: string;
  orderId: string;
  safetype: string;
  userid: number;
  username: string;
  ywxtype: string;
  mainInsure: string;
  addiInsure: string;
  comment: string;
  comment2: string;
}

const formOptions: VbenFormProps = {
  schema: [
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入方案名称',
        allowClear: true,
      },
      fieldName: 'ordertype',
      label: '方案名称',
    },
    {
      component: 'Select',
      componentProps: {
        clearable: true,
        options: [
          {
            key: 1,
            label: '启用',
            value: 1,
          },
          {
            key: 2,
            label: '禁用',
            value: 2,
          },
          {
            key: 0,
            label: '删除',
            value: 0,
          },
        ],
        placeholder: '请选择',
        filterable: true,
      },
      fieldName: 'state',
      label: '状态',
    },
  ],
  showCollapseButton: false,
  submitButtonOptions: {
    content: '查询',
  },
  submitOnEnter: false,
};

const gridOptions: VxeGridProps<OrderType> = {
  columns: [
    { field: 'orderNo', title: '订单号', width: 150 },
    { field: 'customerName', title: '所属公司', minWidth: 160 },
    { field: 'bxbm', title: '保险编码', minWidth: 150 },
    { field: 'mainInsure', title: '主险方案', minWidth: 150 },
    { field: 'addiInsure', title: '附加险方案', minWidth: 150 },
    { field: 'username', title: '姓名', minWidth: 100 },
    { field: 'creditcard', title: '身份证', minWidth: 150 },
    {
      field: 'beginTime',
      title: '起保日期',
      minWidth: 120,
      formatter: ({ row }) =>
        row.beginTime ? moment(row.beginTime).format('YYYY-MM-DD') : '',
    },
    {
      field: 'endTime',
      title: '终保日期',
      minWidth: 120,
      formatter: ({ row }) =>
        row.endTime ? moment(row.endTime).format('YYYY-MM-DD') : '',
    },
    {
      field: 'comment',
      showOverflow: true,
      title: '备注1',
      minWidth: 200,
    },
    {
      field: 'comment2',
      showOverflow: true,
      title: '备注2',
      minWidth: 200,
    },
    // {
    //   title: '操作',
    //   fixed: 'right',
    //   width: 140,
    //   slots: { default: 'operate' },
    //   showOverflow: true,
    // },
  ],
  minHeight: 400,
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
      query: async ({ page }, formValues) => {
        return await OrderMembersApi(
          {
            ...formValues,
          },
          {
            page: page.currentPage,
            size: page.pageSize,
          },
        );
      },
    },
  },
};

const [Grid] = useVbenVxeGrid({ formOptions, gridOptions });

const [PlanDetailModal, PlanDetailModalApi] = useVbenModal({
  connectedComponent: planDetailModal,
  closeOnClickModal: false,
  draggable: true,
});

const detail = (id: number) => {
  PlanDetailModalApi.setData({ id });
  PlanDetailModalApi.open();
};
</script>

<template>
  <Page title="人员查询">
    <div class="vp-raw w-full">
      <Grid>
        <template #operate="{ row }">
          <ElLink class="mr-2" type="primary" @click="detail(row.id)">
            详情
          </ElLink>
        </template>
      </Grid>
    </div>

    <PlanDetailModal />
  </Page>
</template>
