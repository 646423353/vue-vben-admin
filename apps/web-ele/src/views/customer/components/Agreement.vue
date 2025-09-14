<script lang="ts" setup>
import type { VxeUploadPropTypes } from '@vben/plugins/vxe-table';

import type { VxeGridProps } from '#/adapter/vxe-table';

import { onMounted, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { VxeUpload } from '@vben/plugins/vxe-table';

import VueOfficePdf from '@vue-office/pdf';
import {
  ElButton,
  ElDatePicker,
  ElInput,
  ElLink,
  ElMessage,
  ElSwitch,
  ElTag,
} from 'element-plus';
import moment from 'moment';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  AgreementAddApi,
  AgreementListApi,
  AgreementUpdateApi,
} from '#/api/core/agreement';
import { requestClient } from '#/api/request';
import { replaceUrlWithCurrentDomain } from '#/utils/formatPdfUrl';

export interface AgreementParams {
  id?: string;
  attachs: string;
  attachsList?: {
    name: string;
    url: string;
  }[];
  code: string;
  created: number | string;
  customerId: string;
  customerName: string;
  name: string;
  remark: string;
  startTime: string;
  endTime: string;
  validStatus: number;
  expired?: number;
}

interface Props {
  list?: AgreementParams[];
  customerId?: string;
  customerName?: string;
  preview?: boolean;
}

const props = defineProps<Props>();

const gridOptions: VxeGridProps<AgreementParams> = {
  columns: [
    { type: 'seq', width: 70 },
    {
      field: 'code',
      title: '协议编号',
      slots: { edit: 'edit_code', default: 'code' },
      width: 180,
    },
    { field: 'customerName', title: '客户名称', minWidth: 180 },
    {
      field: 'created',
      title: '创建时间',
      width: 180,
      formatter: ({ row }) =>
        row.created ? moment(row.created).format('YYYY-MM-DD HH:ss:mm') : '',
      visible: props.preview,
    },
    {
      field: 'name',
      title: '协议名称',
      editRender: {},
      slots: { edit: 'edit_name' },
      minWidth: 180,
    },
    {
      field: 'startTime',
      title: '起效时间',
      editRender: {},
      slots: { edit: 'edit_begin' },
      width: props.preview ? 150 : 240,
      formatter: ({ row }) =>
        row.startTime ? moment(row.startTime).format('YYYY-MM-DD') : '',
    },
    {
      field: 'endTime',
      title: '终止时间',
      editRender: {},
      slots: { edit: 'edit_end' },
      width: props.preview ? 150 : 240,
      formatter: ({ row }) =>
        row.endTime ? moment(row.endTime).format('YYYY-MM-DD') : '',
    },
    {
      field: 'remark',
      title: '备注',

      editRender: {},
      slots: { edit: 'edit_remark' },
      minWidth: 250,
    },
    {
      field: 'validStatus',
      title: '状态',
      editRender: {},
      slots: { edit: 'edit_status', default: 'validStatus' },
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
      slots: { default: 'action' },
      title: '操作',
      width: 120,
      fixed: 'right',
    },
  ],
  editRules: {
    name: [{ required: true, message: '协议名称不能为空' }],
    startTime: [{ required: true, message: '起效时间不能为空' }],
    endTime: [{ required: true, message: '终止时间不能为空' }],
    remark: [{ required: true, message: '备注不能为空' }],
    attachsList: [{ required: true, message: '请上传附件' }],
  },
  editConfig: {
    mode: 'row',
    trigger: 'click',
    autoClear: false,
    enabled: !props.preview,
  },
  pagerConfig: {
    enabled: false,
  },
  data: [],
  showOverflow: true,
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

function hasEditStatus(row: AgreementParams) {
  return gridApi.grid?.isEditByRow(row);
}

function editRowEvent(row: AgreementParams) {
  gridApi.grid?.setEditRow(row);
}

async function saveRowEvent(row: AgreementParams) {
  if (!row.name) return ElMessage.error('请输入协议名称');
  if (!row.startTime) return ElMessage.error('请选择起效时间');
  if (!row.endTime) return ElMessage.error('请选择终止时间');
  if (!row.remark) return ElMessage.error('请输入备注');
  if (!row.attachsList?.length) return ElMessage.error('请上传附件');
  await gridApi.grid?.clearEdit();
}

const cancelRowEvent = (_row: AgreementParams) => {
  gridApi.grid?.clearEdit();
};

const getAgreementList = async () => {
  const { list } = await AgreementListApi(
    {
      customerId: props.customerId,
    },
    {
      page: 1,
      size: 2000,
    },
  );

  const $grid = gridApi.grid;
  list.forEach((item: AgreementParams) => {
    item.customerName = props.customerName as string;
    item.attachsList = JSON.parse(item.attachs);
  });
  await $grid.insert(list);
};

const pushEvent = async () => {
  const $grid = gridApi.grid;
  if ($grid) {
    const record = {
      code: '',
      customerId: props.customerId as string,
      customerName: props.customerName as string,
      name: '',
      remark: '',
      startTime: '',
      endTime: '',
      validStatus: 1,
    };
    const { row: newRow } = await $grid.insertAt(record, -1);
    $grid.setEditRow(newRow);
  }
};

const uploadMethod: VxeUploadPropTypes.UploadMethod = async ({ file }) => {
  const url = await requestClient.upload('/member/uploadPicture', { file });
  return {
    name: file.name,
    url,
  };
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
});

