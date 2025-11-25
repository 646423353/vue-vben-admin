<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';

import { onActivated, watch } from 'vue';
import { useRouter } from 'vue-router';

import { AccessControl, useAccess } from '@vben/access';
import { Page } from '@vben/common-ui';

import { useDebounceFn, useWindowSize } from '@vueuse/core';
import { ElAvatar, ElButton, ElLink } from 'element-plus';
import moment from 'moment';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { CustomerListApi } from '#/api/core/customer';
import { InsureListApi } from '#/api/core/insure';
import { OrderListApi } from '#/api/core/order';
import { TagListApi } from '#/api/core/tags';
import { useOrderStore } from '#/store/order';
import { checkSettlementTime } from '#/utils/timeCheck';

interface OrderType {
  id: number;
  consignTime: string;
  customer: string;
  emailAdd: string;
  emailMain: string;
  endTime: string;
  locationtype: string;
  lzxtype: string;
  orderId: string;
  orderSn: string;
  period: number;
  remark: string;
  safetype: string;
  shippingCode: string;
  shippingCodeAdd: string;
  ywxtype: string;
  createTime: string;
  updateTime: string;
  nicknameUpdate: string;
  userName: string;
  mainInsure: string;
  addiInsure: string;
  needsynctag: number;
}

const router = useRouter();
const { hasAccessByCodes } = useAccess();

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
      component: 'DatePicker',
      fieldName: 'period',
      label: '所属月份',
      componentProps: {
        allowClear: true,
        type: 'month',
        valueFormat: 'YYYYMM',
        placeholder: '请选择',
        style: 'width: 100%',
      },
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入订单号',
        allowClear: true,
      },
      fieldName: 'orderId',
      label: '订单号',
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入订单别名',
        allowClear: true,
      },
      fieldName: 'orderSn',
      label: '订单别名',
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
        placeholder: '请输入保险编码',
        allowClear: true,
      },
      fieldName: 'locationtype',
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
      fieldName: 'rangerDate',
      label: '创建时间',
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

const gridOptions: VxeGridProps<OrderType> = {
  columns: [
    { field: 'orderId', title: '订单号', width: 160 },
    { field: 'customerName', title: '所属公司', minWidth: 160 },
    { field: 'orderSn', title: '订单别名', minWidth: 120 },
    { field: 'locationtype', title: '保险编码', minWidth: 150 },
    {
      field: 'consignTime',
      title: '起保日期',
      formatter: ({ row }) =>
        row.consignTime ? moment(row.consignTime).format('YYYY-MM-DD') : '',
      minWidth: 100,
    },
    {
      field: 'endTime',
      title: '终保日期',
      formatter: ({ row }) =>
        row.endTime ? moment(row.endTime).format('YYYY-MM-DD') : '',
      minWidth: 100,
    },
    { field: 'mainInsure', title: '主险方案', minWidth: 120 },
    { field: 'addiInsure', title: '附加险方案', minWidth: 120 },
    {
      field: 'needsynctag',
      title: '订单来源',
      formatter: ({ row }) =>
        row.needsynctag === 1 ? 'API自动匹配' : '常规页面生成',
      minWidth: 120,
    },
    {
      showOverflow: true,
      title: '最后操作人',
      formatter: ({ row }) => row.nicknameUpdate || row.userName,
      minWidth: 120,
    },
    {
      field: 'createTime',
      showOverflow: true,
      title: '创建时间',
      formatter: ({ row }) =>
        row.createTime
          ? moment(row.createTime).format('YYYY-MM-DD HH:mm:ss')
          : '',
      minWidth: 140,
    },
    {
      field: 'updateTime',
      showOverflow: true,
      title: '修改时间',
      formatter: ({ row }) =>
        row.updateTime
          ? moment(row.updateTime).format('YYYY-MM-DD HH:mm:ss')
          : '',
      minWidth: 140,
    },
    {
      title: '操作',
      fixed: 'right',
      width: 100,
      slots: { default: 'operate' },
      showOverflow: true,
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
  toolbarConfig: {
    custom: true,
  },
  minHeight: 500,
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
        return await OrderListApi(
          {
            customer: formValues.customerIds?.join(','),
            safetype: formValues.safetypeIds?.join(','),
            lzxtype: formValues.lzxtypeIds?.join(','),
            ywxtype: formValues.ywxtypeIds?.join(','),
            ...formValues,
            tags: formValues.tags?.join(',') || null,
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
      },
    },
  },
};

const store = useOrderStore();

const [Grid, gridApi] = useVbenVxeGrid({ formOptions, gridOptions });

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

const detail = (id: number) => {
  router.push(`/order/detail?id=${id}`);
};

const goCreate = async () => {
  // 检查是否在结算时间段内
  if (await checkSettlementTime()) {
    return; // 如果在结算时间段内，则不执行后续操作
  }

  router.push('/order/edit');
};

const goMembers = async () => {
  // 检查是否在结算时间段内
  if (await checkSettlementTime()) {
    return; // 如果在结算时间段内，则不执行后续操作
  }

  router.push('/order/import');
};

const editCustomer = (id: number) => {
  router.push(`/order/edit?id=${id}`);
};

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

onActivated(() => {
  if (store.isUpdated) {
    gridApi.query();
    store.changeOrderStatus(false);
  }
});
</script>

<template>
  <Page title="订单列表">
    <template #extra>
      <ElButton type="primary" @click="goCreate">新建</ElButton>
      <ElButton type="primary" @click="goMembers">批单批量导入</ElButton>
    </template>

    <div class="vp-raw w-full">
      <Grid>
        <template #avatar="{ row }">
          <div class="flex w-full items-center justify-center pb-2 pt-2">
            <ElAvatar :src="row.avatar" />
          </div>
        </template>

        <template #operate="{ row }">
          <ElLink
            :class="{ 'mr-2': hasAccessByCodes(['1', '13']) }"
            type="primary"
            @click="detail(row.id)"
          >
            详情
          </ElLink>
          <AccessControl :codes="['1', '13']" type="code">
            <ElLink type="primary" @click="editCustomer(row.id)"> 编辑 </ElLink>
          </AccessControl>
          <!-- <ElLink class="mr-2" type="primary" @click="delCustomer(row.id)">
            删除
          </ElLink> -->
        </template>
      </Grid>
    </div>
  </Page>
</template>

<style scoped>
:deep(.el-date-editor--month) {
  width: 100%;
}
</style>
