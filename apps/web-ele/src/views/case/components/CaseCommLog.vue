<script lang="ts" setup>
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { CaseApi } from '#/api/core/case';

import { ref, watch } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { useDebounceFn, useWindowSize } from '@vueuse/core';
import { ElButton } from 'element-plus';
import moment from 'moment';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { CaseCommentGetApi, CaseMoneyListApi } from '#/api/core/case';

import moneyModal from './MoneyModal.vue';

interface Props {
  caseId: number | string;
  isHandle?: boolean;
}

const props = defineProps<Props>();
const totalRiderMoney = ref(0);
const totalThreeMoney = ref(0);

const gridOptions: VxeGridProps<CaseApi.CommentInfo> = {
  columns: [
    { field: 'content', title: '沟通内容', minWidth: 250 },
    {
      title: '案件',
      minWidth: 180,
      slots: { default: 'case' },
    },
    {
      field: '保险编码',
      title: '时间',
      minWidth: 180,
      slots: { default: 'time' },
    },
  ],
  pagerConfig: {
    pageSize: 10,
    pageSizes: [10, 20, 30, 50],
  },
  align: 'left',
  data: [],
  showOverflow: false,
  minHeight: 300,
  proxyConfig: {
    response: {
      result: 'list',
      total: 'total',
      list: 'list',
    },
    ajax: {
      query: async ({ page }) => {
        return await CaseCommentGetApi(
          props.caseId,
          page.currentPage,
          page.pageSize,
        );
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

const [MoneyModal, modalApi] = useVbenModal({
  connectedComponent: moneyModal,
  closeOnClickModal: false,
  draggable: true,
});

function openModal(isRiderUpdated: boolean, isThreeUpdated: boolean) {
  modalApi.setData({
    caseId: props.caseId,
    isRiderUpdated,
    isThreeUpdated,
  });
  modalApi.open();
}

const { height } = useWindowSize();

const resizeHandler: () => void = useDebounceFn(resize, 200);
watch([height], () => {
  resizeHandler?.();
});

function resize() {
  gridApi.setGridOptions({
    maxHeight: props.isHandle ? height.value - 800 : height.value - 410,
  });
}
resize();

const getStatusText = (status: number | string) => {
  const statusMap = {
    1: '结案',
    2: '理赔待处理',
    3: '保险公司定损',
    4: '待诉讼',
    5: '诉讼',
    6: '协议文件',
    7: '公司盖章',
    8: '待打款',
    9: '资料收集',
    10: '待骑手提供资料',
    11: '劳动仲裁',
    12: '死亡案件',
  };
  return statusMap[status as keyof typeof statusMap] || '';
};

const getCaseMoneyList = async (caseId: number | string, type: 1 | 2) => {
  const { list } = await CaseMoneyListApi(caseId, type);
  return list;
};

const isRiderUpdated = ref(false);
const isThreeUpdated = ref(false);

const getMoneyData = async () => {
  const riderList = await getCaseMoneyList(props.caseId, 1);
  const threeList = await getCaseMoneyList(props.caseId, 2);
  isRiderUpdated.value = riderList.length > 0;
  isThreeUpdated.value = threeList.length > 0;

  if (riderList.length > 0) {
    totalRiderMoney.value = riderList.reduce(
      (acc, cur) =>
        acc +
        (Number(cur.moneryMain) + Number(cur.moneryAttach)) +
        ((Number(cur.moneryMain) + Number(cur.moneryAttach)) * cur.daysCheck -
          (Number(cur.moneryMain) + Number(cur.moneryAttach)) *
            cur.daysMianpei),
      0,
    );
  }

  if (threeList.length > 0) {
    totalThreeMoney.value = threeList.reduce(
      (acc, cur) =>
        acc +
        (Number(cur.moneryMain) + Number(cur.moneryAttach)) +
        ((Number(cur.moneryMain) + Number(cur.moneryAttach)) * cur.daysCheck -
          (Number(cur.moneryMain) + Number(cur.moneryAttach)) *
            cur.daysMianpei),
      0,
    );
  }
};

watch(
  () => props.caseId,
  async (newId) => {
    if (newId) {
      getMoneyData();
    }
  },
  {
    immediate: true,
  },
);

const reCalculate = () => {
  getMoneyData();
};
</script>

<template>
  <Grid>
    <template #case="{ row }">
      <p>
        沟通方式：
        {{
          row.wayContact === 1
            ? '其他'
            : row.wayContact === 2
              ? '微信'
              : row.wayContact === 3
                ? '电话'
                : ''
        }}
      </p>
      <p>案件状态： {{ getStatusText(row.status) }}</p>
      <p v-if="row.beizhu">案件备注： {{ row.beizhu }}</p>
      <p v-if="row.timeContactNext">
        下次沟通时间： {{ moment(row.timeContactNext).format('YYYY-MM-DD') }}
      </p>
    </template>

    <template #time="{ row }">
      <p>提交人： {{ row.username }}</p>
      <p>提交时间： {{ moment(row.created).format('YYYY-MM-DD HH:mm:ss') }}</p>
    </template>
  </Grid>
  <div class="mt-2 px-3 text-sm">
    <span v-if="isRiderUpdated && totalRiderMoney" class="mr-2">
      骑手：{{ totalRiderMoney }}元
    </span>
    <span v-if="isThreeUpdated && totalThreeMoney" class="mr-2">
      三者：{{ totalThreeMoney }}元
    </span>
    <ElButton
      v-if="isRiderUpdated || isThreeUpdated"
      class="ml-4"
      size="small"
      type="primary"
      @click="openModal(isRiderUpdated, isThreeUpdated)"
    >
      修改
    </ElButton>
    <ElButton
      v-else
      size="small"
      type="primary"
      @click="openModal(isRiderUpdated, isThreeUpdated)"
    >
      设置赔付明细
    </ElButton>
  </div>

  <MoneyModal @re-calculate="reCalculate" />
</template>

<style scoped>
:deep(.relative.rounded) {
  padding: 0;
}

:deep(.bg-background-deep) {
  display: none;
}
</style>
