<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';

import { Page } from '@vben/common-ui';

import { ElAvatar, ElLink, ElMessage } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { authUserListApi } from '#/api/core/authuser';

interface RowType {
  id: number;
  file: string;
  roleNames: string;
  username: string;
  state: number;
  age: number;
  ordertype: string;
  nickname: string;
  role: string;
}

const formOptions: VbenFormProps = {
  schema: [
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入登陆名',
        allowClear: true,
      },
      fieldName: 'keyword',
      label: '登陆名',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        filterOption: true,
        options: [
          {
            label: '选项1',
            value: '1',
          },
          {
            label: '选项2',
            value: '2',
          },
        ],
        placeholder: '请选择',
        showSearch: true,
      },
      fieldName: 'options',
      label: '下拉选',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [
          {
            label: '启用',
            value: 1,
          },
          {
            label: '禁用',
            value: 2,
          },
          {
            label: '删除',
            value: 0,
          },
        ],
        placeholder: '请选择',
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

const gridOptions: VxeGridProps<RowType> = {
  columns: [
    { field: 'id', title: 'ID.', width: 50 },
    {
      field: 'file',
      slots: { default: 'avatar' },
      title: '头像',
      width: 100,
    },
    { field: 'roleNames', title: '职位' },
    { field: 'username', title: '登陆名' },
    { field: 'nick_name', title: '昵称' },
    {
      field: 'state',
      showOverflow: true,
      title: '状态',
      width: 100,
      formatter: ({ row }) =>
        `${row.state === 1 ? '启用' : row.state === 2 ? '禁用' : '删除'}`,
    },
    { field: 'power_id', showOverflow: true, title: '当前权限' },
    { field: 'type', showOverflow: true, title: '类型' },
    { field: 'last_login_at', showOverflow: true, title: '最后活跃时间' },
    {
      title: '操作',
      fixed: 'right',
      width: 140,
      slots: { default: 'operate' },
      showOverflow: true,
    },
  ],
  rowConfig: {
    height: 56,
  },
  minHeight: 400,
  pagerConfig: {
    enabled: true,
    pageSize: 10,
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
        return await authUserListApi({
          organid: 0,
          page: page.currentPage,
          size: page.pageSize,
          ...formValues,
        });
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ formOptions, gridOptions });

const showStripe = gridApi.useStore((state) => state.gridOptions?.stripe);

const detail = (row: RowType) => {
  ElMessage.info(`detail: ${row.username}`);
};

function changeStripe() {
  gridApi.setGridOptions({
    stripe: !showStripe.value,
  });
}

function changeLoading() {
  gridApi.setLoading(true);
  setTimeout(() => {
    gridApi.setLoading(false);
  }, 2000);
}
</script>

<template>
  <Page title="保险产品管理">
    <div class="vp-raw w-full">
      <Grid>
        <template #avatar="{ row }">
          <div class="flex w-full items-center justify-center pb-2 pt-2">
            <ElAvatar :src="row.avatar" />
          </div>
        </template>

        <template #operate="{ row }">
          <ElLink class="mr-2" type="primary" @click="detail(row)">
            详情
          </ElLink>
          <ElLink
            class="mr-2"
            href="mailto:test@163.com"
            type="primary"
            @click="changeLoading"
          >
            编辑
          </ElLink>
          <ElLink class="mr-2" type="primary" @click="changeStripe">
            删除
          </ElLink>
        </template>
      </Grid>
    </div>
  </Page>
</template>
