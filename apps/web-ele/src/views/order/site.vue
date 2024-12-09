<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';

import { Page, useVbenModal } from '@vben/common-ui';

import { ElLink, ElMessage, ElMessageBox, ElTag } from 'element-plus';
import moment from 'moment';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { StopDelApi, StopListApi } from '#/api/core/stop';

import siteDetailModal from './components/SiteDetailModal.vue';

interface SiteType {
  id: number;
  customerName: string;
  name: string;
  owner: string;
  phone: string;
  province: string | undefined;
  city: string | undefined;
  district: string | undefined;
  addr: string;
  address: string;
  status: number;
  createdAt: string;
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

const gridOptions: VxeGridProps<SiteType> = {
  columns: [
    { field: 'id', title: 'ID.', width: 50 },
    { field: 'customerName', title: '客户名称', minWidth: 120 },
    { field: 'name', title: '站点名称', minWidth: 120 },
    {
      field: 'addr',
      title: '所在地区',
      formatter: ({ row }) =>
        row.addr ? `${row.province} / ${row.city} / ${row.district}` : '',
      minWidth: 180,
    },
    { field: 'address', title: '详细地址', minWidth: 240 },
    { field: 'owner', title: '站长姓名', minWidth: 120 },
    { field: 'phone', title: '站长电话', minWidth: 120 },
    {
      field: 'status',
      showOverflow: true,
      title: '状态',
      width: 100,
      slots: { default: 'status' },
    },
    {
      field: 'updateUser',
      showOverflow: true,
      title: '最后操作人',
      minWidth: 120,
    },
    {
      field: 'createdAt',
      showOverflow: true,
      title: '创建时间',
      minWidth: 120,
      formatter: ({ row }) =>
        row.createdAt
          ? moment(row.createdAt).format('YYYY-MM-DD HH:mm:ss')
          : '',
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
        return await StopListApi(
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

const [Grid, gridApi] = useVbenVxeGrid({ formOptions, gridOptions });

const [SiteDetailModal, SiteDetailModalApi] = useVbenModal({
  connectedComponent: siteDetailModal,
  closeOnClickModal: false,
  draggable: true,
});

const detail = (id: number) => {
  SiteDetailModalApi.setData({ id });
  SiteDetailModalApi.open();
};

const delStop = (id: number) => {
  ElMessageBox.confirm('确定要删除此客户站点吗？', '重要提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    await StopDelApi(id);
    gridApi.reload();
    ElMessage.success('删除成功');
  });
};
</script>

<template>
  <Page title="客户站点">
    <div class="vp-raw w-full">
      <Grid>
        <template #status="{ row }">
          <ElTag v-if="row.status === 1" effect="dark" type="success">
            可用
          </ElTag>
          <ElTag v-else effect="dark" type="danger">不可用</ElTag>
        </template>

        <template #operate="{ row }">
          <ElLink class="mr-2" type="primary" @click="detail(row.id)">
            详情
          </ElLink>
          <ElLink class="mr-2" type="primary" @click="delStop(row.id)">
            删除
          </ElLink>
        </template>
      </Grid>
    </div>

    <SiteDetailModal />
  </Page>
</template>
