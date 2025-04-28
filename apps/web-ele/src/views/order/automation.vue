<script lang="ts" setup>
import type { VxeGridProps } from '#/adapter/vxe-table';

import { alert, confirm, Page } from '@vben/common-ui';

import { ElButton, ElTag } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';

interface RowType {
  id: number;
  roleName: string;
  roleDesc: string;
  state: number;
}

const gridOptions: VxeGridProps<RowType> = {
  columns: [
    { field: 'id', title: '操作编号', minWidth: 50 },
    { field: 'roleName1', title: '投保人', minWidth: 150 },
    { field: 'roleName2', title: '人数', minWidth: 150 },
    {
      field: 'beginTime',
      title: '操作时间',
      minWidth: 120,
      // formatter: ({ row }) =>
      //   row.beginTime && row.statusPerson !== 5
      //     ? moment(row.beginTime).format('YYYY-MM-DD')
      //     : '',
    },
    {
      field: 'state',
      title: '状态',
      minWidth: 100,
      slots: { default: 'status' },
    },
    { field: 'roleName3', title: '反馈', minWidth: 150 },
    { field: 'roleName4', title: '下载名单', minWidth: 150 },
  ],
  rowConfig: {
    height: 56,
  },
  pagerConfig: {
    enabled: false,
  },
  sortConfig: {
    multiple: true,
  },
  stripe: true,
  border: true,
  showOverflow: true,
  data: [
    {
      id: 1,
      roleName: '管理员',
      roleDesc: '订单管理、客户管理、保障组合管理、账号管理，全客户管理',
      state: 1,
    },
    {
      id: 2,
      roleName: '业务主管',
      roleDesc: '订单管理、客户管理、全客户管理',
      state: 1,
    },
    {
      id: 3,
      roleName: '业务操作员',
      roleDesc: '订单管理（自建）、账号绑定的客户范围管理',
      state: 1,
    },
    {
      id: 4,
      roleName: '业务管理员',
      roleDesc: '订单管理、账号绑定的客户范围管理',
      state: 1,
    },
  ],
};

const [Grid] = useVbenVxeGrid({ gridOptions });

const taskAdd = async () => {
  confirm('This is an alert message')
    .then(() => {
      alert('Confirmed');
    })
    .catch(() => {
      alert('Canceled');
    });

  // const res = await TaskAddApi();
  // console.log(res);
};
</script>

<template>
  <Page title="自动投保">
    <ElButton type="primary" class="mb-2" size="large" @click="taskAdd">
      开始今日投保
    </ElButton>
    <div class="vp-raw w-full">
      <Grid>
        <template #status="{ row }">
          <ElTag v-if="row.state === 1" effect="dark" type="success">
            可用
          </ElTag>
          <ElTag v-else effect="dark" type="danger">不可用</ElTag>
        </template>
      </Grid>
    </div>
  </Page>
</template>
