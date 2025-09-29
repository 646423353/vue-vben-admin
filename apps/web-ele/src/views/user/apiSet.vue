<script lang="ts" setup>
import type { VxeGridProps } from '#/adapter/vxe-table';

import { Page } from '@vben/common-ui';

import { ElLink, ElMessageBox } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { OpenChannelListApi } from '#/api/core/out';

interface RowType {
  id: number;
  appid?: string; // 应用id
  appidAdmin?: string; // 对应的管理员账户
  created?: string;
  ips?: string; // 所有白名单地址
  planId?: string; // 方案编号
  price?: number; // 价格
  productId?: string; // 产品编号
  productIdAdmin?: string; // 对应的管理员产品
  title?: string; // 描述
  updated?: string;
  username?: string; // 渠道账户名
  channelAccountName?: string;
  channelId?: string;
  productCode?: string;
  productSchemeCode?: string;
  state?: number;
}

const gridOptions: VxeGridProps<RowType> = {
  columns: [
    { field: 'id', title: 'ID.', width: 50 },
    { field: 'username', title: '渠道账号名', width: 150 },
    { field: 'appid', title: '应用ID（渠道编号）', minWidth: 200 },
    { field: 'productId', title: '产品编码', minWidth: 300 },
    { field: 'planId', title: '产品方案编码', minWidth: 300 },
    {
      field: 'operation',
      title: '操作',
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
        return await OpenChannelListApi({
          page: page.currentPage,
          size: page.pageSize,
        });
      },
    },
  },
};

const [Grid] = useVbenVxeGrid({ gridOptions });

const showIps = (ips: string) => {
  ElMessageBox.alert(`白名单列表${ips}`)
    .then(() => {})
    .catch(() => {
      // catch error
    });
};
</script>

<template>
  <Page title="API渠道配置">
    <div class="vp-raw w-full">
      <Grid>
        <template #operation="{ row }">
          <ElLink type="primary" size="small" @click="showIps(row.ips)">
            查看白名单列表
          </ElLink>
        </template>
      </Grid>
    </div>
  </Page>
</template>
