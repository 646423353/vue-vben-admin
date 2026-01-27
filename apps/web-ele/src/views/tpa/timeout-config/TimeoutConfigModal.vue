<script lang="ts" setup>
import type { CaseTimeoutApi } from '#/api/core/case-timeout';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { ElForm, ElFormItem, ElInputNumber, ElMessage } from 'element-plus';

import { updateTimeoutApi } from '#/api/core/case-timeout';

const emit = defineEmits<{
  register: [];
  success: [];
}>();

const formRef = ref();
const loading = ref(false);

const form = ref<CaseTimeoutApi.TbCaseSettingTimeout>({});

const paramLabel = ref('');

const [Modal, modalApi] = useVbenModal({
  onCancel: () => {
    formRef.value?.resetFields();
    modalApi.close();
  },
  onConfirm: async () => {
    try {
      await formRef.value?.validate();
      loading.value = true;

      await updateTimeoutApi(form.value);

      ElMessage.success('修改成功');
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
      const data = modalApi.getData<CaseTimeoutApi.TbCaseSettingTimeout>();
      if (data) {
        paramLabel.value = data.title || '';
        form.value = { ...data };
        modalApi.setState({ title: `修改${data.title}` });
      }
    }
  },
});
</script>

<template>
  <Modal>
    <div class="p-6">
      <ElForm ref="formRef" :model="form" label-width="140px">
        <ElFormItem
          :label="paramLabel"
          :rules="[
            { required: true, message: '请输入小时数', trigger: 'blur' },
            {
              type: 'number',
              min: 1,
              message: '小时数必须大于0',
              trigger: 'blur',
            },
          ]"
          prop="hours"
        >
          <ElInputNumber
            v-model="form.hours"
            :min="1"
            :step="1"
            placeholder="请输入小时数"
            class="!w-full"
          />
        </ElFormItem>
      </ElForm>
    </div>
  </Modal>
</template>
