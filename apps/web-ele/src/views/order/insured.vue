<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';

import { markRaw, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';
import { cloneDeep } from '@vben/utils';

import { useDebounceFn, useWindowSize } from '@vueuse/core';
import { ElButton, ElMessage, ElText } from 'element-plus';
import moment from 'moment';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { CustomerListApi } from '#/api/core/customer';
import { InsureListApi } from '#/api/core/insure';
import { MembersExportApi, OrderMembersApi } from '#/api/core/order';
import { TagListApi } from '#/api/core/tags';
import { formatIdCard } from '#/utils/formatIDCardUtils';

import OrderSelect from './components/OrderSelect.vue';

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
  overlapDays?: any;
}

const formOptions: VbenFormProps = {
  schema: [
    {
      component: markRaw(OrderSelect),
      fieldName: 'orderIds',
      label: '所属订单',
      componentProps: {
        clearable: true,
        placeholder: '请选择',
        multiple: true,
      },
    },
    {
      component: 'ApiSelect',
      fieldName: 'customerIds',
      label: '所属公司',
      componentProps: {
        clearable: true,
        placeholder: '请选择',
        api: async () => await getCustomerList(),
        multiple: true,
        filterable: true,
      },
    },
    {
      component: 'ApiSelect',
      fieldName: 'tags',
      label: '公司分组',
      componentProps: {
        clearable: true,
        placeholder: '请选择公司分组',
        api: async () => await getTagList(),
        multiple: true,
      },
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入姓名',
        allowClear: true,
      },
      fieldName: 'username',
      label: '姓名',
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入身份证',
        allowClear: true,
      },
      fieldName: 'creditcard',
      label: '身份证',
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入保险编码',
        allowClear: true,
      },
      fieldName: 'bxbm',
      label: '保险编码',
    },
    {
      component: 'ApiSelect',
      fieldName: 'lzxtypeIds',
      label: '主险方案',
      componentProps: {
        clearable: true,
        placeholder: '请选择',
        api: async () => await getInsureList(1),
        multiple: true,
        filterable: true,
      },
    },
    {
      component: 'ApiSelect',
      fieldName: 'ywxtypeIds',
      label: '附加险方案',
      componentProps: {
        clearable: true,
        placeholder: '请选择',
        api: async () => await getInsureList(2),
        multiple: true,
        filterable: true,
      },
    },
    {
      component: 'DatePicker',
      fieldName: 'insureTime',
      label: '在保日期',
      componentProps: {
        allowClear: true,
        valueFormat: 'YYYY-MM-DD',
        placeholder: '请选择',
        style: 'width: 100%',
      },
    },
    {
      component: 'DatePicker',
      fieldName: 'beginTimes',
      label: '精确起保日期',
      componentProps: {
        allowClear: true,
        valueFormat: 'YYYY-MM-DD',
        placeholder: '请选择',
        style: 'width: 100%',
      },
    },
    {
      component: 'DatePicker',
      fieldName: 'endTimes',
      label: '精确终保日期',
      componentProps: {
        allowClear: true,
        valueFormat: 'YYYY-MM-DD',
        placeholder: '请选择',
        style: 'width: 100%',
      },
    },
    {
      component: 'DatePicker',
      fieldName: 'actualTimeRange',
      label: '周期内在保查询',
      componentProps: {
        allowClear: true,
        type: 'daterange',
        valueFormat: 'YYYY-MM-DD',
        startPlaceholder: '起保起始日期',
        endPlaceholder: '终保结束日期',
        rangeSeparator: '至',
        style: 'width: 100%',
      },
      formItemClass: 'col-span-2',
    },
  ],
  showCollapseButton: false,
  submitButtonOptions: {
    content: '查询',
  },
  submitOnEnter: false,
};

