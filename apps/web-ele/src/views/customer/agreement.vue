<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeGridProps, VxeUploadPropTypes } from '#/adapter/vxe-table';

import { provide, ref, watch } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';
import { VxeUpload } from '@vben/plugins/vxe-table';

import VueOfficePdf from '@vue-office/pdf';
import { useDebounceFn, useWindowSize } from '@vueuse/core';
import { ElButton, ElLink, ElMessage, ElMessageBox, ElTag } from 'element-plus';
import moment from 'moment';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { AgreementDelApi, AgreementListApi } from '#/api/core/agreement';
import { CustomerListApi } from '#/api/core/customer';
import { replaceUrlWithCurrentDomain } from '#/utils/formatPdfUrl';

import agreementDetailModal from './components/AgreementDetailModal.vue';
import agreementEditModal from './components/AgreementEditModal.vue';

interface AgreementType {
  id?: string;
  attachs: string;
  attachsList?: {
    name: string;
    url: string;
  }[];
  code: string;
  created: string;
  customerId: string;
  customerName: string;
  name: string;
  remark: string;
  startTime: string;
  endTime: string;
  validStatus: number;
  expired?: number;
}

// const shortcuts = [
//   {
//     text: '最近一周',
//     value: () => {
//       const end = new Date();
//       const start = new Date();
//       start.setTime(start.getTime() - 3600 * 1000 * 24 * 7);
//       return [start, end];
//     },
//   },
//   {
//     text: '最近一个月',
//     value: () => {
//       const end = new Date();
//       const start = new Date();
//       start.setTime(start.getTime() - 3600 * 1000 * 24 * 30);
//       return [start, end];
//     },
//   },
//   {
//     text: '最近三个月',
//     value: () => {
//       const end = new Date();
//       const start = new Date();
//       start.setTime(start.getTime() - 3600 * 1000 * 24 * 90);
//       return [start, end];
//     },
//   },
// ];

const expiredCount = ref(0);

const formOptions: VbenFormProps = {
  schema: [
    {
      component: 'ApiSelect',
      fieldName: 'customerId',
      // fieldName: 'customerIds',
      label: '所属公司',
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
        placeholder: '请输入协议编号',
        allowClear: true,
      },
      fieldName: 'code',
      label: '协议编号',
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入协议名称',
        allowClear: true,
      },
      fieldName: 'name',
      label: '协议名称',
    },
    {
      component: 'DatePicker',
      fieldName: 'startTime',
      label: '起效日期',
      componentProps: {
        allowClear: true,
        valueFormat: 'YYYY-MM-DD',
        placeholder: '请选择',
        style: 'width: 100%',
      },
    },
    {
      component: 'DatePicker',
      fieldName: 'endTime',
      label: '终止日期',
      componentProps: {
        allowClear: true,
        valueFormat: 'YYYY-MM-DD',
        placeholder: '请选择',
        style: 'width: 100%',
      },
    },
    {
      component: 'Select',
      componentProps: {
        clearable: true,
        options: [
          {
            key: 1,
            label: '生效',
            value: 1,
          },
          {
            key: 0,
            label: '失效',
            value: 0,
          },
        ],
        placeholder: '请选择',
      },
      fieldName: 'validStatus',
      label: '状态',
    },
    // {
    //   component: 'Select',
    //   componentProps: {
    //     clearable: true,
    //     options: [
    //       {
    //         key: 1,
    //         label: '是',
    //         value: 1,
    //       },
    //       {
    //         key: 0,
    //         label: '否',
    //         value: 0,
    //       },
    //     ],
    //     placeholder: '请选择',
    //   },
    //   fieldName: 'tag',
    //   label: '即将到期',
    // },
    // {
    //   component: 'DatePicker',
    //   fieldName: 'rangerDate',
    //   label: '创建时间',
    //   componentProps: {
    //     allowClear: true,
    //     type: 'datetimerange',
    //     clearable: true,
    //     rangeSeparator: '至',
    //     startPlaceholder: '开始时间',
    //     endPlaceholder: '结束时间',
    //     valueFormat: 'YYYY-MM-DD HH:mm:ss',
    //     dateFormat: 'YYYY-MM-DD',
    //     timeFormat: 'HH:mm:ss',
    //     shortcuts,
    //   },
    //   formItemClass: 'col-span-2',
    // },
  ],
  showCollapseButton: false,
  submitButtonOptions: {
    content: '查询',
  },
  submitOnEnter: false,
  customizeButtonShow: true,
  customizeButtonOptions: {
    content: '即将到期',
    get count() {
      return expiredCount.value;
    },
  },
  handleCustomize: async () => {
    // await gridApi.formApi.setFieldValue('tag', 1);
    gridApi.query({ tag: 1 });
  },
};

