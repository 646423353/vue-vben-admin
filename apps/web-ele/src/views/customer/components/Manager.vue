<script lang="ts" setup>
import type { VxeGridProps } from '#/adapter/vxe-table';

import { onMounted } from 'vue';

import { ElAvatar, ElTag } from 'element-plus';
import moment from 'moment';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { CustomerAccountsApi } from '#/api/core/customer';

export interface ManagerParams {
  id: number;
  file: string;
  roleNames: string;
  username: string;
  state: number;
  description: string;
  lasttime: string;
}

interface Props {
  customerId: string;
}

const props = defineProps<Props>();

const gridOptions: VxeGridProps<ManagerParams> = {
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
  ],
  pagerConfig: {
    enabled: false,
  },
  data: [],
  cellConfig: {
    height: 56,
  },
  showOverflow: true,
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

const getManagerList = async () => {
  const { list } = await CustomerAccountsApi(
    1,
    2000,
    props.customerId as string,
  );

  const $grid = gridApi.grid;
  await $grid.insert(list);
};

onMounted(() => {
  setTimeout(async () => {
    if (props.customerId) {
      getManagerList();
    }
  }, 500);
});
</script>

<template>
  <div>
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
    </Grid>
  </div>
</template>
