<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';

import { ref, watch } from 'vue';

import { AccessControl, useAccess } from '@vben/access';
import { Page, useVbenModal } from '@vben/common-ui';

import { useDebounceFn, useWindowSize } from '@vueuse/core';
import { regionData } from 'element-china-area-data';
import { ElButton, ElLink, ElMessage, ElMessageBox, ElTag } from 'element-plus';
import moment from 'moment';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { CustomerListApi } from '#/api/core/customer';
import { StopDelApi, StopListApi } from '#/api/core/stop';

import siteDetailModal from './components/SiteDetailModal.vue';
import siteEditModal from './components/SiteEditModal.vue';

const { hasAccessByCodes } = useAccess();

interface SiteType {
  id: number;
  customerName: string;
  name: string;
  owner: string;
  phone: string;
  province: string | undefined;
  city: string | undefined;
  district: string | undefined;
  addr: string;
  address: string;
  status: number;
  created: string;
}

const areaOptions = ref(regionData);

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
      component: 'Input',
      componentProps: {
        placeholder: '请输入站点名称',
        allowClear: true,
      },
      fieldName: 'name',
      label: '站点名称',
    },
    {
      component: 'Cascader',
      componentProps: {
        placeholder: '请输入所在地区',
        allowClear: true,
        options: areaOptions.value,
      },
      fieldName: 'addrIds',
      label: '所在地区',
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入站长姓名',
        allowClear: true,
      },
      fieldName: 'owner',
      label: '站长姓名',
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入站长电话',
        allowClear: true,
        type: 'number',
      },
      fieldName: 'phone',
      label: '站长电话',
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

const gridOptions: VxeGridProps<SiteType> = {
  columns: [
    { field: 'id', title: 'ID.', width: 50 },
    { field: 'customerName', title: '所属公司', minWidth: 180 },
    { field: 'catecityName', title: '所属城市', minWidth: 180 },
    { field: 'name', title: '站点名称', minWidth: 120 },
    {
      field: 'addr',
      title: '所在地区',
      formatter: ({ row }) =>
        row.addr ? `${row.province} / ${row.city} / ${row.district}` : '',
      minWidth: 180,
    },
    { field: 'address', title: '详细地址', minWidth: 240 },
    { field: 'owner', title: '站长姓名', minWidth: 120 },
    { field: 'phone', title: '站长电话', minWidth: 120 },
    {
      field: 'status',
      showOverflow: true,
      title: '状态',
      width: 100,
      slots: { default: 'status' },
    },
    {
      field: 'nicknameUpdate',
      showOverflow: true,
      title: '最后操作人',
      minWidth: 120,
    },
    {
      field: 'created',
      showOverflow: true,
      title: '创建时间',
      width: 140,
      formatter: ({ row }) =>
        row.created ? moment(row.created).format('YYYY-MM-DD HH:mm:ss') : '',
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
        return await StopListApi(
          {
            customerId: formValues.customerIds?.join(','),
            addr: JSON.stringify(formValues.addrIds),
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

const [SiteDetailModal, SiteDetailModalApi] = useVbenModal({
  connectedComponent: siteDetailModal,
  closeOnClickModal: false,
  draggable: true,
});

const detail = (id: number) => {
  SiteDetailModalApi.setData({ id });
  SiteDetailModalApi.open();
};

const delStop = (id: number) => {
  ElMessageBox.confirm('确定要删除此客户站点吗？', '重要提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    await StopDelApi(id);
    gridApi.reload();
    ElMessage.success('删除成功');
  });
};

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

const [SiteEditModal, SiteEditModalApi] = useVbenModal({
  connectedComponent: siteEditModal,
  closeOnClickModal: false,
  draggable: true,
});

const editSite = (id: number) => {
  SiteEditModalApi.setData({ id });
  SiteEditModalApi.open();
};

function openModal() {
  SiteEditModalApi.setData({ id: '' });
  SiteEditModalApi.open();
}

const handleReloadList = () => {
  gridApi.query();
};
</script>

<template>
  <Page title="客户站点">
    <template #extra>
      <ElButton type="primary" @click="openModal">新建</ElButton>
    </template>

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
          <ElLink
            type="primary"
            @click="detail(row.id)"
            :class="{ 'mr-2': hasAccessByCodes(['1', '13', '17']) }"
          >
            详情
          </ElLink>
          <AccessControl :codes="['1', '13', '17']" type="code">
            <ElLink class="mr-2" type="primary" @click="editSite(row.id)">
              编辑
            </ElLink>
            <ElLink type="primary" @click="delStop(row.id)"> 删除 </ElLink>
          </AccessControl>
        </template>
      </Grid>
    </div>

    <SiteDetailModal />
    <SiteEditModal @reload-list="handleReloadList" />
  </Page>
</template>
