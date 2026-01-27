<script lang="ts" setup>
import type { FormInstance, FormRules, UploadUserFile } from 'element-plus';

import type { TbCasePeifuPost } from '#/api/core/case-peifu';

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

import { addCasePeifuPostApi } from '#/api/core/case-peifu';

const emit = defineEmits(['reloadList', 'success']);

interface NegotiationForm {
  status: number | string;
  content: string;
  fileList: UploadUserFile[];
}

const formRef = ref<FormInstance>();
const form = reactive<NegotiationForm>({
  status: '',
  content: '',
  fileList: [],
});

const rules = reactive<FormRules<NegotiationForm>>({
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

const commentId = ref<number | string>('');
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
      commentId.value = data.commentId;
      modalApi.setState({ title: '添加协商' });
    }
  },
  title: '添加协商',
  class: 'w-[600px]',
});

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
        const fileUrls = form.fileList.map((file) => ({
          name: file.name,
          url: (file.response as any)?.result || file.url,
        }));

        const payload: TbCasePeifuPost = {
          peifuId: commentId.value,
          method: Number(form.status),
          content: form.content,
          attatchs: fileUrls.length > 0 ? JSON.stringify(fileUrls) : undefined,
        };

        await addCasePeifuPostApi(payload);

        ElMessage.success('提交成功');
        emit('success');
        resetForm(formEl);
        modalApi.close();
      } catch (error) {
        console.error('Submit error:', error);
      } finally {
        loading.value = false;
      }
    }
  });
}

const statusOptions = [
  { label: '初步协商一致', value: 1 },
  { label: '协商异常', value: 2 },
  { label: '协商一致', value: 3 },
  { label: '无法联系', value: 4 },
  { label: '其他情况', value: 5 },
  { label: '紧急垫付', value: 6 },
];

const handleSuccess = (response: any, uploadFile: UploadUserFile) => {
  if (response.code === 200) {
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
