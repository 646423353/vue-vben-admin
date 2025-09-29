<script lang="ts" setup>
import type { FormInstance, UploadFiles, UploadProps } from 'element-plus';

import { reactive, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import {
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElOption,
  ElSelect,
  ElTag,
  ElUpload,
} from 'element-plus';

import { InsureGetApi } from '#/api/core/insure';

interface InsureForm {
  cate: number;
  ordertype: string;
  money: string;
  days: string;
  ticketCompany: string;
  emails: string;
  sendPeriod: string;
  sendType: string;
  fileUrl: string;
  fileUrlList?: undefined | UploadFiles;
  status: number;
  productCode: string;
}

const emit = defineEmits(['showPdf']);
const insureFormRef = ref<FormInstance>();
const insureForm = reactive<InsureForm>({
  cate: 0,
  ordertype: '',
  money: '',
  days: '',
  ticketCompany: '',
  emails: '',
  sendPeriod: '',
  sendType: '',
  fileUrl: '',
  status: 1,
  productCode: '',
});

const id = ref<string>('');

const getInsureDetail = async (id: number | string) => {
  const {
    cate,
    ordertype,
    money,
    days,
    ticketCompany,
    emails,
    sendPeriod,
    sendType,
    fileUrl,
    status,
  } = await InsureGetApi(id);

  insureForm.cate = cate;
  insureForm.ordertype = ordertype;
  insureForm.money = money;
  insureForm.days = days.toString();
  insureForm.ticketCompany = ticketCompany.toString();
  insureForm.emails = emails;
  insureForm.sendPeriod = sendPeriod.toString();
  insureForm.sendType = sendType.toString();
  insureForm.fileUrl = fileUrl;
  insureForm.fileUrlList = JSON.parse(fileUrl || '[]');
  insureForm.status = status;
};

const [Modal, modalApi] = useVbenModal({
  onCancel() {
    resetForm(insureFormRef.value);
    id.value = '';
    modalApi.close();
  },
  onOpenChange(isOpen: boolean) {
    if (isOpen) {
      const { id: uid } = modalApi.getData<Record<string, any>>();
      id.value = uid;
      if (uid) {
        getInsureDetail(uid);
      }
    }
  },
  title: '方案详情',
  showConfirmButton: false,
  cancelText: '关闭',
});

function resetForm(formEl: FormInstance | undefined) {
  if (!formEl) return;
  formEl.resetFields();
}

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

interface FileResponse {
  result: string;
}

const handlePreview: UploadProps['onPreview'] = (file) => {
  const url: string = (file.response as FileResponse).result;
  if (isImage(url)) {
    // previewImageUrl = url;
  } else if (isPDF(url)) {
    emit('showPdf', url);
  } else {
    return ElMessage.error('此文件类型不支持预览');
  }
};
</script>
<template>
  <Modal>
    <div class="p-4 pb-0">
      <ElForm
        ref="insureFormRef"
        :model="insureForm"
        class="demo-insureForm"
        label-width="auto"
        status-icon
      >
        <ElFormItem label="方案名称">
          <ElInput v-model="insureForm.ordertype" readonly />
        </ElFormItem>
        <ElFormItem label="方案价格">
          <ElInput v-model="insureForm.money" readonly type="number">
            <template #prefix> ￥ </template>
            <template #suffix> 元 </template>
          </ElInput>
        </ElFormItem>
        <ElFormItem label="单价单位">
          <ElSelect v-model="insureForm.days" disabled>
            <ElOption label="人 / 月" value="30" />
            <ElOption label="人 / 日" value="1" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="保险公司产品编码">
          <ElInput v-model="insureForm.productCode" readonly />
        </ElFormItem>
        <ElFormItem label="开票单位">
          <ElSelect v-model="insureForm.ticketCompany" disabled>
            <ElOption label="领耀" value="1" />
            <ElOption label="都邦" value="2" />
            <ElOption label="崇法" value="3" />
            <ElOption label="铂塔" value="4" />
            <ElOption label="沛沁" value="5" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="对接邮箱">
          <ElInput
            v-model="insureForm.emails"
            :autosize="{ minRows: 4 }"
            readonly
            resize="none"
            type="textarea"
          />
        </ElFormItem>
        <ElFormItem label="发送时间">
          <ElSelect v-model="insureForm.sendPeriod" disabled>
            <ElOption label="每日 晚上08点00分" value="1" />
            <ElOption label="每日 晚上23点50分" value="2" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="发送类型">
          <ElSelect v-model="insureForm.sendType" disabled>
            <ElOption label="增减员" value="1" />
            <ElOption label="全量" value="2" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="方案文件">
          <ElUpload
            :file-list="insureForm.fileUrlList"
            :on-preview="handlePreview"
            class="w-full"
          />
        </ElFormItem>
        <ElFormItem label="状态">
          <ElTag v-if="insureForm.status === 1" effect="dark" type="success">
            可用
          </ElTag>
          <ElTag v-else effect="dark" type="danger">不可用</ElTag>
        </ElFormItem>
      </ElForm>
    </div>
  </Modal>
</template>

<style scoped>
:deep(.el-upload.el-upload--text) {
  display: none;
}

:deep(.el-upload-list) {
  margin-top: 0;
}
</style>
