<script lang="ts" setup>
import type { FormInstance, FormRules } from 'element-plus';

import { reactive, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { ElForm, ElFormItem, ElInput, ElMessage } from 'element-plus';

const emit = defineEmits(['reload']);

interface RiskRuleForm {
  code: string;
  rule: string;
  message: string;
  status: boolean;
}

const formRef = ref<FormInstance>();
const form = reactive<RiskRuleForm>({
  code: '',
  rule: '',
  message: '',
  status: true,
});

const rules = reactive<FormRules<RiskRuleForm>>({
  code: [{ required: true, message: '请输入规则编号', trigger: 'blur' }],
  rule: [{ required: true, message: '请输入计算规则', trigger: 'blur' }],
  message: [{ required: true, message: '请输入提示文字', trigger: 'blur' }],
});

const loading = ref<boolean>(false);

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
      // Can handle edit mode here if needed later
      modalApi.setState({ title: '新建风险预警规则' });
    }
  },
  title: '新建风险预警规则',
  class: 'w-[600px]',
});

function resetForm(formEl: FormInstance | undefined) {
  if (!formEl) return;
  formEl.resetFields();
  form.status = true;
}

async function submitForm(formEl: FormInstance | undefined) {
  if (!formEl) return;
  await formEl.validate(async (valid) => {
    if (valid) {
      loading.value = true;
      try {
        // Mock API call
        await new Promise((resolve) => setTimeout(resolve, 500));

        ElMessage.success('保存成功');
        emit('reload');
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
</script>

<template>
  <Modal>
    <div class="p-6" v-loading="loading">
      <ElForm ref="formRef" :model="form" :rules="rules" label-width="100px">
        <ElFormItem label="规则编号" prop="code">
          <ElInput v-model="form.code" placeholder="例如：00004" />
        </ElFormItem>

        <ElFormItem label="计算规则" prop="rule">
          <ElInput
            v-model="form.rule"
            type="textarea"
            :rows="3"
            placeholder="例如：{骑手历史案件数} > 10 则 进行风险预警"
          />
        </ElFormItem>

        <ElFormItem label="提示文字" prop="message">
          <ElInput
            v-model="form.message"
            placeholder="例如：案件预警-骑手大量报案!"
          />
        </ElFormItem>
      </ElForm>
    </div>
  </Modal>
</template>
