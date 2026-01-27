<script lang="ts" setup>
import type { VxeGridProps } from '#/adapter/vxe-table';

import { Page } from '@vben/common-ui';

import { ElTag } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';

interface RowType {
  id: number;
  roleName: string;
  roleDesc: string;
  state: number;
}

const gridOptions: VxeGridProps<RowType> = {
  columns: [
    { field: 'id', title: 'ID.', width: 50 },
    { field: 'roleName', title: '权限名称', width: 150 },
    { field: 'roleDesc', title: '权限说明', maxWidth: 300 },
    {
      field: 'state',
      title: '状态',
      width: 100,
      slots: { default: 'status' },
    },
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
    {
      id: 5,
      roleName: '业务客户',
      roleDesc: '创建订单、自有订单管理',
      state: 1,
    },
    {
      id: 6,
      roleName: '理赔管理员',
      roleDesc: '创建案件、定损、保司对接、理赔骑手对接、配置理赔系统',
      state: 1,
    },
    {
      id: 7,
      roleName: '理赔客服',
      roleDesc: '创建案件、自有案件理赔骑手对接',
      state: 1,
    },
    {
      id: 8,
      roleName: '定损员',
      roleDesc: '创建案件、定损、理赔骑手对接',
      state: 1,
    },
    {
      id: 9,
      roleName: '初审及保司对接员',
      roleDesc: '创建案件、定损、保司对接理赔骑手对接',
      state: 1,
    },
  ],
};

const [Grid] = useVbenVxeGrid({ gridOptions } as any);
</script>

<template>
  <Page title="权限管理">
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
