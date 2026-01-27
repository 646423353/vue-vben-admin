<script lang="ts" setup>
import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { ElForm, ElFormItem, ElInput, ElMessage, ElSwitch } from 'element-plus';

import { CaseExceptionApi } from '#/api/core/case-exception';

const emit = defineEmits(['success', 'register']);

const formRef = ref();
const loading = ref(false);

interface ExceptionReason {
  id?: number;
  title?: string;
  comments?: string;
  status?: number;
}

const form = ref<ExceptionReason>({
  id: undefined,
  title: '',
  comments: '',
  status: 1,
});

const isEdit = computed(() => !!form.value.id);

const [Modal, modalApi] = useVbenModal({
  onCancel: () => {
    formRef.value?.resetFields();
    form.value = { status: 1 };
    modalApi.close();
  },
  onConfirm: async () => {
    try {
      await formRef.value?.validate();
      loading.value = true;
      if (isEdit.value) {
        await CaseExceptionApi.updateExceptionReason(form.value);
        ElMessage.success('修改成功');
      } else {
        await CaseExceptionApi.addExceptionReason(form.value);
        ElMessage.success('添加成功');
      }
      emit('success');
      modalApi.close();
    } catch (error) {
      console.error(error);
    } finally {
      loading.value = false;
    }
  },
  onOpenChange: (isOpen) => {
    if (isOpen) {
      const data = modalApi.getData<ExceptionReason>();
      modalApi.setState({ title: data ? '编辑异常原因' : '新增异常原因' });
      form.value = data ? { ...data } : { status: 1 };
    }
  },
});
</script>

<template>
  <Modal>
    <div class="p-6">
      <ElForm ref="formRef" :model="form" label-width="120px">
        <ElFormItem
          :rules="[
            { required: true, message: '请输入异常原因名称', trigger: 'blur' },
          ]"
          label="异常原因名称"
          prop="title"
        >
          <ElInput v-model="form.title" placeholder="请输入异常原因名称" />
        </ElFormItem>
        <ElFormItem label="备注" prop="comments">
          <ElInput
            v-model="form.comments"
            :rows="3"
            placeholder="请输入备注"
            type="textarea"
          />
        </ElFormItem>
        <ElFormItem label="状态" prop="status">
          <ElSwitch
            v-model="form.status"
            :active-value="1"
            :inactive-value="0"
            active-text="正常"
            inactive-text="停用"
          />
        </ElFormItem>
      </ElForm>
    </div>
  </Modal>
</template>
