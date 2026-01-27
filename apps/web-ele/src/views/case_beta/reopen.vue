<script lang="ts" setup>
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { CaseApi } from '#/api/core/case';

import { watch } from 'vue';

import { Page } from '@vben/common-ui';

import { useDebounceFn, useWindowSize } from '@vueuse/core';
import moment from 'moment';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { CaseReopenLogApi } from '#/api/core/case';

interface LogEntry {
  caseId?: string; // 案件id，可选
  caseInfo?: CaseApi.CaseDetail; // 案件信息，可选，假设TbCaseWithBLOBs是已定义的类型
  content?: string; // 日志内容，可选
  created?: string; // 创建时间，可选
  id?: number; // 标识符，可选，注意这里使用number而不是integer
  photo?: string; // 照片，可选
  reason?: string; // 重开理由，可选
  reopenTag?: number; // 重开标记，1表示重开，0表示不属于重开，可选
  uid?: string; // 用户ID，可选
  username?: string; // 用户名，可选
}

const gridOptions: VxeGridProps<LogEntry> = {
  columns: [
    { field: 'caseId', title: '案件号', width: 120 },
    { field: 'caseInfo.name', title: '出险人', minWidth: 160 },
    {
      title: '出险时间',
      minWidth: 150,
      formatter: ({ row }) =>
        row.caseInfo?.insureTime
          ? moment(row.caseInfo?.insureTime).format('YYYY-MM-DD HH:mm:ss')
          : '',
    },
    { field: 'caseInfo.companyName', title: '所属公司', minWidth: 150 },
    { field: 'caseInfo.usernameOwner', title: '理赔人员', minWidth: 120 },
    { field: 'username', title: '重开人', minWidth: 120 },
    {
      title: '重开时间',
      minWidth: 150,
      formatter: ({ row }) =>
        row.created ? moment(row.created).format('YYYY-MM-DD HH:mm:ss') : '',
    },
    {
      field: 'reason',
      showOverflow: true,
      title: '重开原因',
      minWidth: 250,
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
  proxyConfig: {
    response: {
      result: 'list',
      total: 'total',
      list: 'list',
    },
    ajax: {
      query: async ({ page }) => {
        return await CaseReopenLogApi(page.currentPage, page.pageSize);
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
  if (height.value - 210 < 600) {
    gridApi.setGridOptions({
      height: height.value - 100,
      maxHeight: 0,
    });
  } else {
    gridApi.setGridOptions({
      height: 0,
      maxHeight: height.value - 210,
    });
  }
}
resize();
</script>

<template>
  <Page title="重开记录">
    <div class="vp-raw w-full">
      <Grid />
    </div>
  </Page>
</template>

<style scoped>
:deep(.el-date-editor--date) {
  width: 100%;
}
</style>
