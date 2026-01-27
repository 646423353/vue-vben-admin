<script lang="ts" setup>
import type { FormInstance, FormRules } from 'element-plus';

import type { CaseAlarmApi } from '#/api/core/case-alarm';

import { reactive, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { ElForm, ElFormItem, ElInput, ElMessage } from 'element-plus';

import { addRiskRuleApi, updateRiskRuleApi } from '#/api/core/case-alarm';

const emit = defineEmits(['reload']);

const formRef = ref<FormInstance>();
const form = reactive<CaseAlarmApi.TbCaseSettingRules>({
  id: undefined,
  title: '',
  funct: '',
  comments: '',
});

const rules = reactive<FormRules<CaseAlarmApi.TbCaseSettingRules>>({
  title: [{ required: true, message: '请输入规则名称', trigger: 'blur' }],
  funct: [{ required: true, message: '请输入计算规则', trigger: 'blur' }],
  comments: [{ required: true, message: '请输入提示文字', trigger: 'blur' }],
});

const loading = ref<boolean>(false);
const isEdit = ref<boolean>(false);

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
      const data = modalApi.getData<CaseAlarmApi.TbCaseSettingRules>();
      if (data && data.id) {
        isEdit.value = true;
        Object.assign(form, data);
        modalApi.setState({ title: '编辑风险预警规则' });
      } else {
        isEdit.value = false;
        resetForm(formRef.value);
        modalApi.setState({ title: '新建风险预警规则' });
      }
    }
  },
  title: '新建风险预警规则',
  class: 'w-[600px]',
});

function resetForm(formEl: FormInstance | undefined) {
  if (!formEl) return;
  formEl.resetFields();
  form.id = undefined;
  form.title = '';
  form.funct = '';
  form.comments = '';
}

async function submitForm(formEl: FormInstance | undefined) {
  if (!formEl) return;
  await formEl.validate(async (valid) => {
    if (valid) {
      loading.value = true;
      try {
        const payload: CaseAlarmApi.RiskRuleAddParams = {
          title: form.title,
          funct: form.funct,
          comments: form.comments,
        };

        if (isEdit.value && form.id) {
          await updateRiskRuleApi({ ...payload, id: form.id });
          ElMessage.success('更新成功');
        } else {
          await addRiskRuleApi(payload);
          ElMessage.success('保存成功');
        }

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
        <ElFormItem label="规则名称" prop="title">
          <ElInput v-model="form.title" placeholder="请输入规则名称" />
        </ElFormItem>

        <ElFormItem label="计算规则" prop="funct">
          <ElInput
            v-model="form.funct"
            type="textarea"
            :rows="3"
            placeholder="例如：{骑手历史案件数} > 10 则 进行风险预警"
          />
        </ElFormItem>

        <ElFormItem label="提示文字" prop="comments">
          <ElInput
            v-model="form.comments"
            placeholder="例如：案件预警-骑手大量报案!"
          />
        </ElFormItem>
      </ElForm>
    </div>
  </Modal>
</template>
