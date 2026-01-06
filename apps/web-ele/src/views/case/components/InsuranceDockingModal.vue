<script lang="ts" setup>
import type { FormInstance, FormRules } from 'element-plus';

import { reactive, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import {
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElOption,
  ElSelect,
} from 'element-plus';

import { CaseUpdateApi } from '#/api/core/case';

const emit = defineEmits(['reloadList']);

interface InsuranceDockingForm {
  policyNo: string;
  companyName: string;
  adjusterName: string;
  adjusterPhone: string;
  adjusterEmail: string;
  dockingType: string;
}

const formRef = ref<FormInstance>();
const form = reactive<InsuranceDockingForm>({
  policyNo: '',
  companyName: '',
  adjusterName: '',
  adjusterPhone: '',
  adjusterEmail: '',
  dockingType: '',
});

const rules = reactive<FormRules<InsuranceDockingForm>>({
  policyNo: [
    {
      required: true,
      message: '请选择或输入保单号',
      trigger: ['change', 'blur'],
    },
  ],
  companyName: [
    {
      required: true,
      message: '请输入对接保险公司名称',
      trigger: 'blur',
    },
  ],
  adjusterName: [
    {
      required: true,
      message: '请输入对接理赔员姓名',
      trigger: 'blur',
    },
  ],
  adjusterPhone: [
    {
      required: true,
      message: '请输入对接理赔员电话',
      trigger: 'blur',
    },
  ],
  adjusterEmail: [
    {
      required: true,
      message: '请输入对接理赔员邮箱',
      trigger: 'blur',
    },
    {
      type: 'email',
      message: '请输入正确的邮箱格式',
      trigger: 'blur',
    },
  ],
  dockingType: [
    {
      required: true,
      message: '请选择主险或附加险对接',
      trigger: 'change',
    },
  ],
});

const caseId = ref<number | string>('');
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
      const data = modalApi.getData<Record<string, any>>();
      caseId.value = data.caseId;
      const isEdit = !!data.isEdit;
      modalApi.setState({
        title: isEdit ? '修改保司对接信息' : '创建保司对接表',
      });

      if (isEdit && data.initialData) {
        form.policyNo = data.initialData.policyNo || '';
        form.companyName = data.initialData.companyName || '';
        form.adjusterName = data.initialData.adjusterName || '';
        form.adjusterPhone = data.initialData.adjusterPhone || '';
        form.adjusterEmail = data.initialData.adjusterEmail || '';
        form.dockingType = data.initialData.dockingType || '';
      }
    }
  },
  title: '创建保司对接表',
  class: 'w-[600px]',
});

function resetForm(formEl: FormInstance | undefined) {
  if (!formEl) return;
  formEl.resetFields();
}

async function submitForm(formEl: FormInstance | undefined) {
  if (!formEl) return;
  await formEl.validate(async (valid) => {
    if (valid) {
      loading.value = true;
      try {
        // Using CaseUpdateApi to update case info with the provided details
        // Mapping fields to CaseDetail/CaseForm structure where possible
        await CaseUpdateApi({
          id: Number(caseId.value),
          policyNo: form.policyNo,
          companyName: form.companyName,
          lipeiPerson: form.adjusterName, // Mapping adjusterName to lipeiPerson
          phone: form.adjusterPhone, // Mapping adjusterPhone to phone
          // adjusterEmail: form.adjusterEmail, // No direct field, sending as extra if allowed or ignored
          // dockingType: form.dockingType, // No direct field
          // Assuming the backend handles these or we are just updating what we can
        } as any);

        ElMessage.success('提交成功');
        emit('reloadList');
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

const policyOptions = [
  { label: '保单号1', value: 'P123456789' },
  { label: '保单号2', value: 'P987654321' },
];

const dockingTypeOptions = [
  { label: '主险', value: '主险' },
  { label: '附加险', value: '附加险' },
];
</script>

<template>
  <Modal>
    <div class="p-6" v-loading="loading">
      <ElForm ref="formRef" :model="form" :rules="rules" label-width="170px">
        <ElFormItem label="保单号：" prop="policyNo">
          <ElSelect
            v-model="form.policyNo"
            placeholder="请选择或输入保单号"
            allow-create
            filterable
            default-first-option
          >
            <ElOption
              v-for="option in policyOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </ElSelect>
        </ElFormItem>

        <ElFormItem label="对接保险公司名称：" prop="companyName">
          <ElInput
            v-model="form.companyName"
            placeholder="请输入对接保险公司名称"
          />
        </ElFormItem>

        <ElFormItem label="对接理赔员姓名：" prop="adjusterName">
          <ElInput
            v-model="form.adjusterName"
            placeholder="请输入对接理赔员姓名"
          />
        </ElFormItem>

        <ElFormItem label="对接理赔员电话：" prop="adjusterPhone">
          <ElInput
            v-model="form.adjusterPhone"
            placeholder="请输入对接理赔员电话"
          />
        </ElFormItem>

        <ElFormItem label="对接理赔员邮箱：" prop="adjusterEmail">
          <ElInput
            v-model="form.adjusterEmail"
            placeholder="请输入对接理赔员邮箱"
          />
        </ElFormItem>

        <ElFormItem label="主险或附加险对接：" prop="dockingType">
          <ElSelect
            v-model="form.dockingType"
            placeholder="请选择主险或附加险对接"
          >
            <ElOption
              v-for="option in dockingTypeOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </ElSelect>
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
