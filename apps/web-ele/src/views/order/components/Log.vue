<script lang="ts" setup>
import type { VxeGridProps } from '#/adapter/vxe-table';

import { ElCard, ElText } from 'element-plus';
import moment from 'moment';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { OrderMembersLogApi } from '#/api/core/order';

interface OrderType {
  id: number;
  beginTime: string;
  bxbm: string;
  creditcard: string;
  customerId: string;
  endTime: string;
  lzxtype: string;
  orderId: string;
  safetype: string;
  userid: number;
  username: string;
  ywxtype: string;
  mainInsure: string;
  addiInsure: string;
  comment: string;
  comment2: string;
  statusPerson: number;
  updated: string;
  created: string;
  nicknameUpdate: string;
  nickname: string;
  operatetag: number;
  isfirst: number;
}

interface Props {
  orderId?: string;
}

const props = defineProps<Props>();

const gridOptions: VxeGridProps<OrderType> = {
  columns: [
    { field: 'orderNo', title: '订单号', width: 160 },
    { field: 'customerName', title: '所属公司', minWidth: 160 },
    { field: 'bxbm', title: '保险编码', minWidth: 150 },
    {
      title: '类型',
      minWidth: 140,
      formatter: ({ row }) =>
        row.isfirst
          ? '首保'
          : row.operatetag === 1
            ? '增员'
            : row.operatetag === 2
              ? '减员'
              : row.operatetag === 3
                ? '取消增员'
                : row.operatetag === 4
                  ? '取消减员'
                  : '重新增员',
    },
    { field: 'mainInsure', title: '主险方案', minWidth: 150 },
    { field: 'addiInsure', title: '附加险方案', minWidth: 150 },
    { field: 'username', title: '姓名', minWidth: 100 },
    { field: 'creditcard', title: '身份证', minWidth: 150 },
    // {
    //   title: '人员状态',
    //   minWidth: 140,
    //   slots: { default: 'status' },
    // },
    {
      field: 'beginTime',
      title: '起保日期',
      minWidth: 120,
      formatter: ({ row }) =>
        row.beginTime && row.statusPerson !== 5
          ? moment(row.beginTime).format('YYYY-MM-DD')
          : '',
    },
    {
      field: 'endTime',
      title: '终保日期',
      minWidth: 120,
      formatter: ({ row }) =>
        row.endTime && row.statusPerson !== 5
          ? moment(row.endTime).format('YYYY-MM-DD')
          : '',
    },
    {
      title: '在保天数',
      minWidth: 120,
      formatter: ({ row }) =>
        row.endTime && row.beginTime && row.statusPerson !== 5
          ? moment(row.endTime).diff(moment(row.beginTime), 'days') + 1
          : '',
    },
    {
      field: 'comment',
      showOverflow: true,
      title: '备注1',
      minWidth: 200,
    },
    {
      field: 'comment2',
      showOverflow: true,
      title: '备注2',
      minWidth: 200,
    },
    {
      title: '操作人',
      fixed: 'right',
      field: 'nickname',
      width: 140,
      formatter: ({ row }) => row.nicknameUpdate || row.nickname,
    },
    {
      title: '操作时间',
      fixed: 'right',
      field: 'created',
      width: 140,
      formatter: ({ row }) =>
        row.updated
          ? moment(row.updated).format('YYYY-MM-DD HH:mm:ss')
          : moment(row.created).format('YYYY-MM-DD HH:mm:ss'),
    },
  ],
  validConfig: {
    msgMode: 'full',
  },
  pagerConfig: {
    enabled: props.orderId !== undefined,
    pageSize: 10,
    pageSizes: [10, 20, 30, 50],
  },
  data: [],
  showOverflow: true,
  height: 500,
  proxyConfig: {
    response: {
      result: 'list',
      total: 'total',
      list: 'list',
    },
    ajax: {
      query: async ({ page }) => {
        const { list, total } = await OrderMembersLogApi(
          {
            orderId: props.orderId,
          },
          {
            page: page.currentPage,
            size: page.pageSize,
          },
        );
        return {
          list,
          total,
        };
      },
    },
  },
};

const [Grid] = useVbenVxeGrid({ gridOptions });
</script>

<template>
  <ElCard class="mb-4">
    <template #header>
      <div>增减员记录</div>
    </template>

    <Grid>
      <template #status="{ row }">
        <ElText v-if="row.statusPerson === 1" type="primary">
          等待增员生效
        </ElText>
        <ElText v-else-if="row.statusPerson === 2" type="success">
          在保
        </ElText>
        <ElText v-else-if="row.statusPerson === 3" type="warning">
          在保 等待减员生效
        </ElText>
        <ElText v-else-if="row.statusPerson === 4" type="danger">
          不在保
        </ElText>
        <ElText v-else-if="row.statusPerson === 5" type="danger">
          不在保 起保前删除
        </ElText>
        <ElText v-else type="success">已增员</ElText>
      </template>
    </Grid>
  </ElCard>
</template>

<style scoped>
:deep(.relative.rounded) {
  padding: 0;
}

:deep(.bg-background-deep) {
  display: none;
}
</style>
