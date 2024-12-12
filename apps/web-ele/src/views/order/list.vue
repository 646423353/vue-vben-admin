<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';

import { onActivated } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import { ElAvatar, ElButton, ElLink } from 'element-plus';
import moment from 'moment';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { OrderListApi } from '#/api/core/order';
import { useOrderStore } from '#/store/order';

interface OrderType {
  id: number;
  consignTime: string;
  customer: string;
  emailAdd: string;
  emailMain: string;
  endTime: string;
  locationtype: string;
  lzxtype: string;
  orderId: string;
  orderSn: string;
  period: number;
  remark: string;
  safetype: string;
  shippingCode: string;
  shippingCodeAdd: string;
  ywxtype: string;
  createTime: string;
  updateTime: string;
}

const router = useRouter();

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
    { field: 'orderId', title: '订单号', width: 290 },
    { field: 'customerName', title: '所属公司', minWidth: 160 },
    { field: 'orderSn', title: '订单别名', minWidth: 120 },
    { field: 'locationtype', title: '保险编码', minWidth: 150 },
    {
      field: 'consignTime',
      title: '起保日期',
      formatter: ({ row }) =>
        row.consignTime ? moment(row.consignTime).format('YYYY-MM-DD') : '',
      minWidth: 100,
    },
    {
      field: 'endTime',
      title: '终保日期',
      formatter: ({ row }) =>
        row.endTime ? moment(row.endTime).format('YYYY-MM-DD') : '',
      minWidth: 100,
    },
    { field: 'mainInsure', title: '主险方案', minWidth: 120 },
    { field: 'addiInsure', title: '附加险方案', minWidth: 120 },
    {
      field: 'createTime',
      showOverflow: true,
      title: '创建时间',
      formatter: ({ row }) =>
        row.createTime
          ? moment(row.createTime).format('YYYY-MM-DD HH:mm:ss')
          : '',
      minWidth: 140,
    },
    {
      field: 'updateTime',
      showOverflow: true,
      title: '修改时间',
      formatter: ({ row }) =>
        row.updateTime
          ? moment(row.updateTime).format('YYYY-MM-DD HH:mm:ss')
          : '',
      minWidth: 140,
    },
    {
      title: '操作',
      fixed: 'right',
      width: 100,
      slots: { default: 'operate' },
      showOverflow: true,
    },
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
        return await OrderListApi(
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

const store = useOrderStore();

const [Grid, gridApi] = useVbenVxeGrid({ formOptions, gridOptions });

const detail = (id: number) => {
  router.push(`/order/detail?id=${id}`);
};

const goCreate = () => {
  router.push('/order/edit');
};

const editCustomer = (id: number) => {
  router.push(`/order/edit?id=${id}`);
};

// const delCustomer = (id: number) => {
//   ElMessageBox.confirm('确定要删除这条主险方案吗？', '重要提示', {
//     confirmButtonText: '确定',
//     cancelButtonText: '取消',
//     type: 'warning',
//   }).then(async () => {
//     await CustomerDelApi(id);
//     gridApi.reload();
//     ElMessage.success('删除成功');
//   });
// };
onActivated(() => {
  if (store.isUpdated) {
    gridApi.query();
    store.changeOrderStatus(false);
  }
});
</script>

<template>
  <Page title="订单列表">
    <template #extra>
      <ElButton type="primary" @click="goCreate">新建</ElButton>
    </template>
    <div class="vp-raw w-full">
      <Grid>
        <template #avatar="{ row }">
          <div class="flex w-full items-center justify-center pb-2 pt-2">
            <ElAvatar :src="row.avatar" />
          </div>
        </template>

        <template #operate="{ row }">
          <ElLink class="mr-2" type="primary" @click="detail(row.id)">
            详情
          </ElLink>
          <ElLink class="mr-2" type="primary" @click="editCustomer(row.id)">
            编辑
          </ElLink>
          <!-- <ElLink class="mr-2" type="primary" @click="delCustomer(row.id)">
            删除
          </ElLink> -->
        </template>
      </Grid>
    </div>
  </Page>
</template>
