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

import { addCaseCommentPostApi } from '#/api/core/case-comment';

const emit = defineEmits(['success']);

interface DockingForm {
  method: number | string;
  content: string;
  fileList: UploadUserFile[];
}

const formRef = ref<FormInstance>();
const form = reactive<DockingForm>({
  method: '',
  content: '',
  fileList: [],
});

const rules = reactive<FormRules<DockingForm>>({
  method: [
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

const commentId = ref<number | string>(''); // The ID of the docking record (timeline item)
const loading = ref<boolean>(false);
const uploadUrl = import.meta.env.VITE_UPLOAD_URL;

const [Modal, modalApi] = useVbenModal({
  onCancel() {
    resetForm(formRef.value);
    modalApi.close();
  },
  onConfirm: async () => {
    await submitForm(formRef.value);
  },
  onOpenChange(isOpen: boolean) {
    if (isOpen) {
      const data = modalApi.getData<Record<string, any>>();
      // The passed ID is now the commentId (timeline record ID)
      commentId.value = data.commentId || data.caseId;
      modalApi.setState({
        title: '添加对接信息',
        confirmText: '提交',
        cancelText: '取消',
      });
    }
  },
  class: 'w-[600px]',
});

function resetForm(formEl: FormInstance | undefined) {
  if (!formEl) return;
  formEl.resetFields();
  form.fileList = [];
}

async function submitForm(formEl: FormInstance | undefined) {
  if (!formEl) return;
  try {
    await formEl.validate();
    loading.value = true;

    // 处理附件
    const attachments = form.fileList.map((file) => ({
      name: file.name,
      url: (file.response as any)?.result || file.url,
    }));

    const payload = {
      commentId: commentId.value,
      method: Number(form.method),
      content: form.content,
      attatchs:
        attachments.length > 0 ? JSON.stringify(attachments) : undefined,
    };

    await addCaseCommentPostApi(payload);

    ElMessage.success('添加成功');
    emit('success');
    modalApi.close();
    resetForm(formEl);
  } catch (error: any) {
    if (error !== false) {
      ElMessage.error(error.message || '操作失败');
    }
  } finally {
    loading.value = false;
  }
}

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
    <div class="px-4 py-2">
      <ElForm
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
        label-position="left"
        class="w-full"
      >
        <!-- 选择动作 -->
        <ElFormItem label="选择动作" prop="method">
          <ElSelect
            v-model="form.method"
            placeholder="请选择"
            style="width: 100%"
          >
            <ElOption :value="1" label="提交保司" />
            <ElOption :value="2" label="保司审核" />
            <ElOption :value="3" label="保司反馈" />
            <ElOption :value="4" label="保司协商" />
            <ElOption :value="5" label="协商一致" />
            <ElOption :value="6" label="沟通异常" />
            <ElOption :value="7" label="付款失败" />
            <ElOption :value="8" label="紧急垫付" />
          </ElSelect>
        </ElFormItem>

        <!-- 具体说明 -->
        <ElFormItem label="具体说明" prop="content">
          <ElInput
            v-model="form.content"
            type="textarea"
            :rows="6"
            placeholder="请输入具体说明内容..."
          />
        </ElFormItem>

        <!-- 添加附件 -->
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
:deep(.el-upload--picture-card) {
  width: 100px;
  height: 100px;
}

:deep(.el-upload-list--picture-card .el-upload-list__item) {
  width: 100px;
  height: 100px;
}
</style>
