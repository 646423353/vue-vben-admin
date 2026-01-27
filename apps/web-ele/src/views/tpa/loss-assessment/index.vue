<script lang="ts" setup>
import type { VxeGridProps } from '#/adapter/vxe-table';

import { Page, useVbenModal } from '@vben/common-ui';

import { ElButton, ElLink, ElMessage, ElMessageBox, ElTag } from 'element-plus';
import moment from 'moment';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { CaseSetApi } from '#/api/core/case-set';

import DetailTemplateModal from './components/DetailTemplateModal.vue';
import LossAssessmentEditModal from './components/LossAssessmentEditModal.vue';

interface RowVO {
  id: number;
  title: string;
  type: number; // 1: Cate, 2: Item
  comments?: string;
  created?: string;
  hasChild?: boolean;
  cateId?: number;
  moban?: string;
  status: number; // 1: Enabled, 0: Disabled
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
      field: 'status',
      title: '状态',
      width: 100,
      slots: { default: 'status' },
    },
    {
      field: 'moban',
      title: '详细测算模板',
      width: 200,
      slots: { default: 'moban' },
    },
    {
      fixed: 'right',
      slots: { default: 'operate' },
      title: '操作',
      width: 230,
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

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions } as any);

const [EditModal, EditModalApi] = useVbenModal({
  connectedComponent: LossAssessmentEditModal,
});

const [TemplateModal, TemplateModalApi] = useVbenModal({
  connectedComponent: DetailTemplateModal,
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
  ElMessageBox.confirm(`确定要停用"${row.title}"吗？`, '提示', {
    cancelButtonText: '取消',
    confirmButtonText: '确定',
    type: 'warning',
  }).then(async () => {
    await (row.type === 1
      ? CaseSetApi.delMoneyCate({ id: row.id })
      : CaseSetApi.delMoneyItem({ id: row.id }));
    gridApi.reload();
    ElMessage.success('停用成功');
  });
}

function handleEnable(row: RowVO) {
  ElMessageBox.confirm(`确定要启用"${row.title}"吗？`, '提示', {
    cancelButtonText: '取消',
    confirmButtonText: '确定',
    type: 'success',
  }).then(async () => {
    await (row.type === 1
      ? CaseSetApi.updateMoneyCate({ id: row.id, status: 1 })
      : CaseSetApi.updateMoneyItem({ id: row.id, status: 1 }));
    gridApi.reload();
    ElMessage.success('启用成功');
  });
}

function openDetailTemplateModal(row: RowVO) {
  TemplateModalApi.setData({ row, isView: false });
  TemplateModalApi.open();
}

function openViewTemplateModal(row: RowVO) {
  TemplateModalApi.setData({ row, isView: true });
  TemplateModalApi.open();
}

function handleTemplateSuccess() {
  gridApi.reload();
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

        <template #status="{ row }">
          <ElTag v-if="row.status === 1" type="success">启用</ElTag>
          <ElTag v-else type="danger">停用</ElTag>
        </template>

        <template #moban="{ row }">
          <div v-if="row.moban" class="flex-center items-center">
            <span class="mr-2 max-w-[100px] truncate" :title="row.moban">
              模板说明
            </span>
            <ElButton link type="primary" @click="openViewTemplateModal(row)">
              查看
            </ElButton>
          </div>
          <span v-else class="text-gray-400">无</span>
        </template>

        <template #operate="{ row }">
          <ElLink class="mr-2" type="primary" @click="openEditModal(row)">
            编辑
          </ElLink>
          <ElLink
            v-if="row.status === 1"
            class="mr-2"
            type="danger"
            @click="handleDelete(row)"
          >
            停用
          </ElLink>
          <ElLink v-else class="mr-2" type="success" @click="handleEnable(row)">
            启用
          </ElLink>
          <ElLink
            v-if="row.type === 2"
            type="primary"
            @click="openDetailTemplateModal(row)"
          >
            {{ row.moban ? '重设详细测算模板' : '添加详细测算模板' }}
          </ElLink>
        </template>
      </Grid>
    </div>

    <EditModal @reload="handleReload" />
    <TemplateModal @success="handleTemplateSuccess" />
  </Page>
</template>
