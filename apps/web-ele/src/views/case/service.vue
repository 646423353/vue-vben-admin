<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';

import { ref, watch } from 'vue';

import { Page } from '@vben/common-ui';
import { cloneDeep } from '@vben/utils';

import { useDebounceFn, useWindowSize } from '@vueuse/core';
import { ElButton, ElLink, ElMessage, ElText } from 'element-plus';
import moment from 'moment';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { CustomerListApi } from '#/api/core/customer';
import { InsureListApi } from '#/api/core/insure';
import {
  MembersExportApi,
  OrderListApi,
  OrderMembersApi,
} from '#/api/core/order';
import { router } from '#/router';

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
}

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
      },
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
    { field: 'creditcard', title: '身份证', minWidth: 150 },
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
      title: '人员状态',
      minWidth: 140,
      slots: { default: 'status' },
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
        const { list, total } = await OrderMembersApi(
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
            ...formValues,
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
  gridApi.setGridOptions({
    maxHeight: height.value - 210,
  });
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

const goMembers = () => {
  router.push('/order/import');
};

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
    const exportUrl = await MembersExportApi({
      orderId: form.orderIds?.join(','),
      customerId: form.customerIds?.join(','),
      lzxtype: form.lzxtypeIds?.join(','),
      ywxtype: form.ywxtypeIds?.join(','),
      beginTime: form.beginTimes ? `${moment(form.beginTimes).valueOf()}` : '',
      endTime: form.endTimes ? `${moment(form.endTimes).valueOf()}` : '',
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
  <Page title="人员查询">
    <template #extra>
      <ElButton type="primary" @click="goMembers">批量导入</ElButton>
    </template>

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

        <template #operate="{ row }">
          <ElLink class="mr-2" type="primary" @click="row.id"> 详情 </ElLink>
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
