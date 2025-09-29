<script lang="ts" setup>
import type { OrderForm } from '../operate/detail.vue';

import type { VxeGridProps } from '#/adapter/vxe-table';

import { onMounted, ref, watch } from 'vue';

import {
  ElButton,
  ElCard,
  ElCol,
  ElDatePicker,
  ElLink,
  ElRow,
  ElText,
} from 'element-plus';
import saveAs from 'file-saver';
import moment from 'moment';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getRiderOrderDailyActiveAnalytics } from '#/api/core/analytics';
import { PolicyListApi } from '#/api/core/policy';

export interface PolicyParams {
  id: number;
  uuid?: string;
  dt?: number | string;
  policyNo?: string;
  beginTime?: string;
  endTime?: string;
  peoplecount?: number;
  payment?: number | string;
  orderNo?: string;
  customername?: string;
  bxbh?: string;
  type?: number;
  bxfa?: string;
  bxfaId?: number;
  source?: number;
  seq?: string;
  statusToubao?: number;
  status?: number;
  feedback?: string;
}

interface Props {
  orderId?: string;
  locationtype: number | string;
  insureSn?: string | undefined;
  orderInfo?: OrderForm;
}

interface QueryParams {
  beginTimes?: string;
  beginTime?: string;
  endTimes?: string;
  endTime?: string;
  rangerDate?: string[];
}

const props = defineProps<Props>();

