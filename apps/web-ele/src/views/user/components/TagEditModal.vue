<script lang="ts" setup>
import type { FormInstance, FormRules } from 'element-plus';

import { reactive, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { ElForm, ElFormItem, ElInput, ElMessage } from 'element-plus';

import { TagAddApi, TagUpdateApi } from '#/api/core/tags';

const emit = defineEmits(['reloadList']);

interface TagForm {
  name: string;
}

const tagFormRef = ref<FormInstance>();
const tagForm = reactive<TagForm>({
  name: '',
});

const rules = reactive<FormRules<TagForm>>({
  name: [
    {
      required: true,
      message: '请输入分组名称',
      trigger: 'blur',
    },
  ],
});

const id = ref<string>('');
const loading = ref<boolean>(false);

const [Modal, modalApi] = useVbenModal({
  onCancel() {
    resetForm(tagFormRef.value);
    id.value = '';
    modalApi.close();
  },
  onConfirm() {
    if (id.value) {
      updateForm(tagFormRef.value);
    } else {
      submitForm(tagFormRef.value);
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (isOpen) {
      const { id: uid, name } = modalApi.getData<Record<string, any>>();
      id.value = uid;

      loading.value = true;
      if (uid) {
        modalApi.setState({ title: '编辑分组' });
        tagForm.name = name;
        tagFormRef.value?.clearValidate();
      }
      loading.value = false;
    }
  },
  title: '新建分组',
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
      await TagAddApi(tagForm);
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

async function updateForm(formEl: FormInstance | undefined) {
  if (!formEl) return;
  await formEl.validate(async (valid, fields) => {
    if (valid) {
      await TagUpdateApi({
        ...tagForm,
        id: Number(id.value),
      });
      ElMessage.success('更新成功');
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
        ref="tagFormRef"
        :model="tagForm"
        :rules="rules"
        class="demo-tagForm"
        label-width="auto"
        status-icon
      >
        <ElFormItem label="分组名称" prop="name">
          <ElInput v-model="tagForm.name" placeholder="请输入" />
        </ElFormItem>
      </ElForm>
    </div>
  </Modal>
</template>
