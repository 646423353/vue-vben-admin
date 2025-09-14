<script lang="ts" setup>
import type { FormInstance } from 'element-plus';

import type { VxeUploadPropTypes } from '@vben/plugins/vxe-table';

import { inject, reactive, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { VxeUpload } from '@vben/plugins/vxe-table';

import { ElForm, ElFormItem, ElInput, ElTag } from 'element-plus';
import moment from 'moment';

import { AgreementGetApi } from '#/api/core/agreement';

interface AgreementForm {
  id?: string;
  attachs: string;
  attachsList?: {
    name: string;
    url: string;
  }[];
  code?: string;
  created?: number | string;
  customerId: string;
  customerName?: string;
  name?: string;
  remark?: string;
  startTime?: number | string;
  endTime?: number | string;
  validStatus?: number;
  expired?: number;
}

const agreementFormRef = ref<FormInstance>();
const agreementForm = reactive<AgreementForm>({
  id: '',
  attachs: '',
  attachsList: [],
  code: '',
  created: '',
  customerId: '',
  customerName: '',
  name: '',
  remark: '',
  startTime: '',
  endTime: '',
  validStatus: 0,
  expired: 0,
});

const id = ref<string>('');

const getStopDetail = async (id: number | string) => {
  const {
    customerName,
    code,
    name,
    remark,
    startTime,
    endTime,
    validStatus,
    expired,
    created,
    attachs,
  } = await AgreementGetApi(id);

  agreementForm.customerName = customerName;
  agreementForm.code = code;
  agreementForm.name = name;
  agreementForm.remark = remark;
  agreementForm.startTime = startTime;
  agreementForm.endTime = endTime;
  agreementForm.validStatus = validStatus;
  agreementForm.expired = expired;
  agreementForm.created = created;
  agreementForm.attachsList = JSON.parse(attachs as string);
};

const [Modal, modalApi] = useVbenModal({
  onCancel() {
    resetForm(agreementFormRef.value);
    id.value = '';
    modalApi.close();
  },
  onOpenChange(isOpen: boolean) {
    if (isOpen) {
      const { id: uid } = modalApi.getData<Record<string, any>>();
      id.value = uid;
      if (uid) {
        getStopDetail(uid);
      }
    }
  },
  title: '协议详情',
  showConfirmButton: false,
  cancelText: '关闭',
});

function resetForm(formEl: FormInstance | undefined) {
  if (!formEl) return;
  formEl.resetFields();
}

// 注入预览方法
const parentPreviewMethod = inject('previewMethod');

// 修改预览方法，调用父组件的方法
const previewMethod: VxeUploadPropTypes.PreviewMethod = async (params) => {
  if (parentPreviewMethod) {
    return (parentPreviewMethod as Function)(params);
  }
};
</script>
<template>
  <Modal>
    <div class="p-4 pb-0">
      <ElForm
        ref="agreementFormRef"
        :model="agreementForm"
        class="demo-agreementForm"
        label-width="auto"
        status-icon
      >
        <ElFormItem label="协议编号">
          <ElInput v-model="agreementForm.code" readonly />
        </ElFormItem>
        <ElFormItem label="创建时间">
          <ElInput
            :value="moment(agreementForm.created).format('YYYY-MM-DD HH:mm:ss')"
            readonly
          />
        </ElFormItem>
        <ElFormItem label="客户名称">
          <ElInput v-model="agreementForm.customerName" readonly />
        </ElFormItem>
        <ElFormItem label="协议名称">
          <ElInput v-model="agreementForm.name" readonly />
        </ElFormItem>
        <ElFormItem label="起效时间">
          <ElInput
            :value="moment(agreementForm.startTime).format('YYYY-MM-DD')"
            readonly
          />
        </ElFormItem>
        <ElFormItem label="终止时间">
          <ElInput
            :value="moment(agreementForm.endTime).format('YYYY-MM-DD')"
            readonly
          />
        </ElFormItem>
        <ElFormItem label="备注">
          <ElInput v-model="agreementForm.remark" readonly />
        </ElFormItem>
        <ElFormItem label="状态">
          <ElTag
            v-if="agreementForm.expired === 1"
            effect="dark"
            type="warning"
          >
            到期
          </ElTag>
          <ElTag
            v-else-if="agreementForm.validStatus === 1"
            effect="dark"
            type="success"
          >
            生效
          </ElTag>
          <ElTag v-else effect="dark" type="danger">失效</ElTag>
        </ElFormItem>
        <ElFormItem label="附件">
          <VxeUpload
            readonly
            multiple
            v-model="agreementForm.attachsList"
            :more-config="{ layout: 'horizontal' }"
            :preview-method="previewMethod"
          />
        </ElFormItem>
      </ElForm>
    </div>
  </Modal>
</template>
