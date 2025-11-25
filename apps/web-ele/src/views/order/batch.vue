<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';

import { ref, watch } from 'vue';

import { Page } from '@vben/common-ui';
import { cloneDeep } from '@vben/utils';

import { useDebounceFn, useWindowSize } from '@vueuse/core';
import { ElButton, ElMessage, ElText } from 'element-plus';
import moment from 'moment';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { CustomerListApi } from '#/api/core/customer';
import { InsureListApi } from '#/api/core/insure';
import {
  LogExportApi,
  OrderListApi,
  OrderMembersLogApi,
} from '#/api/core/order';
import { TagListApi } from '#/api/core/tags';
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

const shortcuts = [
  {
    text: '最近一周',
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 7);
      return [start, end];
    },
  },
  {
    text: '最近一个月',
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 30);
      return [start, end];
    },
  },
  {
    text: '最近三个月',
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 90);
      return [start, end];
    },
  },
];

const formOptions: VbenFormProps = {
  schema: [
    {
      component: 'ApiSelect',
      fieldName: 'orderIds',
      label: '所属订单',
      componentProps: {
        clearable: true,
        placeholder: '请选择',
        api: async () => await getOrderList(),
        multiple: true,
        filterable: true,
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
      component: 'Select',
      componentProps: {
        clearable: true,
        options: [
          {
            key: 1,
            label: '增员',
            value: 1,
          },
          {
            key: 2,
            label: '减员',
            value: 2,
          },
          {
            key: 3,
            label: '取消增员',
            value: 3,
          },
          {
            key: 4,
            label: '取消减员',
            value: 4,
          },
          {
            key: 5,
            label: '重新增员',
            value: 5,
          },
          {
            key: 6,
            label: '首保',
            value: 6,
          },
        ],
        placeholder: '请选择',
      },
      fieldName: 'operatetag',
      label: '操作类型',
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
      fieldName: 'beginTimes',
      label: '起保日期',
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
      label: '终保日期',
      componentProps: {
        allowClear: true,
        valueFormat: 'YYYY-MM-DD',
        placeholder: '请选择',
        style: 'width: 100%',
      },
    },
    {
      component: 'DatePicker',
      fieldName: 'rangerDate',
      label: '操作时间',
      componentProps: {
        allowClear: true,
        type: 'datetimerange',
        clearable: true,
        rangeSeparator: '至',
        startPlaceholder: '开始时间',
        endPlaceholder: '结束时间',
        valueFormat: 'YYYY-MM-DD HH:mm:ss',
        dateFormat: 'YYYY-MM-DD',
        timeFormat: 'HH:mm:ss',
        shortcuts,
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
  minHeight: 500,
  pagerConfig: {
    enabled: true,
    pageSize: 20,
    pageSizes: [10, 20, 30, 50],
  },
  sortConfig: {
    multiple: true,
  },
  toolbarConfig: {
    slots: {
      buttons: 'toolbar_buttons',
    },
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
      query: async ({ page }, formValues) => {
        const { list, total } = await OrderMembersLogApi(
          {
            orderId: formValues.orderIds?.join(','),
            customerId: formValues.customerIds?.join(','),
            lzxtype: formValues.lzxtypeIds?.join(','),
            ywxtype: formValues.ywxtypeIds?.join(','),
            beginTime: formValues.beginTimes
              ? moment(formValues.beginTimes).valueOf()
              : '',
            endTime: formValues.endTimes
              ? moment(formValues.endTimes).valueOf()
              : '',
            logDateBegin: formValues.rangerDate?.[0]
              ? moment(formValues.rangerDate?.[0]).valueOf()
              : '',
            logDateEnd: formValues.rangerDate?.[1]
              ? moment(formValues.rangerDate?.[1]).valueOf()
              : '',
            isfirst: formValues.operatetag === 6 ? 1 : '',
            ...formValues,
            operatetag: formValues.operatetag === 6 ? 1 : formValues.operatetag,
            tags: formValues.tags?.join(',') || null,
          },
          {
            page: page.currentPage,
            size: page.pageSize,
          },
        );
        dataTotal.value = total;
        return {
          list,
          total,
        };
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ formOptions, gridOptions });

const { height } = useWindowSize();

const resizeHandler: () => void = useDebounceFn(resize, 200);
watch([height], () => {
  resizeHandler?.();
});

function resize() {
  if (height.value - 210 < 600) {
    gridApi.setGridOptions({
      height: height.value + 250,
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

async function getOrderList() {
  const { list } = await OrderListApi(
    {},
    {
      page: 1,
      size: 2000,
    },
  );
  return list.map((item) => ({
    label: item.orderId,
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
    form.orderId = form.orderIds?.join(',');
    const exportUrl = await LogExportApi({
      orderId: form.orderIds?.join(','),
      customerId: form.customerIds?.join(','),
      lzxtype: form.lzxtypeIds?.join(','),
      ywxtype: form.ywxtypeIds?.join(','),
      beginTime: form.beginTimes ? `${moment(form.beginTimes).valueOf()}` : '',
      endTime: form.endTimes ? `${moment(form.endTimes).valueOf()}` : '',
      logDateBegin: form.rangerDate?.[0]
        ? `${moment(form.rangerDate?.[0]).valueOf()}`
        : '',
      logDateEnd: form.rangerDate?.[1]
        ? `${moment(form.rangerDate?.[1]).valueOf()}`
        : '',
      ...form,
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
  <Page title="批单列表">
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
