<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';

import { onActivated } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import {
  ElAvatar,
  ElButton,
  ElLink,
  ElMessage,
  ElMessageBox,
} from 'element-plus';
import moment from 'moment';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { CustomerDelApi, CustomerListApi } from '#/api/core/customer';
import { useCustomerStore } from '#/store/customer';

interface CustomerType {
  id: number;
  carda: string;
  cardb: string;
  mail: string;
  pdf: string;
  systemnum: string;
  ticket: string;
  username: string;
  zhizao: string;
  created: string;
}

const router = useRouter();

const formOptions: VbenFormProps = {
  schema: [
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入公司名称',
        allowClear: true,
      },
      fieldName: 'username',
      label: '公司名称',
    },
    {
      component: 'DatePicker',
      fieldName: 'rangerDate',
      label: '创建时间',
      componentProps: {
        allowClear: true,
        type: 'daterange',
        clearable: true,
        rangeSeparator: '至',
        startPlaceholder: '开始日期',
        endPlaceholder: '结束日期',
        valueFormat: 'YYYY-MM-DD',
      },
      formItemClass: 'col-span-2',
    },
  ],
  showCollapseButton: false,
  submitButtonOptions: {
    content: '查询',
  },
  submitOnEnter: false,
};

const gridOptions: VxeGridProps<CustomerType> = {
  columns: [
    { field: 'id', title: 'ID.', width: 50 },
    { field: 'username', title: '公司名称' },
    { field: 'systemnum', title: '统一信用代码' },
    { field: 'nicknameUpdate', showOverflow: true, title: '最后操作人' },
    {
      field: 'created',
      showOverflow: true,
      title: '创建时间',
      formatter: ({ row }) =>
        row.created ? moment(row.created).format('YYYY-MM-DD HH:mm:ss') : '',
      width: 140,
    },
    {
      title: '操作',
      fixed: 'right',
      width: 140,
      slots: { default: 'operate' },
      showOverflow: true,
    },
  ],
  minHeight: 800,
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
        return await CustomerListApi(
          {
            ...formValues,
          },
          {
            page: page.currentPage,
            size: page.pageSize,
            beginTime: new Date(formValues.rangerDate?.[0]).getTime() || '',
            endTime: new Date(formValues.rangerDate?.[1]).getTime() || '',
          },
        );
      },
    },
  },
};

const store = useCustomerStore();

const [Grid, gridApi] = useVbenVxeGrid({ formOptions, gridOptions });

const detail = (id: number) => {
  router.push(`/customer/detail?id=${id}`);
};

const goCreate = () => {
  router.push('/customer/edit');
};

const editCustomer = (id: number) => {
  router.push(`/customer/edit?id=${id}`);
};

const delCustomer = (id: number) => {
  ElMessageBox.confirm('确定要删除这条主险方案吗？', '重要提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    await CustomerDelApi(id);
    gridApi.reload();
    ElMessage.success('删除成功');
  });
};

onActivated(() => {
  if (store.isUpdated) {
    gridApi.query();
    store.changeCustomerStatus(false);
  }
});
</script>

<template>
  <Page title="客户列表">
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
          <ElLink class="mr-2" type="primary" @click="delCustomer(row.id)">
            删除
          </ElLink>
        </template>
      </Grid>
    </div>
  </Page>
</template>