const previewMethod: VxeUploadPropTypes.PreviewMethod = async ({ option }) => {
  const url: string = option.url;
  if (isImage(url)) {
    previewList.value = [url];
    previewVisible.value = true;
  } else if (isPDF(url)) {
    previewPdfUrl.value = replaceUrlWithCurrentDomain(url);
    modalApi.open();
  } else {
    return ElMessage.error('此文件类型不支持预览');
  }
};

const renderedHandler = () => {};
const errorHandler = () => {
  console.error('渲染失败');
};

const startChange = (val: any, row: AgreementParams) => {
  if (moment(row.startTime).valueOf() > moment(row.endTime).valueOf()) {
    ElMessage.error('起效时间不能晚于终止时间');
    row.startTime = '';
  }
};

const endChange = (val: any, row: AgreementParams) => {
  if (moment(row.endTime).valueOf() < moment(row.startTime).valueOf()) {
    ElMessage.error('终止时间不能早于起效时间');
    row.endTime = '';
  }
};

// const removeSelectEvent = async () => {
//   const $grid = gridApi.grid;
//   if ($grid) {
//     const selectRecords = $grid.getCheckboxRecords();
//     if (selectRecords.length > 0) {
//       $grid.removeCheckboxRow();
//       ElMessage.success('已删除选中');
//     } else {
//       ElMessage.info('未选择数据');
//     }
//   }
// };

const getData = () => {
  const $grid = gridApi.grid;
  if ($grid) {
    const data = $grid.getInsertRecords();
    data.forEach((item: AgreementParams) => {
      item.attachs = JSON.stringify(item.attachsList);
    });
    return data;
  }
};

async function fullValidEvent() {
  const $grid = gridApi.grid;
  if ($grid) {
    const errMap = await $grid.fullValidate(true);
    if (errMap) {
      return false;
    } else {
      await gridApi.grid?.clearEdit();
      return true;
    }
  }
}

const agreementAdd = async () => {
  const agreementData = getData();

  agreementData?.forEach(async (item: AgreementParams) => {
    item.attachs = JSON.stringify(item.attachsList);
    if (item.id) {
      await AgreementUpdateApi(item);
    } else {
      delete item.id;
      await AgreementAddApi(item);
    }
  });
};

defineExpose({
  fullValidEvent,
  getData,
  agreementAdd,
});

onMounted(() => {
  const $grid = gridApi.grid;
  setTimeout(async () => {
    if (props.customerId) {
      getAgreementList();
    }

    if (props.preview) {
      $grid.hideColumn('action');
    }
  }, 500);
});
</script>

<template>
  <div>
    <div v-if="!props.preview" class="mb-4">
      <ElButton type="primary" @click="pushEvent"> 新增 </ElButton>
      <!-- <ElButton type="danger" @click="removeSelectEvent"> 批量删除 </ElButton> -->
    </div>
    <Grid>
      <template #edit_code> 保存后自动生成 </template>
      <template #code="{ row }"> {{ row.code || '保存后自动生成' }} </template>

      <template #edit_name="{ row }">
        <ElInput v-model="row.name" placeholder="请输入" />
      </template>

      <template #edit_begin="{ row }">
        <ElDatePicker
          v-model="row.startTime"
          placeholder="请选择"
          type="date"
          @change="(val: any) => startChange(val, row)"
        />
      </template>

      <template #edit_end="{ row }">
        <ElDatePicker
          v-model="row.endTime"
          placeholder="请选择"
          type="date"
          @change="(val: any) => endChange(val, row)"
        />
      </template>

      <template #edit_remark="{ row }">
        <ElInput v-model="row.remark" placeholder="请输入" />
      </template>

      <template #edit_attachs="{ row }">
        <VxeUpload
          :readonly="props.preview"
          multiple
          v-model="row.attachsList"
          :more-config="{ maxCount: 1, layout: 'horizontal' }"
          :limit-size="20"
          :file-types="['pdf']"
          :upload-method="uploadMethod"
          :preview-method="previewMethod"
        />
      </template>

      <template #edit_status="{ row }">
        <ElTag v-if="row.expired === 1" effect="dark" type="warning">
          到期
        </ElTag>
        <ElSwitch
          v-model="row.validStatus"
          :active-value="1"
          :inactive-value="0"
          active-text="生效"
          inactive-text="失效"
          inline-prompt
          v-else
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

      <template #action="{ row }">
        <template v-if="hasEditStatus(row)">
          <ElLink class="mr-2" type="primary" @click="saveRowEvent(row)">
            保存
          </ElLink>
          <ElLink v-if="row.id" type="info" @click="cancelRowEvent(row)">
            取消
          </ElLink>
        </template>
        <template v-else>
          <ElLink type="primary" @click="editRowEvent(row)"> 编辑 </ElLink>
        </template>
      </template>
    </Grid>

    <Modal class="w-[80%]" title="文件预览">
      <VueOfficePdf
        :src="previewPdfUrl"
        @error="errorHandler"
        @rendered="renderedHandler"
      />
    </Modal>
  </div>
</template>