const gridOptions: VxeGridProps<PolicyParams> = {
  columns: [
    { field: 'id', title: '序号', width: 80 },
    { field: 'uuid', title: '保单系统编号', width: 160 },
    {
      field: 'dt',
      showOverflow: true,
      title: '创建时间',
      formatter: ({ row }) =>
        row.dt ? moment(row.dt).format('YYYY-MM-DD HH:mm:ss') : '',
      minWidth: 140,
    },
    { field: 'policyNo', title: '保单号', minWidth: 120 },
    {
      field: 'beginTime',
      title: '起保日期',
      formatter: ({ row }) =>
        row.beginTime ? moment(row.beginTime).format('YYYY-MM-DD') : '',
      minWidth: 100,
    },
    {
      field: 'endTime',
      title: '终保日期',
      formatter: ({ row }) =>
        row.endTime ? moment(row.endTime).format('YYYY-MM-DD') : '',
      minWidth: 100,
    },
    { field: 'peoplecount', title: '被保险人人数', minWidth: 150 },
    { field: 'payment', title: '保费', minWidth: 150 },
    { field: 'orderNo', title: '所属订单号', minWidth: 150 },
    { field: 'customername', title: '所属客户名称', minWidth: 160 },
    { field: 'zhxbm', title: '保险编码', minWidth: 150 },
    {
      field: 'type',
      title: '主险或附加险',
      minWidth: 150,
      formatter: ({ row }) => (row.type === 0 ? '主险' : '附加险'),
    },
    { field: 'bxfa', title: '方案名称', minWidth: 150 },
    { field: 'bxfaId', title: '方案ID', minWidth: 150 },
    {
      field: 'source',
      title: '保单来源',
      minWidth: 150,
      formatter: ({ row }) => (row.source === 0 ? '自动投保' : '保单回录'),
    },
    { field: 'seq', title: '投保操作编号', minWidth: 150 },
    {
      field: 'statusToubao',
      title: '投保操作状态',
      minWidth: 150,
      formatter: ({ row }) => {
        switch (row.statusToubao) {
          case 0: {
            return '未投保';
          }
          case 1: {
            return '投保中';
          }
          case 2: {
            return '投保成功';
          }
          case 3: {
            return '投保失败';
          }
          default: {
            return '';
          }
        }
      },
    },
    {
      field: 'status',
      title: '保单状态',
      minWidth: 150,
      formatter: ({ row }) => {
        switch (row.status) {
          case 0: {
            return '投保中';
          }
          case 1: {
            return '未起保';
          }
          case 2: {
            return '保障中';
          }
          case 3: {
            return '已失效';
          }
          case 4: {
            return '已退保';
          }
          case 5: {
            return '投保失败';
          }
          default: {
            return '';
          }
        }
      },
    },
    { field: 'feedback', title: '投保反馈信息', minWidth: 250 },
    {
      title: '保单下载',
      fixed: 'right',
      width: 100,
      slots: { default: 'operate' },
      showOverflow: true,
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
      query: async ({ page }, formValues) => {
        const { list, total } = await PolicyListApi(
          {
            orderid: props.orderId,
            beginTime: formValues.beginTime,
            endTime: formValues.endTime,
          },
          {
            page: page.currentPage,
            size: page.pageSize,
            beginTime: formValues.rangerDate?.[0]
              ? moment(formValues.rangerDate?.[0]).valueOf()
              : '',
            endTime: formValues.rangerDate?.[1]
              ? moment(formValues.rangerDate?.[1]).valueOf()
              : '',
          },
        );
        return { list, total };
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

const getData = () => {
  const $grid = gridApi.grid;
  if ($grid) {
    return $grid.getTableData().fullData;
  }
};

const dateValue = ref('');

const queryParams = ref<QueryParams>({});
const handleQuery = () => {
  gridApi.query({
    beginTime: moment(
      dateValue.value
        ? `${dateValue.value} 00:00:00`
        : queryParams.value.beginTimes,
    ).valueOf(),
    endTime: moment(
      dateValue.value
        ? `${dateValue.value} 23:59:59`
        : queryParams.value.endTimes,
    ).valueOf(),
    rangerDate: queryParams.value.rangerDate,
  });
};

const handleReset = () => {
  queryParams.value.rangerDate = [];
  queryParams.value.beginTimes = '';
  queryParams.value.endTimes = '';
  queryParams.value.beginTime = '';
  queryParams.value.endTime = '';
  dateValue.value = '';
  gridApi.query();
};

const handleDateChange = (date: string) => {
  queryParams.value.beginTimes = `${date} 00:00:00`;
  queryParams.value.endTimes = `${date} 23:59:59`;
};

const downloadPdf = (url: string) => {
  try {
    // 判断url是否为下载链接
    // 检查是否以http/https开头，并且包含常见的文件扩展名
    const isDownloadLink =
      /^https?:\/\/.+\.(?:pdf|doc|docx|xls|xlsx|zip|rar|jpg|jpeg|png|gif)$/i.test(
        url,
      );

    if (isDownloadLink) {
      // 如果是下载链接，从url中提取文件名或使用默认名
      const filename = url.split('/').pop() || 'download';
      saveAs(url, filename);
      return;
    }

    const data = JSON.parse(url);
    const pdfurl = data[0].response.result;
    const filename = data[0].name;
    saveAs(pdfurl, filename);
  } catch (error) {
    console.error('Error parsing JSON string or downloading file:', error);
    return null;
  }
};

const riderCountList = ref<any[]>([]);
const dailyRiderCount = ref<Record<string, number>>({});

const getRiderOrderCount = async () => {
  try {
    const response = await getRiderOrderDailyActiveAnalytics({
      begintime: moment().startOf('month').valueOf(),
      endtime: moment().add(1, 'days').startOf('day').valueOf(),
      orderid: props.orderId,
    });

    const list = response || [];

    riderCountList.value = Array.isArray(list) ? list : [];

    const countMap: Record<string, number> = {};
    riderCountList.value.forEach((item) => {
      if (item && item.dt) {
        const dateKey = moment(item.dt).format('YYYY-MM-DD');
        countMap[dateKey] = item.peoplecount ?? 0;
      }
    });

    dailyRiderCount.value = countMap;
  } catch (error) {
    console.error('获取骑手订单数据失败:', error);
    riderCountList.value = [];
    dailyRiderCount.value = {};
  }
};

const getRiderDayCount = (day: Date) => {
  const dateKey = moment(day).format('YYYY-MM-DD');
  return dailyRiderCount.value[dateKey] || 0;
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

defineExpose({
  getData,
});
</script>

<template>
  <ElCard class="mb-4">
    <template #header>
      <div class="flex items-center justify-between">
        <div>关联保单</div>
      </div>
    </template>

    <ElRow>
      <ElCol :span="8">
        <div class="flex items-center p-[8px]">
          <div class="mr-2">起保日期</div>
          <ElDatePicker
            type="date"
            placeholder="选择日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            clearable
            v-model="queryParams.beginTimes"
            :readonly="!!dateValue"
          />
        </div>
      </ElCol>
      <ElCol :span="8">
        <div class="flex items-center p-[8px]">
          <div class="mr-2">终保日期</div>
          <ElDatePicker
            type="date"
            placeholder="选择日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            clearable
            v-model="queryParams.endTimes"
            :readonly="!!dateValue"
          />
        </div>
      </ElCol>
      <ElCol :span="8">
        <div class="flex items-center p-[8px]">
          <div class="mr-2">在保人数日历</div>
          <ElDatePicker
            type="date"
            placeholder="选择日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            clearable
            v-model="dateValue"
            @change="handleDateChange"
          >
            <template #default="cell">
              <div class="cell" :class="{ current: cell.isCurrent }">
                <span class="text">{{ cell.text }}</span>
                <span class="count" v-if="getRiderDayCount(cell.date)">
                  {{ getRiderDayCount(cell.date) }}
                </span>
              </div>
            </template>
          </ElDatePicker>
        </div>
      </ElCol>
      <ElCol :span="16">
        <div class="flex items-center p-[8px]">
          <div class="mr-2">创建时间</div>
          <ElDatePicker
            type="datetimerange"
            placeholder="选择日期"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            clearable
            range-separator="至"
            v-model="queryParams.rangerDate"
          />
        </div>
      </ElCol>
      <ElCol :span="8">
        <div class="flex justify-end p-[8px]">
          <ElButton @click="handleReset">重置</ElButton>
          <ElButton type="primary" @click="handleQuery">查询</ElButton>
        </div>
      </ElCol>
    </ElRow>

    <Grid>
      <template #status="{ row }">
        <ElText v-if="row.status === 0" type="primary"> 待投保 </ElText>
        <ElText v-else-if="row.status === 1" type="warning"> 投保中 </ElText>
        <ElText v-else-if="row.status === 2" type="success"> 投保成功 </ElText>
        <ElText v-else-if="row.status === 3" type="danger"> 投保失败 </ElText>
      </template>

      <template #operate="{ row }">
        <ElLink
          underline="always"
          type="primary"
          @click="downloadPdf(row.pdfurl)"
          v-if="row.pdfStatus"
        >
          保单下载
        </ElLink>
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
  justify-content: flex-start;
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
