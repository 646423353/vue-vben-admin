<script lang="ts" setup>
import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { ElForm, ElFormItem, ElInput, ElMessage } from 'element-plus';

import { CaseSetApi } from '#/api/core/case-set';

defineOptions({
  name: 'DetailTemplateModal',
});

const emit = defineEmits(['success']);

const formRef = ref();
const isView = ref(false);
const formModel = ref({
  id: 0,
  title: '',
  moban: '',
});

const [Modal, modalApi] = useVbenModal({
  onCancel() {
    modalApi.close();
  },
  onConfirm: async () => {
    if (isView.value) {
      modalApi.close();
      return;
    }
    try {
      await formRef.value?.validate();
      modalApi.setState({ loading: true, confirmLoading: true });
      await CaseSetApi.updateMoneyItem({
        id: formModel.value.id,
        moban: formModel.value.moban,
      });
      ElMessage.success('设置成功');
      emit('success', {
        id: formModel.value.id,
        moban: formModel.value.moban,
      });
      modalApi.close();
    } catch (error) {
      console.error(error);
    } finally {
      modalApi.setState({ loading: false, confirmLoading: false });
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      const { row, isView: viewMode } = modalApi.getData<any>();
      isView.value = !!viewMode;
      formModel.value = {
        id: row.id,
        title: row.title,
        moban: row.moban || '',
      };
      modalApi.setState({
        title: isView.value ? '详细测算模板' : '设置详细测算模板',
        showConfirmButton: !isView.value,
        cancelText: isView.value ? '关闭' : '取消',
      });
    }
  },
});
</script>

<template>
  <Modal>
    <div class="px-6 py-4">
      <div class="mb-4 rounded bg-blue-50 p-3 text-sm text-blue-600">
        说明：请输入完整的测算说明，用于在定损时辅助计算。
      </div>
      <ElForm ref="formRef" :model="formModel" label-width="120px">
        <ElFormItem label="项目名称">
          <ElInput v-model="formModel.title" disabled />
        </ElFormItem>
        <ElFormItem
          label="测算模板说明"
          prop="moban"
          :rules="[
            { required: !isView, message: '请输入测算说明', trigger: 'blur' },
          ]"
        >
          <ElInput
            v-model="formModel.moban"
            :autosize="{ minRows: 6, maxRows: 10 }"
            :readonly="isView"
            placeholder="请输入完整测算说明..."
            type="textarea"
          />
        </ElFormItem>
      </ElForm>
    </div>
  </Modal>
</template>
