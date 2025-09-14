<script lang="ts" setup>
import type { FormInstance, FormRules } from 'element-plus';

import type { VxeUploadPropTypes } from '@vben/plugins/vxe-table';

import { inject, reactive, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { VxeUpload } from '@vben/plugins/vxe-table';

import {
  ElDatePicker,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElOption,
  ElRadioButton,
  ElRadioGroup,
  ElSelect,
  ElTag,
} from 'element-plus';
import moment from 'moment';

import {
  AgreementAddApi,
  AgreementGetApi,
  AgreementUpdateApi,
} from '#/api/core/agreement';
import { CustomerListApi } from '#/api/core/customer';
import { requestClient } from '#/api/request';

interface AgreementForm {
  id?: string;
  attachs: string;
  attachsList?: {
    name: string;
    url: string;
  }[];
  code?: string;
  created?: number | string;
  customerId: number | string;
  customerName?: string;
  name?: string;
  remark?: string;
  startTime?: number | string;
  endTime?: number | string;
  validStatus?: number;
  expired?: number;
}

const emit = defineEmits(['reloadList']);
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

const rules = reactive<FormRules<AgreementForm>>({
  name: [
    {
      required: true,
      message: '请输入协议名称',
      trigger: 'blur',
    },
  ],
  startTime: [
    {
      required: true,
      message: '请选择起效时间',
      trigger: 'blur',
    },
  ],
  endTime: [
    {
      required: true,
      message: '请选择失效时间',
      trigger: 'blur',
    },
  ],
  remark: [
    {
      required: true,
      message: '请输入备注',
      trigger: 'blur',
    },
  ],
  customerId: [
    {
      required: true,
      message: '请选择客户',
      trigger: 'change',
    },
  ],
  validStatus: [
    {
      required: true,
      message: '请选择账户状态',
      trigger: 'blur',
    },
  ],
  attachsList: [
    {
      required: true,
      message: '请上传协议文件',
      trigger: 'blur',
    },
  ],
});

const id = ref<string>('');
const loading = ref(false);

const getAgreementDetail = async (id: number | string) => {
  const {
    customerName,
    customerId,
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
  agreementForm.customerId = Number(customerId);
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
  onConfirm() {
    agreementSubmit(agreementFormRef.value);
  },
  async onOpenChange(isOpen: boolean) {
    if (isOpen) {
      loading.value = true;
      const { id: agreementId } = modalApi.getData<Record<string, any>>();
      id.value = agreementId;

      if (agreementId) {
        modalApi.setState({ title: '编辑协议' });
        getAgreementDetail(agreementId);
      }
      await getCustomerList();
      loading.value = false;
    }
  },
  title: '新建协议',
  cancelText: '关闭',
});

const back = () => {
  modalApi.close();
};

const customerListOptions = ref<{ label: string; value: string }[]>([]);
async function getCustomerList() {
  const { list } = await CustomerListApi(
    {},
    {
      page: 1,
      size: 2000,
    },
  );
  customerListOptions.value = list.map((item) => ({
    label: item.username,
    value: item.id,
  }));
}

function resetForm(formEl: FormInstance | undefined) {
  if (!formEl) return;
  formEl.resetFields();
}

const parentPreviewMethod = inject('previewMethod');

const previewMethod: VxeUploadPropTypes.PreviewMethod = async (params) => {
  if (parentPreviewMethod) {
    return (parentPreviewMethod as Function)(params);
  }
};

const uploadMethod: VxeUploadPropTypes.UploadMethod = async ({ file }) => {
  const url = await requestClient.upload('/member/uploadPicture', { file });
  return {
    name: file.name,
    url,
  };
};

const startChange = (val: any, form: AgreementForm) => {
  if (moment(form.startTime).valueOf() > moment(form.endTime).valueOf()) {
    ElMessage.error('起效时间不能晚于终止时间');
    form.startTime = '';
  }
};

const endChange = (val: any, form: AgreementForm) => {
  if (moment(form.endTime).valueOf() < moment(form.startTime).valueOf()) {
    ElMessage.error('终止时间不能早于起效时间');
    form.endTime = '';
  }
};

async function agreementSubmit(formEl: FormInstance | undefined) {
  if (!formEl) return;
  await formEl.validate(async (valid, fields) => {
    if (valid) {
      agreementForm.attachs = JSON.stringify(agreementForm.attachsList);
      if (id.value) {
        await AgreementUpdateApi({
          ...agreementForm,
          id: id.value,
        });
        ElMessage.success('更新成功');
      } else {
        delete agreementForm.id;
        await AgreementAddApi(agreementForm);
        ElMessage.success('创建成功');
      }
      emit('reloadList');
      resetForm(formEl);
      id.value = '';
      back();
    } else {
      console.error('error submit!', fields);
    }
  });
}
</script>
<template>
  <Modal>
    <div class="p-4 pb-0" v-loading="loading">
      <ElForm
        ref="agreementFormRef"
        :model="agreementForm"
        class="demo-agreementForm"
        label-width="auto"
        :rules="rules"
        status-icon
      >
        <ElFormItem label="协议编号">
          <ElInput
            v-model="agreementForm.code"
            readonly
            placeholder="保存后自动生成"
          />
        </ElFormItem>
        <ElFormItem label="所属客户" prop="customerId">
          <ElSelect
            class="min-w-full"
            v-model="agreementForm.customerId"
            placeholder="请选择所属客户"
            style="width: 240px"
          >
            <ElOption
              v-for="item in customerListOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="协议名称" prop="name">
          <ElInput v-model="agreementForm.name" placeholder="请输入协议名称" />
        </ElFormItem>
        <ElFormItem label="起效时间" prop="startTime">
          <ElDatePicker
            class="min-w-full"
            v-model="agreementForm.startTime"
            placeholder="请选择起效时间"
            type="date"
            @change="(val: any) => startChange(val, agreementForm)"
          />
        </ElFormItem>
        <ElFormItem label="终止时间" prop="endTime">
          <ElDatePicker
            class="min-w-full"
            v-model="agreementForm.endTime"
            placeholder="请选择终止时间"
            type="date"
            @change="(val: any) => endChange(val, agreementForm)"
          />
        </ElFormItem>
        <ElFormItem label="备注" prop="remark">
          <ElInput v-model="agreementForm.remark" placeholder="请输入备注" />
        </ElFormItem>
        <ElFormItem label="状态" prop="validStatus">
          <ElTag
            v-if="agreementForm.expired === 1"
            effect="dark"
            type="warning"
          >
            到期
          </ElTag>
          <ElRadioGroup v-model="agreementForm.validStatus" v-else>
            <ElRadioButton :value="1" label="生效" />
            <ElRadioButton :value="0" label="失效" />
          </ElRadioGroup>
        </ElFormItem>
        <ElFormItem label="附件" prop="attachsList">
          <VxeUpload
            class="w-full"
            multiple
            v-model="agreementForm.attachsList"
            :more-config="{ layout: 'horizontal' }"
            :limit-size="20"
            :file-types="['pdf']"
            :upload-method="uploadMethod"
            :preview-method="previewMethod"
          />
        </ElFormItem>
      </ElForm>
    </div>
  </Modal>
</template>
