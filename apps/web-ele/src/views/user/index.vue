<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';

import { watch } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';

import { useDebounceFn, useWindowSize } from '@vueuse/core';
import { ElAvatar, ElButton, ElLink, ElTag } from 'element-plus';
import moment from 'moment';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { authUserListApi } from '#/api/core/authuser';

import userDetailModal from './components/UserDetailModal.vue';
import userEditModal from './components/UserEditModal.vue';

interface RowType {
  id: number;
  file: string;
  roleNames: string;
  username: string;
  state: number;
  description: string;
  lasttime: string;
}

const formOptions: VbenFormProps = {
  schema: [
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入登陆名',
        allowClear: true,
      },
      fieldName: 'username',
      label: '登陆名',
    },
    {
      component: 'Select',
      componentProps: {
        clearable: true,
        options: [
          {
            key: 13,
            label: '管理员',
            value: 13,
          },
          {
            key: 14,
            label: '业务主管',
            value: 14,
          },
          {
            key: 15,
            label: '业务操作员',
            value: 15,
          },
          {
            key: 16,
            label: '业务客户',
            value: 16,
          },
        ],
        placeholder: '请选择',
      },
      fieldName: 'roleId',
      label: '权限',
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
        ],
        placeholder: '请选择',
      },
      fieldName: 'status',
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
    { field: 'username', title: '登陆名' },
    { field: 'description', title: '昵称' },
    {
      field: 'state',
      title: '状态',
      width: 100,
      slots: { default: 'status' },
    },
    {
      field: 'roleNames',
      title: '当前权限',
      formatter: ({ row }) => row.roleNames || '业务客户',
    },
    {
      field: 'lasttime',
      title: '最后活跃时间',
      formatter: ({ row }) =>
        row.lasttime ? moment(row.lasttime).format('YYYY-MM-DD HH:mm:ss') : '',
    },
    {
      title: '操作',
      fixed: 'right',
      width: 100,
      slots: { default: 'operate' },
    },
  ],
  rowConfig: {
    height: 56,
  },
  minHeight: 500,
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
  showOverflow: true,
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

const { height } = useWindowSize();

const resizeHandler: () => void = useDebounceFn(resize, 200);
watch([height], () => {
  resizeHandler?.();
});

function resize() {
  gridApi.setGridOptions({
    maxHeight: height.value - 210,
  });
}
resize();

const [UserDetailModal, UserDetailModalApi] = useVbenModal({
  connectedComponent: userDetailModal,
  closeOnClickModal: false,
  draggable: true,
});

const detail = (id: number) => {
  UserDetailModalApi.setData({ id });
  UserDetailModalApi.open();
};

const [UserEditModal, UserEditModalApi] = useVbenModal({
  connectedComponent: userEditModal,
  closeOnClickModal: false,
  draggable: true,
});

const editInsure = (id: number) => {
  UserEditModalApi.setData({ id });
  UserEditModalApi.open();
};

function openModal() {
  UserEditModalApi.setData({ id: '' });
  UserEditModalApi.open();
}

const handleReloadList = () => {
  gridApi.query();
};
</script>

<template>
  <Page title="账户列表">
    <template #extra>
      <ElButton type="primary" @click="openModal">新建</ElButton>
    </template>

    <div class="vp-raw w-full">
      <Grid>
        <template #avatar="{ row }">
          <div class="flex w-full items-center justify-center pb-2 pt-2">
            <ElAvatar v-if="row.file" :src="row.file" />
            <ElAvatar v-else>
              {{ row.username.charAt(0).toUpperCase() }}
            </ElAvatar>
          </div>
        </template>

        <template #status="{ row }">
          <ElTag v-if="row.state === 1" effect="dark" type="success">
            启用
          </ElTag>
          <ElTag v-else effect="dark" type="danger">禁用</ElTag>
        </template>

        <template #operate="{ row }">
          <ElLink class="mr-2" type="primary" @click="detail(row.id)">
            详情
          </ElLink>
          <ElLink type="primary" @click="editInsure(row.id)"> 编辑 </ElLink>
        </template>
      </Grid>
    </div>

    <UserEditModal @reload-list="handleReloadList" />
    <UserDetailModal />
  </Page>
</template>
