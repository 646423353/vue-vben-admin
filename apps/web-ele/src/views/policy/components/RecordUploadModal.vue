<script lang="ts" setup>
import type {
  FormInstance,
  FormRules,
  UploadFile,
  UploadFiles,
  UploadProps,
} from 'element-plus';

import type { PolicyApi } from '#/api/core/policy';

import { reactive, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { UiwCloudUpload } from '@vben/icons';

import { ElForm, ElFormItem, ElInput, ElMessage, ElUpload } from 'element-plus';

import { PolicyUpdateApi } from '#/api/core/policy';

const emit = defineEmits(['reloadList', 'showPdf']);
const uploadUrl = import.meta.env.VITE_UPLOAD_URL;

interface PolicyForm extends PolicyApi.RecordUploadData {
  pdfFileList?: undefined | UploadFiles;
}

const policyFormRef = ref<FormInstance>();
const policyForm = reactive<PolicyForm>({
  id: '',
  policyNo: '',
  pdfUrl: '',
  pdfFileList: [],
});

const rules = reactive<FormRules<PolicyForm>>({
  policyNo: [
    {
      required: true,
      message: '请输入登录名',
      trigger: 'blur',
    },
  ],
  pdfFileList: [
    {
      required: true,
      message: '请上传文件',
      trigger: 'change',
    },
  ],
});

const id = ref<string>('');

const [Modal, modalApi] = useVbenModal({
  onCancel() {
    resetForm(policyFormRef.value);
    id.value = '';
    modalApi.close();
  },
  onConfirm() {
    submitForm(policyFormRef.value);
  },
  async onOpenChange(isOpen: boolean) {
    if (isOpen) {
      const { id: uid, title } = modalApi.getData<Record<string, any>>();
      id.value = uid;
      policyForm.id = uid;
      modalApi.setState({ title: `${title} - 补录上传` });
    }
  },
  title: '保单系统编号',
});

const back = () => {
  modalApi.close();
};

function resetForm(formEl: FormInstance | undefined) {
  if (!formEl) return;
  formEl.resetFields();
}

async function submitForm(formEl: FormInstance | undefined) {
  if (!formEl) return;
  await formEl.validate(async (valid, fields) => {
    if (valid) {
      policyForm.pdfUrl = JSON.stringify(policyForm.pdfFileList);
      await PolicyUpdateApi(policyForm);
      ElMessage.success('创建成功');
      emit('reloadList');
      resetForm(formEl);
      id.value = '';
      back();
    } else {
      console.error('error submit!', fields);
    }
  });
}

const beforeFileUpload: UploadProps['beforeUpload'] = async (rawFile) => {
  const validExtensions = ['pdf'];
  const validMimeTypes = ['application/pdf'];

  if (!rawFile) return false;

  const rawFileTypeName = rawFile?.name?.split('.').pop()?.toLowerCase();
  const isImageOrPdf =
    validExtensions.includes(rawFileTypeName || '') ||
    validMimeTypes.includes(rawFile.type);

  const isLt2M = rawFile.size / 1024 / 1024 < 20;

  if (!isImageOrPdf) {
    await ElMessage.error('请上传PDF格式文件');
  }
  if (!isLt2M) {
    await ElMessage.error('文件大小不能超过 20MB');
  }

  return isImageOrPdf && isLt2M;
};

const handleChange = (file: UploadFile, fileList: UploadFiles) => {
  policyForm.pdfFileList = fileList;
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
  if (isPDF(url)) {
    emit('showPdf', url);
  } else {
    return ElMessage.error('此文件类型不支持预览');
  }
};

const handleSuccess: UploadProps['onSuccess'] = ({ code, message }) => {
  if (code === 200) {
    ElMessage.success('上传成功');
  } else {
    ElMessage.error(`${message}，请重新上传`);
  }
};
</script>
<template>
  <Modal>
    <div class="p-4 pb-0">
      <ElForm
        ref="policyFormRef"
        :model="policyForm"
        :rules="rules"
        class="demo-policyForm"
        label-width="auto"
        status-icon
      >
        <ElFormItem label="保单号" prop="policyNo">
          <ElInput v-model="policyForm.policyNo" placeholder="请输入" />
        </ElFormItem>
        <ElFormItem label="保单文件" prop="pdfFileList">
          <ElUpload
            :action="uploadUrl"
            :before-upload="beforeFileUpload"
            :file-list="policyForm.pdfFileList"
            :limit="1"
            :on-change="handleChange"
            :on-preview="handlePreview"
            :on-remove="handleChange"
            :on-success="handleSuccess"
            accept=".pdf,application/pdf"
            class="w-full"
            drag
          >
            <div class="flex justify-center">
              <UiwCloudUpload class="size-10" />
            </div>
            <div class="el-upload__text">
              将文件拖到此处，或<em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">只能上传pdf文件，且不超过20mb</div>
            </template>
          </ElUpload>
        </ElFormItem>
      </ElForm>
    </div>
  </Modal>
</template>
