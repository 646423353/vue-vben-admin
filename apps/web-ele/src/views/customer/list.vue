<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';

import { onActivated, watch } from 'vue';
import { useRouter } from 'vue-router';

import { AccessControl, useAccess } from '@vben/access';
import { Page } from '@vben/common-ui';

import { useDebounceFn, useWindowSize } from '@vueuse/core';
import {
  ElAvatar,
  ElButton,
  ElLink,
  ElMessage,
  ElMessageBox,
} from 'element-plus';
import moment from 'moment';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { CustomerDelApi, CustomerListApi } from '#/api/core/customer';
import { TagListApi } from '#/api/core/tags';
import { useCustomerStore } from '#/store/customer';

interface CustomerType {
  customerTags: {
    id: number;
    name: string;
  }[];
  id: number;
  carda: string;
  cardb: string;
  mail: string;
  pdf: string;
  systemnum: string;
  ticket: string;
  username: string;
  zhizao: string;
  created: string;
  stopHour: number;
  updated: string;
}

const router = useRouter();

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
      component: 'Input',
      componentProps: {
        placeholder: '请输入公司名称',
        allowClear: true,
      },
      fieldName: 'username',
      label: '公司名称',
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

const gridOptions: VxeGridProps<CustomerType> = {
  columns: [
    { field: 'id', title: 'ID.', width: 50 },
    { field: 'username', title: '公司名称', minWidth: 180 },
    { field: 'systemnum', title: '统一信用代码' },
    {
      field: 'customerTags',
      title: '公司分组',
      formatter: ({ row }) =>
        row.customerTags.map((item) => item.name).join(' , '),
    },
    { field: 'nickname', title: '创建人' },
    {
      field: 'created',
      showOverflow: true,
      title: '创建时间',
      formatter: ({ row }) =>
        row.created ? moment(row.created).format('YYYY-MM-DD HH:mm:ss') : '',
      width: 140,
    },
    { field: 'nicknameUpdate', showOverflow: true, title: '最后操作人' },
    {
      field: 'updated',
      showOverflow: true,
      title: '最后操作时间',
      formatter: ({ row }) =>
        row.updated ? moment(row.updated).format('YYYY-MM-DD HH:mm:ss') : '',
      width: 140,
    },
    {
      field: 'stopHour',
      title: '每日批处理时间',
      formatter: ({ row }) => (row.stopHour === 22 ? '22:00' : '20:00'),
    },
    {
      title: '操作',
      fixed: 'right',
      width: 140,
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
        return await CustomerListApi(
          {
            ...formValues,
            tags: formValues.tags?.join(','),
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
            withTag: 1,
            withStop: 0,
            withInsure: 0,
          },
        );
      },
    },
  },
};

const store = useCustomerStore();

const [Grid, gridApi] = useVbenVxeGrid({ formOptions, gridOptions });

const { height } = useWindowSize();

const resizeHandler: () => void = useDebounceFn(resize, 200);
watch([height], () => {
  resizeHandler?.();
});

function resize() {
  if (height.value - 210 < 600) {
    gridApi.setGridOptions({
      height: height.value + 30,
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
  router.push(`/customer/detail?id=${id}`);
};

const goCreate = () => {
  router.push('/customer/edit');
};

const editCustomer = (id: number) => {
  router.push(`/customer/edit?id=${id}`);
};

const delCustomer = (id: number) => {
  ElMessageBox.confirm('确定要删除此客户吗？', '重要提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    await CustomerDelApi(id);
    gridApi.reload();
    ElMessage.success('删除成功');
  });
};

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

const { hasAccessByCodes } = useAccess();

onActivated(() => {
  if (store.isUpdated) {
    gridApi.query();
    store.changeCustomerStatus(false);
  }
});
</script>

<template>
  <Page title="客户列表">
    <template #extra>
      <AccessControl :codes="['1', '13']" type="code">
        <ElButton type="primary" @click="goCreate">新建</ElButton>
      </AccessControl>
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
            type="primary"
            @click="detail(row.id)"
            :class="{ 'mr-2': hasAccessByCodes(['1', '13']) }"
          >
            详情
          </ElLink>
          <AccessControl :codes="['1', '13']" type="code">
            <ElLink class="mr-2" type="primary" @click="editCustomer(row.id)">
              编辑
            </ElLink>
            <ElLink class="mr-2" type="primary" @click="delCustomer(row.id)">
              删除
            </ElLink>
          </AccessControl>
        </template>
      </Grid>
    </div>
  </Page>
</template>
