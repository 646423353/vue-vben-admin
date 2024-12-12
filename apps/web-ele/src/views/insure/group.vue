<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';

import { Page, useVbenModal } from '@vben/common-ui';

import { ElButton, ElLink, ElMessage, ElMessageBox, ElTag } from 'element-plus';
import moment from 'moment';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { GroupDelApi, GroupListApi } from '#/api/core/group';

import groupDetailModal from './components/GroupDetailModal.vue';
import groupEditModal from './components/GroupEditModal.vue';

interface RowType {
  id: number;
  insureSn: string;
  groupName: string;
  mainInsure: string;
  additionalInsure: string;
  status: number;
  createdAt: string;
  updateUser: string;
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

const gridOptions: VxeGridProps<RowType> = {
  columns: [
    { field: 'id', title: 'ID.', width: 50 },
    { field: 'insureSn', title: '保险编码' },
    { field: 'groupName', title: '组合名称' },
    { field: 'mainInsure', title: '主险方案' },
    { field: 'additionalInsure', title: '附加险方案' },
    {
      field: 'status',
      showOverflow: true,
      title: '状态',
      width: 100,
      slots: { default: 'status' },
    },
    { field: 'updateUser', showOverflow: true, title: '最后操作人' },
    {
      field: 'createdAt',
      showOverflow: true,
      title: '创建时间',
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
        return await GroupListApi(formValues, {
          page: page.currentPage,
          size: page.pageSize,
        });
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ formOptions, gridOptions });

const [GroupEditModal, GroupEditModalApi] = useVbenModal({
  connectedComponent: groupEditModal,
  closeOnClickModal: false,
  draggable: true,
});

const editInsure = (id: number) => {
  GroupEditModalApi.setData({ id });
  GroupEditModalApi.open();
};

const [GroupDetailModal, GroupDetailModalApi] = useVbenModal({
  connectedComponent: groupDetailModal,
  closeOnClickModal: false,
  draggable: true,
});

const detail = (id: number) => {
  GroupDetailModalApi.setData({ id });
  GroupDetailModalApi.open();
};

const delInsure = (id: number) => {
  ElMessageBox.confirm('确定要删除这条保障方案组合吗？', '重要提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    await GroupDelApi(id);
    gridApi.reload();
    ElMessage.success('删除成功');
  });
};

function openModal() {
  GroupEditModalApi.setData({ id: '' });
  GroupEditModalApi.open();
}

const handleReloadList = () => {
  gridApi.query();
};
</script>

<template>
  <Page title="保障方案组合">
    <template #extra>
      <ElButton type="primary" @click="openModal">新建</ElButton>
    </template>
    <div class="vp-raw w-full">
      <Grid>
        <template #status="{ row }">
          <ElTag v-if="row.status === 1" effect="dark" type="primary">
            可用
          </ElTag>
          <ElTag v-else effect="dark" type="danger">不可用</ElTag>
        </template>

        <template #operate="{ row }">
          <ElLink class="mr-2" type="primary" @click="detail(row.id)">
            详情
          </ElLink>
          <ElLink class="mr-2" type="primary" @click="editInsure(row.id)">
            编辑
          </ElLink>
          <ElLink class="mr-2" type="primary" @click="delInsure(row.id)">
            删除
          </ElLink>
        </template>
      </Grid>
    </div>
    <GroupEditModal @reload-list="handleReloadList" />
    <GroupDetailModal />
  </Page>
</template>
