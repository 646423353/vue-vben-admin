<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';

import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { cloneDeep } from '@vben/utils';

import { useDebounceFn, useWindowSize } from '@vueuse/core';
import { ElButton, ElLink, ElMessage, ElText } from 'element-plus';
import { saveAs } from 'file-saver';
import moment from 'moment';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { CustomerListApi } from '#/api/core/customer';
import { OrderFjxExportApi, OrderListApi } from '#/api/core/order';
import { isPdfUrl } from '#/utils/formatPdfUrl';

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
        placeholder: '请输入订单号',
        allowClear: true,
      },
      fieldName: 'orderId',
      label: '订单号',
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
      component: 'Input',
      componentProps: {
        placeholder: '请输入骑手姓名',
        allowClear: true,
      },
      fieldName: 'memberUsername',
      label: '骑手姓名',
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
      component: 'DatePicker',
      fieldName: 'consignTime',
      label: '起保时间',
      componentProps: {
        allowClear: true,
        valueFormat: 'YYYY-MM-DD HH:mm:ss',
        placeholder: '请选择',
        style: 'width: 100%',
        type: 'datetime',
      },
    },
    {
      component: 'DatePicker',
      fieldName: 'endTime',
      label: '终保时间',
      componentProps: {
        allowClear: true,
        valueFormat: 'YYYY-MM-DD HH:mm:ss',
        placeholder: '请选择',
        style: 'width: 100%',
        type: 'datetime',
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
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入骑手身份证号',
        allowClear: true,
      },
      fieldName: 'creditcard',
      label: '骑手身份证号',
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入投保人',
        allowClear: true,
      },
      fieldName: 'tbrName',
      label: '投保人',
    },
    // 暂时隐藏
    // {
    //   component: 'Select',
    //   fieldName: 'policyType',
    //   label: '主险或附加险',
    //   componentProps: {
    //     clearable: true,
    //     placeholder: '请选择',
    //     options: [
    //       { label: '主险', value: 0 },
    //       { label: '附加险', value: 1 },
    //     ],
    //   },
    // },
    // {
    //   component: 'ApiSelect',
    //   fieldName: 'lzxtypeIds',
    //   label: '险种',
    //   componentProps: {
    //     clearable: true,
    //     placeholder: '请选择',
    //     api: async () => await getInsureList(0),
    //     multiple: true,
    //     filterable: true,
    //   },
    // },
  ],
  showCollapseButton: false,
  submitButtonOptions: {
    content: '查询',
  },
  submitOnEnter: false,
};

const dataTotal = ref(0);