const dataTotal = ref(0);
const gridOptions: VxeGridProps<OrderType> = {
  columns: [
    { field: 'orderNo', title: '订单号', width: 160 },
    { field: 'customerName', title: '所属公司', minWidth: 160 },
    { field: 'bxbm', title: '保险编码', minWidth: 150 },
    { field: 'mainInsure', title: '主险方案', minWidth: 150 },
    { field: 'addiInsure', title: '附加险方案', minWidth: 150 },
    { field: 'username', title: '姓名', minWidth: 100 },
    {
      field: 'creditcard',
      title: '身份证',
      minWidth: 150,
      formatter: ({ row }) => formatIdCard(row.creditcard),
    },
    {
      field: 'beginTime',
      title: '起保时间',
      minWidth: 160,
      formatter: ({ row }) =>
        row.beginTime && row.statusPerson !== 5
          ? moment(row.beginTime).format('YYYY-MM-DD HH:mm:ss')
          : '',
    },
    {
      field: 'endTime',
      title: '终保时间',
      minWidth: 160,
      formatter: ({ row }) =>
        row.endTime && row.statusPerson !== 5
          ? moment(row.endTime).format('YYYY-MM-DD HH:mm:ss')
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
      field: 'overlapDays',
      title: '筛选范围内在保天数',
      minWidth: 160,
      formatter: ({ row }) =>
        row.overlapDays !== undefined && row.overlapDays !== null
          ? row.overlapDays
          : '',
    },
    {
      title: '人员状态',
      minWidth: 140,
      slots: { default: 'status' },
    },
    { field: 'stopName', title: '站点名称', minWidth: 150 },
    { field: 'idNum', title: '骑手编号', minWidth: 150 },
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
  toolbarConfig: {
    slots: {
      buttons: 'toolbar_buttons',
    },
  },
  proxyConfig: {
    response: {
      result: 'list',
      total: 'total',
      list: 'list',
    },
    ajax: {
      query: async ({ page }, formValues) => {
        if (
          formValues.actualTimeRange &&
          Array.isArray(formValues.actualTimeRange) &&
          formValues.actualTimeRange.length > 0
        ) {
          const [startTime, endTime] = formValues.actualTimeRange;
          if (!startTime || !endTime) {
            ElMessage.warning('周期内在保查询筛选条件不全');
            return { list: [], total: 0 };
          }
        }

        const [startTime, endTime] = formValues.actualTimeRange || [];
        const { list, total } = await OrderMembersApi(
          {
            orderId: formValues.orderIds?.join(','),
            customerId: formValues.customerIds?.join(','),
            lzxtype: formValues.lzxtypeIds?.join(','),
            ywxtype: formValues.ywxtypeIds?.join(','),
            insureTime: formValues.insureTime
              ? moment(formValues.insureTime).valueOf()
              : '',
            beginTime: formValues.beginTimes
              ? String(moment(formValues.beginTimes).valueOf())
              : '',
            endTime: formValues.endTimes
              ? String(
                  moment(formValues.endTimes)
                    .endOf('day')
                    .millisecond(0)
                    .valueOf(),
                )
              : '',
            rangeBeginTime: startTime
              ? String(moment(startTime).startOf('day').valueOf())
              : '',
            rangeEndTime: endTime
              ? String(moment(endTime).endOf('day').millisecond(0).valueOf())
              : '',
            username: formValues.username,
            creditcard: formValues.creditcard,
            bxbm: formValues.bxbm,
            tags: formValues.tags?.join(',') || null,
          },
          {
            page: page.currentPage,
            size: page.pageSize,
          },
        );

        if (startTime && endTime) {
          const S = moment(startTime).startOf('day').valueOf();
          const E = moment(endTime).endOf('day').millisecond(0).valueOf();
          (list || []).forEach((row: any) => {
            const riderBegin = row.beginTime
              ? moment(row.beginTime).valueOf()
              : 0;
            const riderEnd = row.endTime ? moment(row.endTime).valueOf() : 0;
            let overlapDays = 0;
            if (riderBegin && riderEnd && riderBegin <= E && riderEnd >= S) {
              const overlapStart = Math.max(riderBegin, S);
              const overlapEnd = Math.min(riderEnd, E);
              if (overlapStart <= overlapEnd) {
                const startDay = moment(overlapStart).startOf('day');
                const endDay = moment(overlapEnd).startOf('day');
                overlapDays = endDay.diff(startDay, 'days') + 1;
              }
            }
            row.overlapDays = overlapDays;
          });
        } else {
          (list || []).forEach((row: any) => {
            row.overlapDays = null;
          });
        }

        dataTotal.value = total;
        return {
          list,
          total,
        };
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ formOptions, gridOptions } as any);

const { height } = useWindowSize();

const resizeHandler: () => void = useDebounceFn(resize, 200);
watch([height], () => {
  resizeHandler?.();
});

function resize() {
  if (height.value - 210 < 600) {
    gridApi.setGridOptions({
      height: height.value + 190,
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

async function getInsureList(cate: number) {
  const { list } = await InsureListApi(
    {
      cate,
    },
    {
      page: 1,
      size: 2000,
    },
  );
  return list.map((item) => ({
    label: item.ordertype,
    value: item.id,
  }));
}

async function getCustomerList() {
  const { list } = await CustomerListApi(
    {},
    {
      page: 1,
      size: 2000,
      withTag: 0,
      withStop: 0,
      withInsure: 0,
    },
  );
  return list.map((item) => ({
    label: item.username,
    value: item.id,
  }));
}

async function getTagList() {
  const { list } = await TagListApi({
    page: 1,
    size: 2000,
  });
  return list.map((item) => ({
    label: item.name,
    value: item.id,
  }));
}

const btnLoading = ref(false);
const exportEvent = async () => {
  const form = cloneDeep(await gridApi.formApi.getValues());
  if (isObjectEmpty(form)) {
    ElMessage.error('请选择导出条件并查询数据');
    return;
  }
  try {
    btnLoading.value = true;
    const [startTime, endTime] = form.actualTimeRange || [];
    if (
      form.actualTimeRange &&
      Array.isArray(form.actualTimeRange) &&
      form.actualTimeRange.length > 0 &&
      (!startTime || !endTime)
    ) {
      ElMessage.warning('周期内在保查询筛选条件不全');
      return;
    }
    const exportUrl = await MembersExportApi({
      orderId: form.orderIds?.join(','),
      customerId: form.customerIds?.join(','),
      lzxtype: form.lzxtypeIds?.join(','),
      ywxtype: form.ywxtypeIds?.join(','),
      insureTime: form.insureTime ? moment(form.insureTime).valueOf() : undefined,
      beginTime: form.beginTimes ? `${moment(form.beginTimes).valueOf()}` : '',
      endTime: form.endTimes
        ? `${moment(form.endTimes).endOf('day').millisecond(0).valueOf()}`
        : '',
      rangeBeginTime: startTime
        ? `${moment(startTime).startOf('day').valueOf()}`
        : '',
      rangeEndTime: endTime
        ? `${moment(endTime).endOf('day').millisecond(0).valueOf()}`
        : '',
      username: form.username,
      creditcard: form.creditcard,
      bxbm: form.bxbm,
      tags: form.tags?.join(',') || null,
    });
    window.open(exportUrl, '_blank');
  } catch (error) {
    console.error(error);
  } finally {
    btnLoading.value = false;
  }
};

function isObjectEmpty(obj: { [x: string]: any }) {
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      if (
        value !== null &&
        value !== undefined &&
        value !== '' &&
        value !== 0 &&
        !Number.isNaN(value)
      ) {
        return false;
      }
    }
  }
  return true;
}
</script>

<template>
  <Page title="在保查询">
    <div class="vp-raw w-full">
      <Grid>
        <template #toolbar_buttons>
          <ElText> 查询到{{ dataTotal }}条记录 </ElText>
          <ElButton
            :loading="btnLoading"
            class="ml-2"
            type="primary"
            @click="exportEvent"
          >
            导出
          </ElButton>
        </template>

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
    </div>
  </Page>
</template>

<style scoped>
:deep(.el-date-editor--date) {
  width: 100%;
}
</style>
