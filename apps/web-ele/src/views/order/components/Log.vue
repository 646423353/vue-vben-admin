<script lang="ts" setup>
import type { VxeGridProps } from '#/adapter/vxe-table';

import { onMounted, ref, watch } from 'vue';

import { ElButton, ElCard, ElDatePicker, ElText } from 'element-plus';
import moment from 'moment';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getRiderOrderDailyActiveAnalytics } from '#/api/core/analytics';
import { OrderMembersLogApi } from '#/api/core/order';
import { formatIdCard } from '#/utils/formatIDCardUtils';

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

interface QueryDataType {
  logDateBegin: string;
  logDateEnd: string;
}

const props = defineProps<Props>();

const queryData = ref<QueryDataType>({
  logDateBegin: '',
  logDateEnd: '',
});

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
    {
      field: 'creditcard',
      title: '身份证',
      minWidth: 150,
      formatter: ({ row }) => formatIdCard(row.creditcard),
    },
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
    { field: '所属站点名称', title: '所属站点名称', minWidth: 180 },
    { field: '骑手编号', title: '骑手编号', minWidth: 180 },
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
            logDateBegin: queryData.value.logDateBegin
              ? moment(queryData.value.logDateBegin).valueOf()
              : '',
            logDateEnd: queryData.value.logDateEnd
              ? moment(queryData.value.logDateEnd).valueOf()
              : '',
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

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

const dateValue = ref('');

const handleQuery = () => {
  if (!dateValue.value) return;
  queryData.value.logDateBegin = `${dateValue.value} 00:00:00`;
  queryData.value.logDateEnd = `${dateValue.value} 23:59:59`;
  gridApi.query();
};

const handleReset = () => {
  dateValue.value = '';
  queryData.value.logDateBegin = '';
  queryData.value.logDateEnd = '';
  gridApi.reload();
};

const riderCountList = ref<any[]>([]);
const dailyAddCount = ref<Record<string, number>>({});
const dailyMinusCount = ref<Record<string, number>>({});

const getRiderOrderCount = async () => {
  try {
    const response = await getRiderOrderDailyActiveAnalytics({
      begintime: moment().startOf('month').valueOf(),
      endtime: moment().add(1, 'days').startOf('day').valueOf(),
      orderid: props.orderId,
    });

    const list = response || [];

    riderCountList.value = Array.isArray(list) ? list : [];

    const addCountMap: Record<string, number> = {};
    const minusCountMap: Record<string, number> = {};
    riderCountList.value.forEach((item) => {
      if (item && item.dt) {
        const dateKey = moment(item.dt).format('YYYY-MM-DD');
        addCountMap[dateKey] = item.addcount ?? 0;
        minusCountMap[dateKey] = item.minuscount ?? 0;
      }
    });

    dailyAddCount.value = addCountMap;
    dailyMinusCount.value = minusCountMap;
  } catch (error) {
    console.error('获取骑手订单数据失败:', error);
    riderCountList.value = [];
    dailyMinusCount.value = {};
  }
};

const getRiderAddCount = (day: Date) => {
  const dateKey = moment(day).format('YYYY-MM-DD');
  return dailyAddCount.value[dateKey] || 0;
};

const getRiderMinusCount = (day: Date) => {
  const dateKey = moment(day).format('YYYY-MM-DD');
  return dailyMinusCount.value[dateKey] || 0;
};

onMounted(async () => {
  watch(
    () => props.orderId,
    (newOrderId) => {
      if (newOrderId) {
        getRiderOrderCount();
      }
    },
    { immediate: true },
  );

  if (props.orderId) await getRiderOrderCount();
});
</script>

<template>
  <ElCard class="mb-4">
    <template #header>
      <div>增减员记录</div>
    </template>

    <div class="flex items-center p-[8px]">
      <div class="mr-2">操作时间</div>
      <ElDatePicker
        type="date"
        placeholder="选择日期"
        format="YYYY-MM-DD"
        value-format="YYYY-MM-DD"
        v-model="dateValue"
      >
        <template #default="cell">
          <div class="cell" :class="{ current: cell.isCurrent }">
            <span
              class="increase"
              v-if="
                getRiderAddCount(cell.date) || getRiderMinusCount(cell.date)
              "
            >
              +{{ getRiderAddCount(cell.date) }}
            </span>
            <span class="text">{{ cell.text }}</span>
            <span
              class="decrease"
              v-if="
                getRiderMinusCount(cell.date) || getRiderAddCount(cell.date)
              "
            >
              -{{ getRiderMinusCount(cell.date) }}
            </span>
          </div>
        </template>
      </ElDatePicker>
      <div class="ml-auto">
        <ElButton @click="handleReset">重置</ElButton>
        <ElButton type="primary" @click="handleQuery">查询</ElButton>
      </div>
    </div>

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

.cell {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: center;
  justify-content: center;
  height: 100%;
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

.cell .increase {
  padding: 1px 3px;
  font-size: 11px;
  font-weight: 500;
  line-height: 14px;
  color: var(--el-color-success);
  background-color: rgb(var(--el-color-success-rgb), 0.1);
  border-radius: 2px;
}

.cell .decrease {
  padding: 1px 3px;
  font-size: 11px;
  font-weight: 500;
  line-height: 14px;
  color: var(--el-color-danger);
  background-color: rgb(var(--el-color-danger-rgb), 0.1);
  border-radius: 2px;
}
</style>