const gridOptions: VxeGridProps = {
  columns: [
    // ======== 订单部分 ========
    { field: 'orderId', title: '订单号', width: 160 },
    { field: 'person.policyNo', title: '保单号', minWidth: 160 },
    {
      field: 'memberPersons.list[0].username',
      title: '骑手姓名',
      minWidth: 100,
    },
    { field: 'customerName', title: '所属公司', minWidth: 160 },
    { field: 'orderSn', title: '订单别名', minWidth: 120 },
    { field: 'locationtype', title: '保险编码', minWidth: 150 },
    {
      field: 'consignTime',
      title: '起保时间',
      formatter: ({ row }) =>
        row.consignTime
          ? moment(row.consignTime).format('YYYY-MM-DD HH:mm:ss')
          : '',
      minWidth: 160,
    },
    {
      field: 'endTime',
      title: '终保时间',
      formatter: ({ row }) =>
        row.endTime ? moment(row.endTime).format('YYYY-MM-DD HH:mm:ss') : '',
      minWidth: 160,
    },
    { field: 'mainInsure', title: '主险方案', minWidth: 120 },
    { field: 'addiInsure', title: '附加险方案', minWidth: 120 },
    {
      field: 'needsynctag',
      title: '订单来源',
      formatter: ({ row }) => {
        switch (row.needsynctag) {
          case 0: {
            return '常规页面生成';
          }
          case 1: {
            return 'API自动匹配';
          }
          case 2: {
            return 'API个人直投';
          }
          default: {
            return '';
          }
        }
      },
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
    // ======== 保单部分 ========
    { field: 'person.uuid', title: '保单系统编号', minWidth: 160 },
    { field: 'person.payment', title: '保费', minWidth: 100 },
    {
      field: 'policyType',
      title: '主险或附加险',
      minWidth: 120,
      formatter: ({ row }) => (row.policyType === 0 ? '主险' : '附加险'),
    },
    { field: 'person.bxfa', title: '险种名称', minWidth: 150 },
    { field: 'person.bxfaId', title: '险种ID', minWidth: 100 },
    { field: 'person.seq', title: '投保操作编号', minWidth: 150 },
    {
      field: 'person.statusToubao',
      title: '投保操作状态',
      minWidth: 120,
      formatter: ({ row }) => {
        switch (row.person?.statusToubao) {
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
      field: 'person.status',
      title: '保单状态',
      minWidth: 120,
      formatter: ({ row }) => {
        switch (row.person?.status) {
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
    { field: 'person.feedback', title: '投保反馈信息', minWidth: 250 },
    {
      field: 'memberPersons.list[0].creditcard',
      title: '骑手身份证号',
      minWidth: 160,
    },
    { field: 'person.tbr', title: '投保人名称', minWidth: 120 },
    // ======== 操作 ========
    {
      title: '操作',
      fixed: 'right',
      width: 220,
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
    slots: {
      buttons: 'toolbar_buttons',
    },
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
        const result = await OrderListApi(
          {
            customer: formValues.customerIds?.join(','),
            ...formValues,
            consignTime: formValues.consignTime
              ? moment(formValues.consignTime).valueOf()
              : '',
            endTime: formValues.endTime
              ? moment(formValues.endTime).valueOf()
              : '',
            type: 2,
            tags: formValues.tags?.join(',') || null,
            zt: 1,
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
        dataTotal.value = result.total;
        return result;
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

const orderDetail = (id: number) => {
  router.push(`/direct-invest/order-detail?id=${id}&source=direct`);
};

const policyDetail = (id: number) => {
  router.push(`/direct-invest/policy-detail?id=${id}`);
};

const downloadPdf = (url: string) => {
  try {
    const isDownloadLink =
      /^https?:\/\/.+\.(?:pdf|doc|docx|xls|xlsx|zip|rar|jpg|jpeg|png|gif)$/i.test(
        url,
      );

    if (isDownloadLink) {
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
  }
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
  return list.map((item: any) => ({
    label: item.username,
    value: item.id,
  }));
}

// 暂时隐藏险种筛选，getInsureList 暂不使用
// async function getInsureList(cate: number) {
//   const { list } = await InsureListApi(
//     { cate },
//     {
//       page: 1,
//       size: 2000,
//     },
//   );
//   return list.map((item: any) => ({
//     label: item.ordertype,
//     value: item.id,
//   }));
// }

// 导出功能
const btnLoading = ref(false);
const exportEvent = async () => {
  const form = cloneDeep(await gridApi.formApi.getValues());
  if (isObjectEmpty(form)) {
    ElMessage.error('请选择导出条件并查询数据');
    return;
  }
  try {
    btnLoading.value = true;
    const exportUrl = await OrderFjxExportApi(
      {
        customer: form.customerIds?.join(','),
        consignTime: form.consignTime
          ? `${moment(`${form.consignTime} 00:00:00`).valueOf()}`
          : '',
        endTime: form.endTime
          ? `${moment(`${form.endTime} 23:59:59`).valueOf()}`
          : '',
        ...form,
        type: 2,
        tags: form.tags?.join(',') || null,
        zt: 1,
      },
      {
        beginTime: form.rangerDate?.[0]
          ? `${moment(form.rangerDate?.[0]).valueOf()}`
          : '',
        endTime: form.rangerDate?.[1]
          ? `${moment(form.rangerDate?.[1]).valueOf()}`
          : '',
      },
    );
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
  <Page title="附加险直投订单查询">
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
          <ElLink type="primary" class="mr-2" @click="orderDetail(row.id)">
            订单详情
          </ElLink>
          <ElLink
            v-if="row.person?.id"
            type="primary"
            class="mr-2"
            @click="policyDetail(row.person.id)"
          >
            保单详情
          </ElLink>
          <ElLink
            v-if="row.person?.pdfurl && isPdfUrl(row.person.pdfurl)"
            type="primary"
            @click="downloadPdf(row.person.pdfurl)"
          >
            保单下载
          </ElLink>
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
