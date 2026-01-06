<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';

import { watch } from 'vue';

import { AccessControl } from '@vben/access';
import { Page, useVbenModal } from '@vben/common-ui';

import { useDebounceFn, useWindowSize } from '@vueuse/core';
import { ElButton, ElLink, ElMessage, ElMessageBox, ElTag } from 'element-plus';
import moment from 'moment';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { AreaDelApi, AreaListApi } from '#/api/core/area';
import { CityListApi } from '#/api/core/city';
import { CustomerListApi } from '#/api/core/customer';
import { StopListApi } from '#/api/core/stop';

import organizationEditModal from './components/OrganizationEditModal.vue';
import siteEditModal from './components/SiteEditModal.vue';

interface SiteType {
  id: number;
  customerId: number;
  name: string;
  owner: string;
  phone: string;
  status: number;
  type: number;
  created: string;
  peopleCount: number;
  peoplecount: number;
}

// const areaOptions = ref(regionData);

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
        filterable: true,
      },
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入渠道名称',
        allowClear: true,
      },
      fieldName: 'name',
      label: '渠道名称',
    },
    // {
    //   component: 'Cascader',
    //   componentProps: {
    //     placeholder: '请输入所在地区',
    //     allowClear: true,
    //     options: areaOptions.value,
    //   },
    //   fieldName: 'addrIds',
    //   label: '所在地区',
    // },
    // {
    //   component: 'Input',
    //   componentProps: {
    //     placeholder: '请输入站长姓名',
    //     allowClear: true,
    //   },
    //   fieldName: 'owner',
    //   label: '站长姓名',
    // },
    // {
    //   component: 'Input',
    //   componentProps: {
    //     placeholder: '请输入站长电话',
    //     allowClear: true,
    //     type: 'number',
    //   },
    //   fieldName: 'phone',
    //   label: '站长电话',
    // },
    // {
    //   component: 'Select',
    //   componentProps: {
    //     clearable: true,
    //     options: [
    //       {
    //         key: 1,
    //         label: '启用',
    //         value: 1,
    //       },
    //       {
    //         key: 2,
    //         label: '停用',
    //         value: 2,
    //       },
    //       {
    //         key: 0,
    //         label: '删除',
    //         value: 0,
    //       },
    //     ],
    //     placeholder: '请选择',
    //   },
    //   fieldName: 'status',
    //   label: '状态',
    // },
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
    {
      field: 'name',
      title: '组织名称',
      minWidth: 180,
      treeNode: true,
      showOverflow: true,
      align: 'left',
    },
    { field: 'uuid', title: '组织编码', minWidth: 120 },
    { field: 'owner', title: '负责人', minWidth: 120 },
    { field: 'phone', title: '手机号', minWidth: 120 },
    {
      field: 'peopleCount',
      title: '骑士总量',
      minWidth: 120,
      formatter: ({ row }) => row.peopleCount || row.peoplecount,
    },
    { title: '类型', minWidth: 100, slots: { default: 'type' } },
    {
      field: 'status',
      showOverflow: true,
      title: '状态',
      width: 100,
      slots: { default: 'status' },
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
      field: 'updated',
      showOverflow: true,
      title: '更新时间',
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
  treeConfig: {
    transform: true,
    rowField: 'id',
    parentField: 'parentId',
    lazy: true,
    hasChild: 'hasChild',
    loadMethod: async ({ row }): Promise<any[]> => {
      // 异步加载子节点
      switch (row.type) {
        case 1: {
          return getCustomerListTable(row.id);
        }
        case 2: {
          return getCityListTable(row.id);
        }
        case 3: {
          return getStopListTable(row.id);
        }
        default: {
          return [];
        }
      }
    },
  },
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
        const data = await AreaListApi(
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

        data.list.forEach((item) => {
          item.type = 1;
          item.hasChild = true;
        });
        return data;
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

const delArea = (id: number, type: number) => {
  ElMessageBox.confirm(
    `确定要删除此${type === 1 ? '渠道' : '城市'}吗？`,
    '重要提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    },
  ).then(async () => {
    await AreaDelApi(id);
    gridApi.reload();
    ElMessage.success('删除成功');
  });
};

const [OrganizationEditModal, OrganizationEditModalApi] = useVbenModal({
  connectedComponent: organizationEditModal,
  closeOnClickModal: false,
  draggable: true,
});

const editArea = (id: number, type: number) => {
  OrganizationEditModalApi.setData({ id, type });
  OrganizationEditModalApi.open();
};

function openModal() {
  OrganizationEditModalApi.setData({ id: '' });
  OrganizationEditModalApi.open();
}

const handleReloadList = () => {
  gridApi.query();
};

async function getCustomerListTable(city: number) {
  const { list } = await CustomerListApi(
    {
      city,
    },
    {
      page: 1,
      size: 2000,
      withTag: 0,
      withStop: 0,
      withInsure: 0,
    },
  );
  list.forEach((item) => {
    item.type = 2;
    item.name = item.username;
    item.hasChild = true;
  });
  return list;
}

async function getCityListTable(customerId: number) {
  const { list } = await CityListApi(
    {
      customerId,
    },
    {
      page: 1,
      size: 2000,
    },
  );
  list.forEach((item) => {
    item.type = 3;
    item.hasChild = true;
  });
  return list;
}

async function getStopListTable(cityId: number) {
  const { list } = await StopListApi(
    {
      catecity: cityId,
    },
    {
      page: 1,
      size: 2000,
    },
  );
  list.forEach((item) => {
    item.type = 4;
    item.hasChild = false;
  });
  return list;
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

const [SiteEditModal, SiteEditModalApi] = useVbenModal({
  connectedComponent: siteEditModal,
  closeOnClickModal: false,
  draggable: true,
});

const editSite = (id: number) => {
  SiteEditModalApi.setData({ id });
  SiteEditModalApi.open();
};
</script>

<template>
  <Page title="组织管理">
    <template #extra>
      <AccessControl :codes="['1', '13']" type="code">
        <ElButton type="primary" @click="openModal">新建</ElButton>
      </AccessControl>
    </template>

    <div class="vp-raw w-full">
      <Grid>
        <template #status="{ row }">
          <div v-if="row.type === 4">
            <ElTag v-if="row.status === 1" effect="dark" type="success">
              启用
            </ElTag>
            <ElTag v-else-if="row.status === 2" effect="dark" type="warning">
              停用
            </ElTag>
            <ElTag v-else effect="dark" type="danger">删除</ElTag>
          </div>
        </template>

        <template #operate="{ row }">
          <AccessControl :codes="['1', '13']" type="code">
            <ElLink
              class="mr-2"
              type="primary"
              v-if="row.type === 4"
              @click="editSite(row.id)"
            >
              编辑
            </ElLink>
            <ElLink
              class="mr-2"
              type="primary"
              v-if="row.type !== 4 && row.type !== 2"
              @click="editArea(row.id, row.type)"
            >
              编辑
            </ElLink>
            <ElLink
              class="mr-2"
              type="primary"
              v-if="row.type !== 4 && row.type !== 2"
              @click="delArea(row.id, row.type)"
            >
              删除
            </ElLink>
          </AccessControl>
        </template>

        <template #type="{ row }">
          <ElTag v-if="row.type === 1" effect="light" type="success">
            渠道
          </ElTag>
          <ElTag v-else-if="row.type === 2" effect="light" type="primary">
            客户
          </ElTag>
          <ElTag v-else-if="row.type === 3" effect="light" type="warning">
            城市
          </ElTag>
          <ElTag v-else effect="light" type="danger"> 站点 </ElTag>
        </template>
      </Grid>
    </div>

    <OrganizationEditModal @reload-list="handleReloadList" />
    <SiteEditModal @reload-list="handleReloadList" />
  </Page>
</template>
