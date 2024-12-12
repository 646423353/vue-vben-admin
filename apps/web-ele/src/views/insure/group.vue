<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';

import { Page, useVbenModal } from '@vben/common-ui';

import { ElButton, ElLink, ElMessage, ElMessageBox, ElTag } from 'element-plus';
import moment from 'moment';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { GroupDelApi, GroupListApi } from '#/api/core/group';
import { InsureListApi } from '#/api/core/insure';

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

const shortcuts = [
  {
    text: '最近一周',
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 7);
      return [start, end];
    },
  },
  {
    text: '最近一个月',
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 30);
      return [start, end];
    },
  },
  {
    text: '最近三个月',
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 90);
      return [start, end];
    },
  },
];

const formOptions: VbenFormProps = {
  schema: [
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入保险编码',
        allowClear: true,
      },
      fieldName: 'insureSn',
      label: '保险编码',
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入组合名称',
        allowClear: true,
      },
      fieldName: 'groupName',
      label: '组合名称',
    },
    {
      component: 'ApiSelect',
      fieldName: 'mainInsureId',
      label: '主险方案',
      componentProps: {
        clearable: true,
        placeholder: '请选择',
        api: async () => await getInsureList(1),
      },
    },
    {
      component: 'ApiSelect',
      fieldName: 'additionalInsureId',
      label: '附加险方案',
      componentProps: {
        clearable: true,
        placeholder: '请选择',
        api: async () => await getInsureList(2),
      },
    },
    {
      component: 'Select',
      fieldName: 'status',
      label: '状态',
      componentProps: {
        clearable: true,
        placeholder: '请选择',
        options: [
          {
            key: 1,
            label: '可用',
            value: 1,
          },
          {
            key: 0,
            label: '不可用',
            value: 0,
          },
        ],
      },
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
        shortcuts,
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
        return await GroupListApi(formValues, {
          page: page.currentPage,
          size: page.pageSize,
          beginTime: formValues.rangerDate?.[0]
            ? moment(formValues.rangerDate?.[0]).valueOf()
            : '',
          endTime: formValues.rangerDate?.[1]
            ? moment(formValues.rangerDate?.[1]).valueOf()
            : '',
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

async function getInsureList(cate: number) {
  const { list } = await InsureListApi(
    {
      cate,
    },
    {
      page: 1,
      size: 2000,
    },
  );
  return list.map((item) => ({
    label: item.ordertype,
    value: item.id,
  }));
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
          <ElTag v-if="row.status === 1" effect="dark" type="success">
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
