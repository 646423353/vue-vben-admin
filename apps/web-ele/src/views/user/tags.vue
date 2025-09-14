<script lang="ts" setup>
import type { VxeGridProps } from '#/adapter/vxe-table';

import { watch } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';

import { useDebounceFn, useWindowSize } from '@vueuse/core';
import {
  ElAvatar,
  ElButton,
  ElLink,
  ElMessage,
  ElMessageBox,
  ElTag,
} from 'element-plus';
import moment from 'moment';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { TagDelApi, TagListApi } from '#/api/core/tags';

import tagEditModal from './components/TagEditModal.vue';

interface RowType {
  id: number;
  created: string;
  name: string;
  uid: string;
  uidUpdate: string;
  updated: string;
  username: string;
  usernameUpdate: string;
}

const gridOptions: VxeGridProps<RowType> = {
  columns: [
    { field: 'id', title: 'ID.', width: 50 },
    { field: 'name', title: '分组名称' },
    { field: 'username', title: '创建人' },
    { field: 'usernameUpdate', title: '更新人' },
    {
      field: 'created',
      title: '创建时间',
      formatter: ({ row }) =>
        row.created ? moment(row.created).format('YYYY-MM-DD HH:mm:ss') : '',
    },
    {
      field: 'updated',
      title: '更新时间',
      formatter: ({ row }) =>
        row.updated ? moment(row.updated).format('YYYY-MM-DD HH:mm:ss') : '',
    },
    {
      title: '操作',
      fixed: 'right',
      width: 100,
      slots: { default: 'operate' },
    },
  ],
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
      query: async ({ page }) => {
        return await TagListApi({
          page: page.currentPage,
          size: page.pageSize,
        });
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

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

const [TagEditModal, TagEditModalApi] = useVbenModal({
  connectedComponent: tagEditModal,
  closeOnClickModal: false,
  draggable: true,
});

const editTag = (id: number, name: string) => {
  TagEditModalApi.setData({ id, name });
  TagEditModalApi.open();
};

const delTag = (id: number) => {
  ElMessageBox.confirm('确定要删除此分组吗？', '重要提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    await TagDelApi(id);
    gridApi.reload();
    ElMessage.success('删除成功');
  });
};

function openModal() {
  TagEditModalApi.setData({ id: '' });
  TagEditModalApi.open();
}

const handleReloadList = () => {
  gridApi.query();
};
</script>

<template>
  <Page title="分组列表">
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
          <ElLink
            class="mr-2"
            type="primary"
            @click="editTag(row.id, row.name)"
          >
            编辑
          </ElLink>
          <ElLink type="primary" @click="delTag(row.id)"> 删除 </ElLink>
        </template>
      </Grid>
    </div>

    <TagEditModal @reload-list="handleReloadList" />
  </Page>
</template>