const gridOptions: VxeGridProps<AgreementType> = {
  columns: [
    { field: 'id', title: 'ID.', width: 50 },
    {
      field: 'code',
      title: '协议编号',
      width: 180,
    },
    { field: 'customerName', title: '客户名称', minWidth: 180 },
    {
      field: 'created',
      title: '创建时间',
      width: 180,
      formatter: ({ row }) =>
        row.created ? moment(row.created).format('YYYY-MM-DD HH:ss:mm') : '',
    },
    {
      field: 'name',
      title: '协议名称',
      editRender: {},
      minWidth: 180,
    },
    {
      field: 'startTime',
      title: '起效时间',
      editRender: {},
      width: 150,
      formatter: ({ row }) =>
        row.startTime ? moment(row.startTime).format('YYYY-MM-DD') : '',
    },
    {
      field: 'endTime',
      title: '终止时间',
      editRender: {},
      width: 150,
      formatter: ({ row }) =>
        row.endTime ? moment(row.endTime).format('YYYY-MM-DD') : '',
    },
    {
      field: 'remark',
      title: '备注',

      editRender: {},
      minWidth: 250,
    },
    {
      field: 'validStatus',
      title: '状态',
      editRender: {},
      slots: { default: 'validStatus' },
      width: 120,
    },
    {
      field: 'attachs',
      title: '附件',
      minWidth: 340,
      slots: { default: 'edit_attachs' },
    },
    {
      field: 'action',
      slots: { default: 'operate' },
      title: '操作',
      width: 120,
      fixed: 'right',
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
        const data = await AgreementListApi(
          {
            customerId: formValues.customerIds?.join(','),
            addr: JSON.stringify(formValues.addrIds),
            ...formValues,
          },
          {
            page: page.currentPage,
            size: page.pageSize,
            startTime: formValues.startTime
              ? moment(formValues.startTime).valueOf()
              : '',
            endTime: formValues.endTime
              ? moment(formValues.endTime).valueOf()
              : '',
            tag: formValues.tag,
            // startTime: formValues.rangerDate?.[0]
            //   ? moment(formValues.rangerDate?.[0]).valueOf()
            //   : '',
            // endTime: formValues.rangerDate?.[1]
            //   ? moment(formValues.rangerDate?.[1]).valueOf()
            //   : '',
          },
        );

        data.list.forEach((item) => {
          item.attachsList = JSON.parse(item.attachs);
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
      height: height.value + 90,
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

const getExpiredCount = async () => {
  const { total } = await AgreementListApi(
    {},
    {
      tag: '1',
      page: 1,
      size: 1,
    },
  );

  expiredCount.value = total;
};

getExpiredCount();

const [AgreementDetailModal, AgreementDetailModalApi] = useVbenModal({
  connectedComponent: agreementDetailModal,
  closeOnClickModal: false,
  draggable: true,
});

const detail = (id: number) => {
  AgreementDetailModalApi.setData({ id });
  AgreementDetailModalApi.open();
};

const [AgreementEditModal, AgreementEditModalApi] = useVbenModal({
  connectedComponent: agreementEditModal,
  closeOnClickModal: false,
  draggable: true,
});

const editAgreement = (id: number) => {
  AgreementEditModalApi.setData({ id });
  AgreementEditModalApi.open();
};

function openModal() {
  AgreementEditModalApi.setData({ id: '' });
  AgreementEditModalApi.open();
}

const delStop = (id: number) => {
  ElMessageBox.confirm('确定要删除此客户协议吗？', '重要提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    await AgreementDelApi(id);
    gridApi.reload();
    ElMessage.success('删除成功');
  });
};

const previewPdfUrl = ref('');
const previewVisible = ref(false);
const previewList = ref<string[]>();

const isImage = (url: string) => {
  if (!url) return false;
  const extname = url!.split('.').pop()!.toLowerCase();
  const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'bmp'];

  return imageExtensions.includes(extname);
};

const isPDF = (url: string) => {
  if (!url) return false;
  const mimeType = url!.split('.').pop()!.toLowerCase();
  const pdfMimeType = 'pdf';

  return mimeType === pdfMimeType;
};

const [Modal, modalApi] = useVbenModal({
  draggable: true,
  showConfirmButton: false,
  cancelText: '关闭',
  zIndex: 999_999,
});

const previewMethod: VxeUploadPropTypes.PreviewMethod = async ({ option }) => {
  const url: string = option.url;
  if (isImage(url)) {
    previewList.value = [url];
    previewVisible.value = true;
  } else if (isPDF(url)) {
    loading.value = true;
    previewPdfUrl.value = replaceUrlWithCurrentDomain(url);
    modalApi.open();
  } else {
    return ElMessage.error('此文件类型不支持预览');
  }
};

const renderedHandler = () => {
  loading.value = false;
};
const errorHandler = () => {
  loading.value = false;
  console.error('渲染失败');
};

provide('previewMethod', previewMethod);

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

const loading = ref(false);

const handleReloadList = () => {
  gridApi.query();
};
</script>

<template>
  <Page title="客户协议">
    <template #extra>
      <ElButton type="primary" @click="openModal">新建</ElButton>
    </template>

    <div class="vp-raw w-full">
      <Grid>
        <template #edit_attachs="{ row }">
          <VxeUpload
            readonly
            multiple
            v-model="row.attachsList"
            :more-config="{ maxCount: 1, layout: 'horizontal' }"
            :preview-method="previewMethod"
          />
        </template>

        <template #validStatus="{ row }">
          <ElTag v-if="row.expired === 1" effect="dark" type="warning">
            到期
          </ElTag>
          <ElTag v-else-if="row.validStatus === 1" effect="dark" type="success">
            生效
          </ElTag>
          <ElTag v-else effect="dark" type="danger">失效</ElTag>
        </template>

        <template #operate="{ row }">
          <ElLink class="mr-2" type="primary" @click="detail(row.id)">
            详情
          </ElLink>
          <ElLink class="mr-2" type="primary" @click="editAgreement(row.id)">
            编辑
          </ElLink>
          <ElLink type="primary" @click="delStop(row.id)"> 删除 </ElLink>
        </template>
      </Grid>
    </div>

    <AgreementDetailModal />
    <AgreementEditModal @reload-list="handleReloadList" />

    <div v-loading="loading">
      <Modal class="w-[80%]" title="文件预览">
        <VueOfficePdf
          :src="previewPdfUrl"
          @error="errorHandler"
          @rendered="renderedHandler"
        />
      </Modal>
    </div>
  </Page>
</template>
