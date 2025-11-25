<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';

import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { AccessControl } from '@vben/access';
import { Page, useVbenModal } from '@vben/common-ui';

import { useDebounceFn, useWindowSize } from '@vueuse/core';
import { ElAvatar, ElButton, ElLink } from 'element-plus';
import { saveAs } from 'file-saver';
import moment from 'moment';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { CustomerListApi } from '#/api/core/customer';
import { PolicyListApi } from '#/api/core/policy';
import pdfModal from '#/components/PdfModal.vue';
import { isPdfUrl } from '#/utils/formatPdfUrl';

import recordUploadModal from './components/RecordUploadModal.vue';

interface PolicyType {
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

// 保单系统编号 创建时间范围 所属订单号 所属客户 保险编码  保单号 起保时间与终保时间范围 投保操作编号
const formOptions: VbenFormProps = {
  schema: [
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入保单系统编号',
        allowClear: true,
      },
      fieldName: 'uuid',
      label: '保单系统编号',
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入所属订单号',
        allowClear: true,
      },
      fieldName: 'orderNo',
      label: '所属订单号',
    },
    {
      component: 'ApiSelect',
      fieldName: 'customerid',
      label: '所属客户',
      componentProps: {
        clearable: true,
        placeholder: '请选择',
        api: async () => await getCustomerList(),
        // multiple: true,
        filterable: true,
      },
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入保险编码',
        allowClear: true,
      },
      fieldName: 'zhxbm',
      label: '保险编码',
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入保单号',
        allowClear: true,
      },
      fieldName: 'policyNo',
      label: '保单号',
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

const gridOptions: VxeGridProps<PolicyType> = {
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
    { field: 'policyNo', title: '保单号', minWidth: 160 },
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
        row.endTime
          ? moment(
              typeof row.endTime === 'string'
                ? new Date(row.endTime).getTime() - 1
                : row.endTime - 1,
            ).format('YYYY-MM-DD')
          : '',
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
      formatter: ({ row }) =>
        row.source === 0
          ? '自动投保'
          : row.source === 1
            ? '保单回录'
            : row.source === 2
              ? '渠道调用自动投保'
              : '',
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
      title: '操作',
      fixed: 'right',
      width: 200,
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
        return await PolicyListApi(
          {
            customer: formValues.customerIds?.join(','),
            beginTime: formValues.beginTimes
              ? moment(`${formValues.beginTimes} 00:00:00`).valueOf()
              : '',
            endTime: formValues.endTimes
              ? moment(`${formValues.endTimes} 23:59:59`).valueOf()
              : '',
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
  if (height.value - 210 < 600) {
    gridApi.setGridOptions({
      height: height.value + 180,
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
  router.push(`/policy/detail?id=${id}`);
};

const goCreate = () => {
  router.push('/policy/edit');
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

const [RecordUploadModal, recordUploadModalApi] = useVbenModal({
  connectedComponent: recordUploadModal,
  closeOnClickModal: false,
  draggable: true,
});

const recordUpload = (id: number) => {
  recordUploadModalApi.setData({ id });
  recordUploadModalApi.open();
};

const handleReloadList = () => {
  gridApi.query();
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
    console.error('Error parsing JSON string:', error);
    return null;
  }
};

const downloadExcel = (excelurl: string) => {
  try {
    saveAs(excelurl, '投保操作人员清单.xls');
  } catch (error) {
    console.error('Error parsing JSON string:', error);
    return null;
  }
};
</script>

<template>
  <Page title="保单列表">
    <template #extra>
      <ElButton type="primary" @click="goCreate">保单回录</ElButton>
    </template>

    <div class="vp-raw w-full">
      <Grid>
        <template #avatar="{ row }">
          <div class="flex w-full items-center justify-center pb-2 pt-2">
            <ElAvatar :src="row.avatar" />
          </div>
        </template>

        <template #operate="{ row }">
          <ElLink type="primary" class="mr-2" @click="detail(row.id)">
            详情
          </ElLink>
          <ElLink
            type="primary"
            class="mr-2"
            @click="downloadExcel(row.excelUrl)"
            v-if="row.excelStauts"
          >
            人员清单下载
          </ElLink>
          <AccessControl :codes="['1']" type="code" v-if="!row.pdfStatus">
            <ElLink type="primary" @click="recordUpload(row.id)">
              补录上传
            </ElLink>
          </AccessControl>
          <ElLink
            type="primary"
            v-else-if="row.pdfStatus && isPdfUrl(row.pdfurl)"
            @click="downloadPdf(row.pdfurl)"
          >
            保单下载
          </ElLink>
        </template>
      </Grid>
    </div>

    <RecordUploadModal @reload-list="handleReloadList" @show-pdf="showPdf" />
    <PdfModal :preview-pdf-url="pdfUrl" />
  </Page>
</template>

<style scoped>
:deep(.el-date-editor--month) {
  width: 100%;
}
</style>
