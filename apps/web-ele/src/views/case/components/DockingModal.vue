<script lang="ts" setup>
import type { FormInstance, FormRules, UploadUserFile } from 'element-plus';

import { reactive, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { AntdPlusOutlined } from '@vben/icons';

import {
  ElForm,
  ElFormItem,
  ElIcon,
  ElInput,
  ElMessage,
  ElOption,
  ElSelect,
  ElUpload,
} from 'element-plus';

import { CaseCommentAddApi } from '#/api/core/case';

const emit = defineEmits(['reloadList']);

interface DockingForm {
  status: number | string;
  content: string;
  fileList: UploadUserFile[];
}

const formRef = ref<FormInstance>();
const form = reactive<DockingForm>({
  status: '',
  content: '',
  fileList: [],
});

const rules = reactive<FormRules<DockingForm>>({
  status: [
    {
      required: true,
      message: '请选择动作',
      trigger: 'change',
    },
  ],
  content: [
    {
      required: true,
      message: '请输入具体说明',
      trigger: 'blur',
    },
  ],
});

const caseId = ref<number | string>('');
const loading = ref<boolean>(false);
const uploadUrl = import.meta.env.VITE_UPLOAD_URL;

const [Modal, modalApi] = useVbenModal({
  onCancel() {
    resetForm(formRef.value);
    modalApi.close();
  },
  onConfirm() {
    submitForm(formRef.value);
  },
  onOpenChange(isOpen: boolean) {
    if (isOpen) {
      const data = modalApi.getData<Record<string, any>>();
      caseId.value = data.caseId;
      modalApi.setState({ title: '添加对接' });
    }
  },
  title: '添加对接',
  class: 'w-[600px]',
});

const back = () => {
  modalApi.close();
};

function resetForm(formEl: FormInstance | undefined) {
  if (!formEl) return;
  formEl.resetFields();
  form.fileList = [];
}

async function submitForm(formEl: FormInstance | undefined) {
  if (!formEl) return;
  await formEl.validate(async (valid) => {
    if (valid) {
      loading.value = true;
      try {
        // Extract file URLs from the file list
        // Assuming the backend expects a comma-separated string or specific field for attachments
        // Based on CaseApi.CommentInfo, there are specific picture fields like accidentPicture etc.
        // But for a generic attachment in this modal, we might need to map it to one of them or 'otherPicture'
        // Or maybe the 'content' should include the file links if there's no specific field.
        // Given the user request image shows "添加附件 +", and the API has 'otherPicture', I'll use that.

        const fileUrls = form.fileList
          .map((file) => (file.response as any)?.result || file.url)
          .filter(Boolean);

        await CaseCommentAddApi({
          caseId: caseId.value,
          status: form.status,
          content: form.content,
          otherPicture: JSON.stringify(fileUrls), // Storing as JSON string in otherPicture as a fallback/generic field
        });

        ElMessage.success('提交成功');
        emit('reloadList');
        resetForm(formEl);
        back();
      } catch (error) {
        console.error('Submit error:', error);
      } finally {
        loading.value = false;
      }
    }
  });
}

const statusOptions = [
  { label: '提交保司', value: '提交保司' },
  { label: '保司审核', value: '保司审核' },
  { label: '保司反馈', value: '保司反馈' },
  { label: '保司协商', value: '保司协商' },
  { label: '协商一致', value: '协商一致' },
  { label: '沟通异常', value: '沟通异常' },
  { label: '付款失败', value: '付款失败' },
];

const handleSuccess = (response: any, uploadFile: UploadUserFile) => {
  if (response.code === 200) {
    // Ensure the file object has the response for later extraction
    uploadFile.response = response;
  } else {
    ElMessage.error(response.message || '上传失败');
  }
};
</script>

<template>
  <Modal>
    <div class="p-6" v-loading="loading">
      <ElForm ref="formRef" :model="form" :rules="rules" label-width="100px">
        <ElFormItem label="选择动作：" prop="status">
          <ElSelect v-model="form.status" placeholder="请选择动作">
            <ElOption
              v-for="option in statusOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </ElSelect>
        </ElFormItem>

        <ElFormItem label="具体说明" prop="content">
          <ElInput
            v-model="form.content"
            type="textarea"
            :rows="4"
            placeholder="请输入具体说明"
          />
        </ElFormItem>

        <ElFormItem label="添加附件" prop="fileList">
          <ElUpload
            v-model:file-list="form.fileList"
            :action="uploadUrl"
            list-type="picture-card"
            :on-success="handleSuccess"
            multiple
          >
            <ElIcon><AntdPlusOutlined /></ElIcon>
          </ElUpload>
        </ElFormItem>
      </ElForm>
    </div>
  </Modal>
</template>

<style scoped>
:deep(.el-form-item__label) {
  font-weight: bold;
}
</style>
