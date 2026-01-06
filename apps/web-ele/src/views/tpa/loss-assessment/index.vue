<script lang="ts" setup>
import type { VxeGridProps } from '#/adapter/vxe-table';

import { Page, useVbenModal } from '@vben/common-ui';

import { ElButton, ElLink, ElMessage, ElMessageBox, ElTag } from 'element-plus';
import moment from 'moment';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { CaseSetApi } from '#/api/core/case-set';

import LossAssessmentEditModal from './components/LossAssessmentEditModal.vue';

interface RowVO {
  id: number;
  title: string;
  type: number; // 1: Cate, 2: Item
  comments?: string;
  created?: string;
  hasChild?: boolean;
  cateId?: number;
}

const gridOptions: VxeGridProps<RowVO> = {
  columns: [
    { field: 'id', title: 'ID', width: 80 },
    {
      align: 'left',
      field: 'title',
      minWidth: 180,
      title: '名称',
      treeNode: true,
    },
    {
      slots: { default: 'type' },
      title: '类型',
      width: 100,
    },
    {
      field: 'comments',
      title: '备注',
      minWidth: 150,
    },
    {
      field: 'created',
      title: '创建时间',
      width: 180,
      slots: { default: 'created' },
    },
    {
      fixed: 'right',
      slots: { default: 'operate' },
      title: '操作',
      width: 150,
    },
  ],
  pagerConfig: {
    enabled: false,
  },
  proxyConfig: {
    ajax: {
      query: async () => {
        const res = await CaseSetApi.getMoneyCateList();
        // Transform to Grid Row
        const list = res.map((item) => ({
          ...item,
          type: 1,
          hasChild: true, // Cates might have children
        }));
        return { list, total: list.length };
      },
    },
    response: {
      list: 'list',
      total: 'total',
    },
  },
  treeConfig: {
    hasChild: 'hasChild',
    lazy: true,
    loadMethod: async ({ row }) => {
      if (row.type === 1) {
        const res = await CaseSetApi.getMoneyItems({ cateId: row.id });
        return res.map((item) => ({
          ...item,
          type: 2,
          hasChild: false,
        }));
      }
      return [];
    },
    parentField: 'cateId',
    rowField: 'id',
    transform: true,
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

const [EditModal, EditModalApi] = useVbenModal({
  connectedComponent: LossAssessmentEditModal,
});

function openAddModal() {
  EditModalApi.setData({ isEdit: false });
  EditModalApi.open();
}

function openEditModal(row: RowVO) {
  EditModalApi.setData({ isEdit: true, row });
  EditModalApi.open();
}

function handleDelete(row: RowVO) {
  ElMessageBox.confirm(`确定要删除“${row.title}”吗？`, '提示', {
    cancelButtonText: '取消',
    confirmButtonText: '确定',
    type: 'warning',
  }).then(async () => {
    await (row.type === 1
      ? CaseSetApi.delMoneyCate({ id: row.id })
      : CaseSetApi.delMoneyItem({ id: row.id }));
    gridApi.reload();
    ElMessage.success('删除成功');
  });
}

function handleReload() {
  gridApi.reload();
}
</script>

<template>
  <Page title="定损项目设置">
    <template #extra>
      <ElButton type="primary" @click="openAddModal">新增</ElButton>
    </template>

    <div class="h-full w-full">
      <Grid>
        <template #type="{ row }">
          <ElTag v-if="row.type === 1" type="primary">大类</ElTag>
          <ElTag v-else type="success">项目</ElTag>
        </template>

        <template #created="{ row }">
          {{
            row.created
              ? moment(Number(row.created)).format('YYYY-MM-DD HH:mm:ss')
              : '-'
          }}
        </template>

        <template #operate="{ row }">
          <ElLink class="mr-2" type="primary" @click="openEditModal(row)">
            编辑
          </ElLink>
          <ElLink type="danger" @click="handleDelete(row)">删除</ElLink>
        </template>
      </Grid>
    </div>

    <EditModal @reload="handleReload" />
  </Page>
</template>
