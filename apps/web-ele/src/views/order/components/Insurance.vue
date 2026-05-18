<script lang="ts" setup>
import type { OrderForm } from '../operate/detail.vue';

import type { VxeGridProps } from '#/adapter/vxe-table';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { ElCard, ElLink, ElMessage, ElMessageBox, ElText } from 'element-plus';
import saveAs from 'file-saver';
import moment from 'moment';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { BuTouCheckApi, TaskPostListApi } from '#/api/core/task';
import { isPdfUrl } from '#/utils/formatPdfUrl';

import ErrorRetryModal from './ErrorRetryModal.vue';

export interface InsuranceParams {
  id?: string;
  username?: string;
  beginTime: string;
  endTime: string;
  created: string;
  status: number;
}

interface Props {
  orderId?: string;
  locationtype: number | string;
  insureSn?: string | undefined;
  orderInfo?: OrderForm;
}

const props = defineProps<Props>();

const gridOptions: VxeGridProps<InsuranceParams> = {
  columns: [
    { field: 'seq1', title: '保单系统编号', minWidth: 200 },
    { field: 'seq2', title: '投保操作时间', minWidth: 200 },
    { field: 'seq', title: '操作编号', minWidth: 200 },
    { field: 'orderNo', title: '订单号', minWidth: 180 },
    { field: 'tbr', title: '投保人', minWidth: 180 },
    { field: 'num', title: '人数', minWidth: 180 },
    {
      field: 'created',
      title: '操作时间',
      minWidth: 150,
      visible: props.orderId !== undefined,
      formatter: ({ row }) => moment(row.created).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      field: 'statusPerson',
      title: '状态',
      minWidth: 140,
      visible: props.orderId !== undefined,
      slots: { default: 'status' },
    },
    { field: 'policyNo', title: '保单号', minWidth: 180 },
    {
      title: '投保成功时间',
      minWidth: 150,
      visible: props.orderId !== undefined,
      formatter: ({ row }) =>
        row.status === 2
          ? moment(row.created).format('YYYY-MM-DD HH:mm:ss')
          : '',
    },
    {
      field: 'beginTime',
      title: '保单起保时间',
      minWidth: 150,
      visible: props.orderId !== undefined,
      formatter: ({ row }) =>
        moment(row.beginTime).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      field: 'endTime',
      title: '保单终保时间',
      minWidth: 150,
      visible: props.orderId !== undefined,
      formatter: ({ row }) => moment(row.endTime).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      field: 'action',
      title: '操作',
      minWidth: 280,
      visible: props.orderId !== undefined,
      fixed: 'right',
      slots: { default: 'operate' },
    },
  ],
  pagerConfig: {
    enabled: props.orderId !== undefined,
    pageSize: 10,
    pageSizes: [10, 20, 30, 50],
  },
  data: [],
  showOverflow: true,
  minHeight: 300,
  proxyConfig: {
    response: {
      result: 'list',
      total: 'total',
      list: 'list',
    },
    ajax: {
      query: async ({ page }) => {
        const { list, total } = await TaskPostListApi({
          orderId: props.orderId,
          page: page.currentPage,
          size: page.pageSize,
        });
        return { list, total };
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions } as any);

const getData = () => {
  const $grid = gridApi.grid;
  if ($grid) {
    return $grid.getTableData().fullData;
  }
};

const router = useRouter();

/** 错单补投弹窗 ref */
const errorRetryModalRef = ref<InstanceType<typeof ErrorRetryModal>>();

/**
 * 判断当前时间是否在错单补投窗口期（当日 23:20 之前）
 */
const isInRetryWindow = () => {
  const now = moment();
  const cutoff = moment().startOf('day').add(23, 'hours').add(20, 'minutes');
  return now.isBefore(cutoff);
};

/** 补投按鈕 loading（key 为 task_post.id） */
const buTouLoading = ref<Record<number, boolean>>({});

/**
 * 打开错单补投弹窗
 * 流程：先 check → 确认 → 打开 ErrorRetryModal
 */
const openErrorRetry = async (row: any) => {
  if (!isInRetryWindow()) {
    ElMessage.warning('当日 23:20 后不再支持错单补投');
    return;
  }
  try {
    buTouLoading.value[row.id] = true;
    const canBuTou = await BuTouCheckApi(row.id);
    if (!canBuTou) {
      ElMessage.warning('该保单不符合补投条件');
      return;
    }
    await ElMessageBox.confirm('确定对该失败保单进行错单补投？', '错单补投', {
      confirmButtonText: '确定补投',
      cancelButtonText: '取消',
      type: 'warning',
    });
    errorRetryModalRef.value?.open(row.id);
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('检查失败，请重试');
    }
  } finally {
    buTouLoading.value[row.id] = false;
  }
};

const detail = (id: number) => {
  router.push(`/policy/detail?id=${id}`);
};

const downloadExcel = (excelurl: string) => {
  try {
    saveAs(excelurl, '投保操作人员清单.xls');
  } catch (error) {
    console.error('Error parsing JSON string:', error);
    return null;
  }
};

defineExpose({
  getData,
});
</script>

<template>
  <ElCard class="mb-4">
    <template #header>
      <div class="flex items-center justify-between">
        <div>自动投保记录</div>
      </div>
    </template>

    <Grid>
      <template #status="{ row }">
        <ElText v-if="row.status === 0" type="primary"> 待投保 </ElText>
        <ElText v-else-if="row.status === 1" type="warning"> 投保中 </ElText>
        <ElText v-else-if="row.status === 2" type="success"> 投保成功 </ElText>
        <span v-else-if="row.status === 3">
          <ElText type="danger">投保失败</ElText>
          <ElText v-if="row.hasBuTou === 1" type="info" class="ml-1"
            >（已补投）</ElText
          >
        </span>
      </template>

      <template #operate="{ row }">
        <ElLink type="primary" class="mr-2" @click="detail(row.policyId)">
          详情
        </ElLink>
        <ElLink
          type="primary"
          class="mr-2"
          @click="downloadExcel(row.excelUrl)"
          v-if="row.excelStauts"
        >
          人员清单下载
        </ElLink>
        <ElLink
          type="primary"
          :href="row.pdf"
          target="_blank"
          v-if="row.pdf && isPdfUrl(row.pdf)"
        >
          保单下载
        </ElLink>
        <!-- 错单补投按钮 -->
        <ElLink
          v-if="row.status === 3 && row.hasBuTou === 0"
          type="danger"
          class="ml-1"
          :class="{ 'pointer-events-none opacity-50': buTouLoading[row.id] }"
          @click="openErrorRetry(row)"
        >
          {{ buTouLoading[row.id] ? '处理中...' : '错单补投' }}
        </ElLink>
        <ElLink
          v-else-if="row.status === 3 && row.hasBuTou === 1 && row.buTouPdf"
          underline="always"
          type="success"
          :href="row.buTouPdf"
          target="_blank"
          class="ml-1"
        >
          补投保单下载
        </ElLink>
      </template>
    </Grid>

    <!-- 错单补投弹窗放在 ElCard 内部，保持组件单根节点 -->
    <ErrorRetryModal ref="errorRetryModalRef" @retried="gridApi.reload()" />
  </ElCard>
</template>

<style scoped>
:deep(.relative.rounded) {
  padding: 0;
}

:deep(.bg-background-deep) {
  display: none;
}

.cell {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: center;
  justify-content: center;
  padding: 4px 0;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.cell:hover {
  background-color: rgb(98 106 239 / 10%);
  transform: scale(1.05);
}

.cell .text {
  display: block;
  height: 16px;
  margin: 0 auto;
  font-size: 14px;
  font-weight: 500;
  line-height: 16px;
}

.cell.current {
  background-color: rgb(98 106 239 / 15%);
  box-shadow: 0 2px 6px rgb(98 106 239 / 20%);
}

.cell.current .text {
  font-weight: 600;
  color: #626aef;
}

.cell .count {
  padding: 1px 3px;
  font-size: 11px;
  font-weight: 500;
  line-height: 14px;
  color: var(--el-color-primary);
  background-color: rgb(var(--el-color-primary-rgb), 0.1);
  border-radius: 2px;
}
</style>
