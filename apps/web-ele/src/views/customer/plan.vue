<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';

import { watch } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';

import { useDebounceFn, useWindowSize } from '@vueuse/core';
import { ElLink, ElMessage, ElMessageBox, ElTag } from 'element-plus';
import moment from 'moment';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { CustomerListApi } from '#/api/core/customer';
import { GroupListApi } from '#/api/core/group';
import { InsureListApi } from '#/api/core/insure';
import { PlanDelApi, PlanListApi } from '#/api/core/plan';

import planDetailModal from './components/PlanDetailModal.vue';

interface PlanType {
  id: number;
  customerName: string;
  insureSn: string;
  groupId: number | string;
  groupName: string;
  mainInsureId: string;
  mainInsureName: string;
  additionalInsureId: string;
  additionalInsureName: string;
  beginTime: string;
  endTime: string;
  status: number;
  createdAt: string;
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
      component: 'ApiSelect',
      fieldName: 'groupId',
      label: '保险编码',
      componentProps: {
        clearable: true,
        placeholder: '请选择',
        api: async () => await getGroupList(),
      },
    },
    {
      component: 'ApiSelect',
      fieldName: 'mainInsureId',
      label: '主险方案',
      componentProps: {
        clearable: true,
        placeholder: '请选择',
        api: async () => await getInsureList(1),
      },
    },
    {
      component: 'ApiSelect',
      fieldName: 'additionalInsureId',
      label: '附加险方案',
      componentProps: {
        clearable: true,
        placeholder: '请选择',
        api: async () => await getInsureList(2),
      },
    },
    {
      component: 'Select',
      componentProps: {
        clearable: true,
        options: [
          {
            key: 1,
            label: '启用',
            value: 1,
          },
          {
            key: 2,
            label: '停用',
            value: 2,
          },
          {
            key: 0,
            label: '删除',
            value: 0,
          },
        ],
        placeholder: '请选择',
      },
      fieldName: 'status',
      label: '状态',
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

const gridOptions: VxeGridProps<PlanType> = {
  columns: [
    { field: 'id', title: 'ID.', width: 50 },
    { field: 'customerName', title: '客户名称', minWidth: 120 },
    { field: 'insureSn', title: '保险编码', minWidth: 180 },
    { field: 'mainInsureName', title: '主险方案', minWidth: 120 },
    { field: 'additionalInsureName', title: '附加险方案', minWidth: 120 },
    {
      field: 'beginTime',
      title: '启用时间',
      minWidth: 120,
      formatter: ({ row }) =>
        row.beginTime ? moment(row.beginTime).format('YYYY-MM-DD') : '',
    },
    {
      field: 'endTime',
      title: '止用时间',
      minWidth: 120,
      formatter: ({ row }) =>
        row.endTime ? moment(row.endTime).format('YYYY-MM-DD') : '',
    },
    {
      field: 'status',
      showOverflow: true,
      title: '状态',
      width: 100,
      slots: { default: 'status' },
    },
    {
      field: 'updateUser',
      showOverflow: true,
      title: '最后操作人',
      minWidth: 120,
    },
    {
      field: 'createdAt',
      showOverflow: true,
      title: '创建时间',
      minWidth: 120,
      formatter: ({ row }) =>
        row.createdAt
          ? moment(row.createdAt).format('YYYY-MM-DD HH:mm:ss')
          : '',
    },
    {
      title: '操作',
      fixed: 'right',
      width: 120,
      slots: { default: 'operate' },
      showOverflow: true,
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
      query: async ({ page }, formValues) => {
        return await PlanListApi(
          {
            customerId: formValues.customerIds?.join(','),
            ...formValues,
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

const [PlanDetailModal, PlanDetailModalApi] = useVbenModal({
  connectedComponent: planDetailModal,
  closeOnClickModal: false,
  draggable: true,
});

const detail = (id: number) => {
  PlanDetailModalApi.setData({ id });
  PlanDetailModalApi.open();
};

const delPlan = (id: number) => {
  ElMessageBox.confirm('确定要删除此保障方案吗？', '重要提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    await PlanDelApi(id);
    gridApi.reload();
    ElMessage.success('删除成功');
  });
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

async function getGroupList() {
  const { list } = await GroupListApi(
    {},
    {
      page: 1,
      size: 2000,
    },
  );
  return list.map((item) => ({
    label: item.insureSn,
    value: item.id.toString(),
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
</script>

<template>
  <Page title="客户保障方案">
    <div class="vp-raw w-full">
      <Grid>
        <template #status="{ row }">
          <ElTag v-if="row.status === 1" effect="dark" type="success">
            启用
          </ElTag>
          <ElTag v-else-if="row.status === 2" effect="dark" type="warning">
            停用
          </ElTag>
          <ElTag v-else effect="dark" type="danger">删除</ElTag>
        </template>

        <template #operate="{ row }">
          <ElLink class="mr-2" type="primary" @click="detail(row.id)">
            详情
          </ElLink>
          <ElLink
            v-if="false"
            class="mr-2"
            type="primary"
            @click="delPlan(row.id)"
          >
            删除
          </ElLink>
        </template>
      </Grid>
    </div>

    <PlanDetailModal />
  </Page>
</template>
