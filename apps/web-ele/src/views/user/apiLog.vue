<script lang="ts" setup>
import type { VxeGridProps } from '#/adapter/vxe-table';

import { Page } from '@vben/common-ui';

import { ElLink } from 'element-plus';
import moment from 'moment';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { OpenLogListApi } from '#/api/core/out';

interface RowType {
  // 调用序列
  id?: number;
  // 应用id
  appid?: string;
  // 已返回代码
  codeRes?: string;
  // 请求时间
  created?: string;
  // 已返回消息
  messageRes?: string;
  // 请求类型
  methodType?: string;
  // aes key
  orderNo?: string;
  // pdf下载地址
  pdfUrl?: string;
  // 方案编号
  planId?: string;
  // 签名key
  policyNo?: string;
  // 产品编号
  productId?: string;
  // 投保状态 1投保成功 2调用成功保险公司返回错误 3接口调用错误
  status?: number;
  // 请求时间戳
  tms?: string;
  // 渠道账户id
  uid?: string;
  // 更新时间
  updated?: string;
  // 渠道账户
  username?: string;
  // uuid
  uuid?: string;
}

const gridOptions: VxeGridProps<RowType> = {
  columns: [
    { field: 'id', title: 'API调用序号', width: 150 },
    { field: 'username', title: '渠道账号名', width: 150 },
    { field: 'appid', title: '应用ID（渠道编号）', minWidth: 200 },
    {
      field: 'created',
      title: '请求时间',
      minWidth: 160,
      formatter: ({ row }) =>
        row.created ? moment(row.created).format('YYYY-MM-DD HH:mm:ss') : '',
    },
    { field: 'methodType', title: '请求类型', minWidth: 200 },
    // { field: 'codeRes', title: '报文详情', minWidth: 300 },
    { field: 'tms', title: '时间戳', minWidth: 150 },
    { field: 'codeRes', title: '已返回代码', minWidth: 120 },
    { field: 'messageRes', title: '已返回信息', minWidth: 300 },
    {
      field: 'state',
      title: '传输状态',
      minWidth: 150,
      formatter: ({ row }) => {
        if (row.status === 1) {
          return '投保成功';
        }
        if (row.status === 2) {
          return '调用成功保险公司返回错误';
        }
        return '接口调用错误';
      },
    },
    {
      field: 'operation',
      title: '操作栏',
      width: 150,
      slots: { default: 'operation' },
    },
  ],
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
        return await OpenLogListApi({
          page: page.currentPage,
          size: page.pageSize,
        });
      },
    },
  },
};

const [Grid] = useVbenVxeGrid({ gridOptions });
</script>

<template>
  <Page title="API调用记录">
    <div class="vp-raw w-full">
      <Grid>
        <template #operation>
          <ElLink type="primary" size="small"> 关联订单 </ElLink>
          <ElLink type="primary" size="small"> 关联保单 </ElLink>
        </template>
      </Grid>
    </div>
  </Page>
</template>
