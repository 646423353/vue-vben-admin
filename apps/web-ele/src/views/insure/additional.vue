<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';

import { onActivated, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { Page, useVbenModal } from '@vben/common-ui';

import { useDebounceFn, useWindowSize } from '@vueuse/core';
import { ElButton, ElLink, ElMessage, ElMessageBox, ElTag } from 'element-plus';
import moment from 'moment';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { InsureDelApi, InsureListApi } from '#/api/core/insure';
import pdfModal from '#/components/PdfModal.vue';
import { useInsureStore } from '#/store/insure';

import insureDetailModal from './components/InsureDetailModal.vue';

interface RowType {
  id: number;
  ordertype: string;
  money: number;
  days: number;
  sendPeriod: number;
  status: number;
  createdAt: string;
  updateUser: string;
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
        placeholder: '请输入方案名称',
        allowClear: true,
      },
      fieldName: 'ordertype',
      label: '方案名称',
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入方案价格',
        allowClear: true,
        type: 'number',
      },
      fieldName: 'money',
      label: '方案价格',
    },
    {
      component: 'Select',
      fieldName: 'status',
      label: '状态',
      componentProps: {
        clearable: true,
        placeholder: '请选择',
        options: [
          {
            key: 1,
            label: '可用',
            value: 1,
          },
          {
            key: 0,
            label: '不可用',
            value: 0,
          },
        ],
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

const gridOptions: VxeGridProps<RowType> = {
  columns: [
    { field: 'id', title: 'ID.', width: 50 },
    { field: 'ordertype', title: '方案名称' },
    {
      field: 'money',
      title: '方案价格',
      formatter: ({ row }) =>
        `￥${row.money} / ${row.days === 1 ? '人 / 日' : '人 / 月'}`,
    },
    {
      field: 'sendPeriod',
      title: '发送时间',
      formatter: ({ row }) =>
        `${row.sendPeriod === 1 ? '每日 晚上08点00分' : '每日 晚上23点50分'}`,
    },
    // { field: 'nick_name', title: '最近运行状态' },
    // { field: 'nick_name', title: '最近运行开始时间' },
    {
      field: 'status',
      showOverflow: true,
      title: '状态',
      width: 100,
      slots: { default: 'status' },
    },
    { field: 'updateUser', showOverflow: true, title: '最后操作人' },
    {
      field: 'createdAt',
      showOverflow: true,
      title: '创建时间',
      formatter: ({ row }) =>
        row.createdAt
          ? moment(row.createdAt).format('YYYY-MM-DD HH:mm:ss')
          : '',
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
        return await InsureListApi(
          {
            cate: 2,
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

const store = useInsureStore();

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

const goCreate = () => {
  router.push('/insure/edit?cate=2');
};

const editInsure = (id: number) => {
  router.push(`/insure/edit?cate=2&id=${id}`);
};

const delInsure = (id: number) => {
  ElMessageBox.confirm('确定要删除这条附加险方案吗？', '重要提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    await InsureDelApi(id);
    gridApi.reload();
    ElMessage.success('删除成功');
  });
};

const [InsureDetailModal, GroupDetailModalApi] = useVbenModal({
  connectedComponent: insureDetailModal,
  closeOnClickModal: false,
  draggable: true,
});

const detail = (id: number) => {
  GroupDetailModalApi.setData({ id });
  GroupDetailModalApi.open();
};

const pdfUrl = ref('');
const [PdfModal, pdfModalApi] = useVbenModal({
  connectedComponent: pdfModal,
  closeOnClickModal: false,
  draggable: true,
});

const showPdf = (url: string) => {
  pdfUrl.value = url;
  pdfModalApi.open();
};

onActivated(() => {
  if (store.isUpdated) {
    gridApi.query();
    store.changeUpdateStatus(false);
  }
});
</script>

<template>
  <Page title="附加险方案">
    <template #extra>
      <ElButton type="primary" @click="goCreate">新建</ElButton>
    </template>
    <div class="vp-raw w-full">
      <Grid>
        <template #status="{ row }">
          <ElTag v-if="row.status === 1" effect="dark" type="success">
            可用
          </ElTag>
          <ElTag v-else effect="dark" type="danger">不可用</ElTag>
        </template>

        <template #operate="{ row }">
          <ElLink class="mr-2" type="primary" @click="detail(row.id)">
            详情
          </ElLink>
          <ElLink class="mr-2" type="primary" @click="editInsure(row.id)">
            编辑
          </ElLink>
          <ElLink class="mr-2" type="primary" @click="delInsure(row.id)">
            删除
          </ElLink>
        </template>
      </Grid>
    </div>

    <InsureDetailModal class="w-[800px]" @show-pdf="showPdf" />
    <PdfModal :preview-pdf-url="pdfUrl" />
  </Page>
</template>
